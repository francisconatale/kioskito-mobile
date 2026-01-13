import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { createGenericRepository } from './genericDb';

// Migration helper - usually you'd have a better migration system
// For now we just add columns if they don't exist in init
// But since the user accepted nuking DB, we rely on CREATE TABLE IF NOT EXISTS
// However, if table exists without new column, it won't add it.
// We should perhaps blindly try to add columns or handle versions.
// Given previous instructions, I will assume tables are recreated or user cleared data.


let db;

const getDB = async () => {
    if (db) return db;

    // If a database instance exists in global scope (from HMR), close it first
    if (global._kioskito_db_instance) {
        try {
            console.log('Closing stale DB connection from HMR...');
            await global._kioskito_db_instance.closeAsync();
        } catch (e) {
            console.warn('Error closing stale DB:', e);
        }
        global._kioskito_db_instance = null;
    }

    db = await SQLite.openDatabaseAsync('kioskito_v7.db');
    global._kioskito_db_instance = db;
    return db;
};

export const clearDatabase = async () => {
    const database = await getDB();
    try {
        // Drop tables to ensure clean schema on recreation
        // execAsync is already atomic and handles multiple statements better outside manual transitions in some versions of expo-sqlite
        await database.execAsync(`
            DROP TABLE IF EXISTS detalle_ventas;
            DROP TABLE IF EXISTS ventas;
            DROP TABLE IF EXISTS movimientos_stock;
            DROP TABLE IF EXISTS productos;
            DROP TABLE IF EXISTS clientes;
        `);

        // Re-initialize after drop
        await initDB();
        return { success: true, message: 'Base de datos reiniciada correctamente' };
    } catch (error) {
        console.error('Error clearing database:', error);
        return { success: false, message: 'Error al reiniciar la base de datos: ' + error.message };
    }
};

export const initDB = async () => {
    const database = await getDB();
    try {
        await database.execAsync(`
            CREATE TABLE IF NOT EXISTS clientes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                nombre TEXT NOT NULL,
                email TEXT,
                telefono TEXT,
                deuda REAL DEFAULT 0,
                synced INTEGER DEFAULT 0,
                deleted INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS productos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                nombre TEXT NOT NULL,
                marca TEXT,
                descripcion TEXT,
                precio REAL NOT NULL,
                stock INTEGER NOT NULL,
                codigo_barra TEXT UNIQUE,
                synced INTEGER DEFAULT 0,
                deleted INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS ventas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                fecha TEXT NOT NULL,
                monto_total REAL NOT NULL,
                metodo_pago TEXT NOT NULL,
                cliente_id INTEGER,
                usuario_id INTEGER,
                tipo TEXT DEFAULT 'VENTA',
                synced INTEGER DEFAULT 0,
                deleted INTEGER DEFAULT 0,
                FOREIGN KEY (cliente_id) REFERENCES clientes(id)
            );

            CREATE TABLE IF NOT EXISTS detalle_ventas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                venta_id INTEGER NOT NULL,
                producto_id INTEGER NOT NULL,
                cantidad INTEGER NOT NULL,
                precio_unitario REAL NOT NULL,
                subtotal REAL NOT NULL,
                FOREIGN KEY (venta_id) REFERENCES ventas(id),
                FOREIGN KEY (producto_id) REFERENCES productos(id)
            );

            CREATE TABLE IF NOT EXISTS movimientos_stock (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                producto_id INTEGER NOT NULL,
                tipo TEXT NOT NULL,
                cantidad INTEGER NOT NULL,
                motivo TEXT,
                fecha TEXT NOT NULL,
                synced INTEGER DEFAULT 0,
                FOREIGN KEY (producto_id) REFERENCES productos(id)
            );
        `);
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
};

const mapProductoFromDB = (p) => ({
    ...p,
    codigoBarras: p.codigo_barra,
});

const mapVentaFromDB = (v, detalles = []) => ({
    ...v,
    metodoPago: v.metodo_pago || v.metodo_pago, // Normalize for UI
    clienteId: v.cliente_id || v.clienteId, // Normalize for UI
    clienteUuid: v.cliente_uuid || v.clienteUuid,
    tipo: v.tipo || 'VENTA',
    total: v.monto_total,
    date: v.fecha,
    items: detalles.map(d => ({
        productId: d.producto_id,
        productUuid: d.producto_uuid,
        productName: d.nombre_producto, // Requires join
        productoMarca: d.marca_producto,
        productoDescripcion: d.descripcion_producto,
        price: d.precio_unitario,
        quantity: d.cantidad,
        subtotal: d.subtotal
    }))
});

const genericProductos = createGenericRepository('productos', getDB, mapProductoFromDB);

export const productosAPI = {
    ...genericProductos,

    search: async (query) => {
        const database = await getDB();
        const search = `%${query}%`;
        const rows = await database.getAllAsync(
            'SELECT * FROM productos WHERE nombre LIKE ? OR marca LIKE ? OR codigo_barra LIKE ?',
            [search, search, search]
        );
        return rows.map(mapProductoFromDB);
    },

    create: async (producto) => {
        // Adapt field name for generic create
        const data = {
            ...producto,
            codigo_barra: producto.codigoBarras ? producto.codigoBarras.trim() || null : null
        };
        delete data.codigoBarras;
        return genericProductos.create(data);
    },

    update: async (id, producto) => {
        const data = {
            ...producto,
            codigo_barra: producto.codigoBarras ? producto.codigoBarras.trim() || null : null
        };
        delete data.codigoBarras;
        return genericProductos.update(id, data);
    },

    getByBarcode: async (codigoBarra) => {
        const database = await getDB();
        const row = await database.getFirstAsync('SELECT * FROM productos WHERE codigo_barra = ?', [codigoBarra]);
        return row ? mapProductoFromDB(row) : null;
    },

    lookupBarcode: async (code) => {
        return productosAPI.getByBarcode(code);
    },

    getLowStock: async (threshold = 10) => {
        const database = await getDB();
        const rows = await database.getAllAsync('SELECT * FROM productos WHERE stock <= ?', [threshold]);
        return rows.map(mapProductoFromDB);
    },

    // Bulk upsert for Sync Down with cleanup
    upsertProducts: async (products) => {
        const database = await getDB();
        try {
            await database.withTransactionAsync(async () => {
                const cloudUuids = products.map(p => p.uuid);

                const localSyncedProducts = await database.getAllAsync(
                    'SELECT uuid FROM productos WHERE synced = 1'
                );

                const localUuids = localSyncedProducts.map(p => p.uuid);
                const uuidsToDelete = localUuids.filter(uuid => !cloudUuids.includes(uuid));

                if (uuidsToDelete.length > 0) {
                    const placeholders = uuidsToDelete.map(() => '?').join(',');
                    await database.runAsync(
                        `DELETE FROM productos WHERE uuid IN (${placeholders})`,
                        uuidsToDelete
                    );
                    console.log(`Deleted ${uuidsToDelete.length} products no longer in cloud`);
                }

                for (const p of products) {
                    const row = await database.getFirstAsync('SELECT id FROM productos WHERE uuid = ?', [p.uuid]);
                    const codigoBarra = p.codigoBarras || p.codigoBarra;

                    if (row) {
                        // Update
                        await database.runAsync(
                            'UPDATE productos SET nombre = ?, marca = ?, descripcion = ?, precio = ?, stock = ?, codigo_barra = ?, synced = 1, deleted = 0 WHERE uuid = ?',
                            [p.nombre, p.marca, p.descripcion, p.precio, p.stock, codigoBarra, p.uuid]
                        );
                    } else {
                        // Insert
                        await database.runAsync(
                            'INSERT INTO productos (uuid, nombre, marca, descripcion, precio, stock, codigo_barra, synced, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)',
                            [p.uuid, p.nombre, p.marca, p.descripcion, p.precio, p.stock, codigoBarra]
                        );
                    }
                }
            });
            return { success: true };
        } catch (e) {
            console.error("Bulk upsert error:", e);
            throw e;
        }
    }
};

export const ventasAPI = {
    getAll: async () => {
        const database = await getDB();
        const ventas = await database.getAllAsync('SELECT * FROM ventas ORDER BY fecha DESC');

        // This is N+1 but efficient enough for local sqlite usually. 
        // Can be optimized with a single JOIN query grouping results.
        const ventasWithDetails = await Promise.all(ventas.map(async (v) => {
            const detalles = await database.getAllAsync(`
                SELECT dv.*, p.nombre as nombre_producto, p.marca as marca_producto, p.descripcion as descripcion_producto 
                FROM detalle_ventas dv 
                LEFT JOIN productos p ON dv.producto_id = p.id 
                WHERE dv.venta_id = ?
            `, [v.id]);
            return mapVentaFromDB(v, detalles);
        }));

        return ventasWithDetails;
    },

    create: async (venta) => {
        const database = await getDB();
        try {
            return await database.withTransactionAsync(async () => {
                const uuid = venta.uuid || Crypto.randomUUID();
                const result = await database.runAsync(
                    'INSERT INTO ventas (uuid, fecha, monto_total, metodo_pago, cliente_id, usuario_id, tipo, synced) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
                    [uuid, venta.fecha, venta.montoTotal, venta.metodoPago, venta.clienteId, venta.usuarioId, venta.tipo]
                );
                const ventaId = result.lastInsertRowId;

                for (const detalle of venta.detalles) {
                    const subtotal = detalle.cantidad * detalle.precioUnitario;
                    await database.runAsync(
                        'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
                        [ventaId, detalle.productoId, detalle.cantidad, detalle.precioUnitario, subtotal]
                    );

                    await database.runAsync(
                        'UPDATE productos SET stock = stock - ? WHERE id = ?',
                        [detalle.cantidad, detalle.productoId]
                    );

                    // Record movement
                    const movUuid = Crypto.randomUUID();
                    await database.runAsync(
                        'INSERT INTO movimientos_stock (uuid, producto_id, tipo, cantidad, motivo, fecha, synced) VALUES (?, ?, ?, ?, ?, ?, 0)',
                        [movUuid, detalle.productoId, 'SALIDA', detalle.cantidad, 'VENTA', venta.fecha]
                    );
                }

                // Handle debt update if FIADO
                if (venta.metodoPago && venta.metodoPago.toUpperCase() === 'FIADO' && venta.clienteId) {
                    await database.runAsync(
                        'UPDATE clientes SET deuda = deuda + ?, synced = 0 WHERE id = ?',
                        [venta.montoTotal, venta.clienteId]
                    );
                }
                return { id: ventaId, ...venta, uuid, synced: 0 };
            });
        } catch (error) {
            throw error;
        }
    },

    delete: async (id) => {
        const database = await getDB();
        try {
            await database.withTransactionAsync(async () => {
                // Get details to restore stock
                const detalles = await database.getAllAsync('SELECT * FROM detalle_ventas WHERE venta_id = ?', [id]);
                for (const d of detalles) {
                    await database.runAsync('UPDATE productos SET stock = stock + ? WHERE id = ?', [d.cantidad, d.producto_id]);
                }

                // Check if it was FIADO to restore debt? 
                // Currently NOT implemented as we'd need to fetch the sale type first.
                // Assuming simple deletion for now.

                await database.runAsync('DELETE FROM detalle_ventas WHERE venta_id = ?', [id]);
                await database.runAsync('DELETE FROM ventas WHERE id = ?', [id]);
            });
        } catch (e) {
            throw e;
        }
    },

    getPending: async () => {
        const database = await getDB();
        // We need details too, AND client UUID for sync
        const ventas = await database.getAllAsync(`
            SELECT v.*, c.uuid as cliente_uuid 
            FROM ventas v 
            LEFT JOIN clientes c ON v.cliente_id = c.id 
            WHERE v.synced = 0
        `);

        return await Promise.all(ventas.map(async (v) => {
            const detalles = await database.getAllAsync(`
                SELECT dv.*, p.nombre as nombre_producto, p.marca as marca_producto, p.codigo_barra, p.uuid as producto_uuid 
                FROM detalle_ventas dv 
                LEFT JOIN productos p ON dv.producto_id = p.id 
                WHERE dv.venta_id = ?
            `, [v.id]);
            return mapVentaFromDB(v, detalles);
        }));
    },

    markSynced: async (uuids) => {
        if (!uuids || uuids.length === 0) return;
        const database = await getDB();
        const placeholders = uuids.map(() => '?').join(',');

        // Mark ventas as synced
        await database.runAsync(
            `UPDATE ventas SET synced = 1 WHERE uuid IN (${placeholders})`,
            uuids
        );

        // Also mark associated stock movements as synced
        // This prevents the SALIDA movements created by sales from being uploaded again
        await database.runAsync(
            `UPDATE movimientos_stock SET synced = 1 WHERE motivo LIKE 'VENTA%' AND synced = 0`
        );
    },

    restore: async (venta) => {
        const database = await getDB();
        try {
            await database.withTransactionAsync(async () => {
                // Raw Insert without side effects (stock update or debt update)
                // We assume stock and debt are restored by their respective restore actions (products snapshot and clients snapshot)

                // We use new IDs for simplicity unless we want to force ID which risks collision
                const uuid = venta.uuid || Crypto.randomUUID();
                const result = await database.runAsync(
                    'INSERT INTO ventas (uuid, fecha, monto_total, metodo_pago, cliente_id, tipo) VALUES (?, ?, ?, ?, ?, ?)',
                    [uuid, venta.date, venta.total, venta.metodoPago || venta.metodo_pago, venta.clienteId || venta.cliente_id, venta.tipo]
                );
                const ventaId = result.lastInsertRowId;

                if (venta.items) {
                    for (const detalle of venta.items) {
                        await database.runAsync(
                            'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
                            [ventaId, detalle.productId || detalle.producto_id, detalle.quantity || detalle.cantidad, detalle.price || detalle.precio_unitario, detalle.subtotal]
                        );
                    }
                }
            });
        } catch (e) {
            console.error("Error restoring sale:", e);
            // Non-blocking, continue
        }
    }
};

const genericClientes = createGenericRepository('clientes', getDB);

export const clientesAPI = {
    ...genericClientes,

    search: async (query) => {
        const database = await getDB();
        const search = `%${query}%`;
        return await database.getAllAsync(
            'SELECT * FROM clientes WHERE nombre LIKE ? OR email LIKE ?',
            [search, search]
        );
    },

    registrarPago: async (id, monto) => {
        const database = await getDB();
        await database.runAsync(
            'UPDATE clientes SET deuda = deuda - ?, synced = 0 WHERE id = ?',
            [monto, id]
        );
        return { success: true };
    },

    getPending: async () => {
        const database = await getDB();
        return await database.getAllAsync('SELECT * FROM clientes WHERE synced = 0');
    },

    markSynced: async (uuids) => {
        if (!uuids || uuids.length === 0) return;
        const database = await getDB();
        const placeholders = uuids.map(() => '?').join(',');
        await database.runAsync(
            `UPDATE clientes SET synced = 1 WHERE uuid IN (${placeholders})`,
            uuids
        );
    },

    // Bulk upsert for Sync Down with cleanup
    upsertClients: async (clients) => {
        const database = await getDB();
        try {
            await database.withTransactionAsync(async () => {
                // Get all cloud UUIDs
                const cloudUuids = clients.map(c => c.uuid);

                // Get all local clients that are synced (came from cloud originally)
                const localSyncedClients = await database.getAllAsync(
                    'SELECT uuid FROM clientes WHERE synced = 1'
                );

                // Find clients to delete (exist locally but not in cloud)
                const localUuids = localSyncedClients.map(c => c.uuid);
                const uuidsToDelete = localUuids.filter(uuid => !cloudUuids.includes(uuid));

                // Delete clients that no longer exist in cloud
                if (uuidsToDelete.length > 0) {
                    const placeholders = uuidsToDelete.map(() => '?').join(',');
                    await database.runAsync(
                        `DELETE FROM clientes WHERE uuid IN (${placeholders})`,
                        uuidsToDelete
                    );
                    console.log(`Deleted ${uuidsToDelete.length} clients no longer in cloud`);
                }

                // Now upsert the clients from cloud
                for (const c of clients) {
                    const row = await database.getFirstAsync('SELECT id FROM clientes WHERE uuid = ?', [c.uuid]);
                    if (row) {
                        await database.runAsync(
                            'UPDATE clientes SET nombre = ?, email = ?, telefono = ?, deuda = ?, synced = 1, deleted = 0 WHERE uuid = ?',
                            [c.nombre, c.email, c.telefono, c.deuda, c.uuid]
                        );
                    } else {
                        await database.runAsync(
                            'INSERT INTO clientes (uuid, nombre, email, telefono, deuda, synced, deleted) VALUES (?, ?, ?, ?, ?, 1, 0)',
                            [c.uuid, c.nombre, c.email, c.telefono, c.deuda]
                        );
                    }
                }
            });
            return { success: true };
        } catch (e) {
            console.error("Bulk upsert clients error:", e);
            throw e;
        }
    }
};

export const movimientosStockAPI = {
    getAll: async () => {
        const database = await getDB();
        // Join with products to get names
        const rows = await database.getAllAsync(`
            SELECT m.*, p.nombre as producto_nombre 
            FROM movimientos_stock m 
            JOIN productos p ON m.producto_id = p.id 
            ORDER BY m.fecha DESC
        `);
        return rows.map(r => ({
            id: r.id,
            productoId: r.producto_id,
            productoNombre: r.producto_nombre,
            tipo: r.tipo,
            cantidad: r.cantidad,
            motivo: r.motivo,
            fecha: r.fecha
        }));
    },

    create: async (mov) => {
        const database = await getDB();
        try {
            await database.withTransactionAsync(async () => {
                const uuid = mov.uuid || Crypto.randomUUID();
                await database.runAsync(
                    'INSERT INTO movimientos_stock (uuid, producto_id, tipo, cantidad, motivo, fecha, synced) VALUES (?, ?, ?, ?, ?, ?, 0)',
                    [uuid, mov.productoId, mov.tipo, mov.cantidad, mov.motivo, mov.fecha]
                );

                const operator = mov.tipo === 'ENTRADA' ? '+' : '-';
                // Also mark product as unsynced (stock changed)
                await database.runAsync(
                    `UPDATE productos SET stock = stock ${operator} ?, synced = 0 WHERE id = ?`,
                    [mov.cantidad, mov.productoId]
                );
            });
            return { success: true };
        } catch (e) {
            throw e;
        }
    },

    getPending: async () => {
        const database = await getDB();
        // CRITICAL: Do NOT sync stock movements created by sales
        // The backend will create them automatically when processing the sale
        // Only sync MANUAL movements (restocks, adjustments, etc.)
        const rows = await database.getAllAsync(`
            SELECT m.*, p.uuid as producto_uuid 
            FROM movimientos_stock m
            JOIN productos p ON m.producto_id = p.id
            WHERE m.synced = 0 
            AND (m.motivo IS NULL OR m.motivo NOT LIKE 'VENTA%')
        `);
        return rows.map(r => ({
            uuid: r.uuid,
            productoUuid: r.producto_uuid,
            tipo: r.tipo,
            cantidad: r.cantidad,
            motivo: r.motivo,
            fecha: r.fecha
        }));
    },

    markSynced: async (uuids) => {
        if (!uuids || uuids.length === 0) return;
        const database = await getDB();
        const placeholders = uuids.map(() => '?').join(',');
        await database.runAsync(
            `UPDATE movimientos_stock SET synced = 1 WHERE uuid IN (${placeholders})`,
            uuids
        );
    }
};
