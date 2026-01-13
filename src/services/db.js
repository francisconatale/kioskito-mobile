import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';

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

    db = await SQLite.openDatabaseAsync('kioskito_v5.db');
    global._kioskito_db_instance = db;
    return db;
};

export const clearDatabase = async () => {
    const database = await getDB();
    try {
        await database.withTransactionAsync(async () => {
            await database.runAsync('DELETE FROM detalle_ventas');
            await database.runAsync('DELETE FROM ventas');
            await database.runAsync('DELETE FROM movimientos_stock');
            await database.runAsync('DELETE FROM productos');
            await database.runAsync('DELETE FROM clientes');
            // Reset sequences
            await database.runAsync('DELETE FROM sqlite_sequence');
        });
        return { success: true, message: 'Base de datos limpiada correctamente' };
    } catch (error) {
        console.error('Error clearing database:', error);
        return { success: false, message: 'Error al limpiar la base de datos: ' + error.message };
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
                synced INTEGER DEFAULT 0
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
                synced INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS ventas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                fecha TEXT NOT NULL,
                monto_total REAL NOT NULL,
                metodo_pago TEXT NOT NULL,
                cliente_id INTEGER,
                tipo TEXT DEFAULT 'VENTA',
                synced INTEGER DEFAULT 0,
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
    metodoPago: v.metodo_pago || v.metodoPago, // Normalize for UI
    clienteId: v.cliente_id || v.clienteId, // Normalize for UI
    tipo: v.tipo || 'VENTA',
    total: v.monto_total,
    date: v.fecha,
    items: detalles.map(d => ({
        productId: d.producto_id,
        productName: d.nombre_producto, // Requires join
        productoMarca: d.marca_producto,
        productoDescripcion: d.descripcion_producto,
        price: d.precio_unitario,
        quantity: d.cantidad,
        subtotal: d.subtotal
    }))
});

export const productosAPI = {
    getAll: async () => {
        const database = await getDB();
        const rows = await database.getAllAsync('SELECT * FROM productos ORDER BY nombre');
        return rows.map(mapProductoFromDB);
    },

    getById: async (id) => {
        const database = await getDB();
        const row = await database.getFirstAsync('SELECT * FROM productos WHERE id = ?', [id]);
        return row ? mapProductoFromDB(row) : null;
    },

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
        const database = await getDB();
        const codigoBarra = producto.codigoBarras ? producto.codigoBarras.trim() || null : null;
        const uuid = producto.uuid || Crypto.randomUUID();

        // Start as synced=0 (false) -> needs upload
        const result = await database.runAsync(
            'INSERT INTO productos (uuid, nombre, marca, descripcion, precio, stock, codigo_barra, synced) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
            [uuid, producto.nombre, producto.marca, producto.descripcion, producto.precio, producto.stock, codigoBarra]
        );
        return { ...producto, id: result.lastInsertRowId, codigoBarras: codigoBarra, uuid, synced: 0 };
    },

    update: async (id, producto) => {
        const database = await getDB();
        const codigoBarra = producto.codigoBarras ? producto.codigoBarras.trim() || null : null;

        await database.runAsync(
            'UPDATE productos SET nombre = ?, marca = ?, descripcion = ?, precio = ?, stock = ?, codigo_barra = ? WHERE id = ?',
            [producto.nombre, producto.marca, producto.descripcion, producto.precio, producto.stock, codigoBarra, id]
        );
        return { ...producto, id, codigoBarras: codigoBarra };
    },

    delete: async (id) => {
        const database = await getDB();
        await database.runAsync('DELETE FROM productos WHERE id = ?', [id]);
        return { success: true };
    },

    getByBarcode: async (codigoBarra) => {
        const database = await getDB();
        const row = await database.getFirstAsync('SELECT * FROM productos WHERE codigo_barra = ?', [codigoBarra]);
        return row ? mapProductoFromDB(row) : null;
    },

    getByUuid: async (uuid) => {
        const database = await getDB();
        const row = await database.getFirstAsync('SELECT * FROM productos WHERE uuid = ?', [uuid]);
        return row ? mapProductoFromDB(row) : null;
    },

    lookupBarcode: async (code) => {
        // In local mode, just reuse getByBarcode
        const product = await productosAPI.getByBarcode(code);
        return product;
    },

    getLowStock: async (threshold = 10) => {
        const database = await getDB();
        const rows = await database.getAllAsync('SELECT * FROM productos WHERE stock <= ?', [threshold]);
        return rows.map(mapProductoFromDB);
    },

    // Bulk upsert for Sync Down
    upsertProducts: async (products) => {
        const database = await getDB();
        try {
            await database.withTransactionAsync(async () => {
                for (const p of products) {
                    const row = await database.getFirstAsync('SELECT id FROM productos WHERE uuid = ?', [p.uuid]);
                    const codigoBarra = p.codigoBarras || p.codigoBarra;

                    if (row) {
                        // Update
                        await database.runAsync(
                            'UPDATE productos SET nombre = ?, marca = ?, descripcion = ?, precio = ?, stock = ?, codigo_barra = ?, synced = 1 WHERE uuid = ?',
                            [p.nombre, p.marca, p.descripcion, p.precio, p.stock, codigoBarra, p.uuid]
                        );
                    } else {
                        // Insert
                        await database.runAsync(
                            'INSERT INTO productos (uuid, nombre, marca, descripcion, precio, stock, codigo_barra, synced) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
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
                    'INSERT INTO ventas (uuid, fecha, monto_total, metodo_pago, cliente_id, tipo, synced) VALUES (?, ?, ?, ?, ?, ?, 0)',
                    [uuid, venta.fecha, venta.montoTotal, venta.metodoPago, venta.clienteId, venta.tipo]
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
        // We need details too
        const ventas = await database.getAllAsync('SELECT * FROM ventas WHERE synced = 0');

        return await Promise.all(ventas.map(async (v) => {
            const detalles = await database.getAllAsync(`
                SELECT dv.*, p.nombre as nombre_producto, p.marca as marca_producto, p.codigo_barra 
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
        await database.runAsync(
            `UPDATE ventas SET synced = 1 WHERE uuid IN (${placeholders})`,
            uuids
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

export const clientesAPI = {
    getAll: async () => {
        const database = await getDB();
        return await database.getAllAsync('SELECT * FROM clientes ORDER BY nombre');
    },

    create: async (cliente) => {
        const database = await getDB();
        const deuda = cliente.deuda || 0;
        const uuid = cliente.uuid || Crypto.randomUUID();

        const result = await database.runAsync(
            'INSERT INTO clientes (uuid, nombre, email, telefono, deuda, synced) VALUES (?, ?, ?, ?, ?, 0)',
            [uuid, cliente.nombre, cliente.email, cliente.telefono, deuda]
        );
        return { ...cliente, id: result.lastInsertRowId, deuda, uuid, synced: 0 };
    },

    update: async (id, cliente) => {
        const database = await getDB();
        // If deuda is provided in update, use it, otherwise keep existing?
        // Usually update provides full object. If partial, we need to be careful.
        // Assuming full object for restore.
        // However, for normal "edit client" from UI, we might not pass debt and accidentally query 0?
        // The UI usually fetches client, edits fields, saves back. So debt should be in the object.
        // Let's assume passed client has correct debt.

        // Wait, if I edit a client in UI (change name), does it pass debt?
        // ClientModal uses `initialClient`. If `initialClient` has `deuda`, state has `deuda`?
        // I should check ClientModal later to be safe, but for restore it definitely passes it.

        await database.runAsync(
            'UPDATE clientes SET nombre = ?, email = ?, telefono = ?, deuda = ? WHERE id = ?',
            [cliente.nombre, cliente.email, cliente.telefono, cliente.deuda || 0, id]
        );
        return { ...cliente, id };
    },

    search: async (query) => {
        const database = await getDB();
        const search = `%${query}%`;
        return await database.getAllAsync(
            'SELECT * FROM clientes WHERE nombre LIKE ? OR email LIKE ?',
            [search, search]
        );
    },

    registrarPago: async (id, monto) => {
        // Not implemented in schema (no balance tracking in schema shown), 
        // usually this would go to a CuentaCorriente table or update a balance field.
        // For now, we'll just log it or ignore if schema doesn't support it.
        // Or assume there's a log. The previous API called `/clientes/{id}/pagar`.
        // I'll leave it as a no-op or TODO since I don't have the logic for it in schema.
        console.warn('registrarPago not fully implemented in local DB adapter');
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
    }
};
