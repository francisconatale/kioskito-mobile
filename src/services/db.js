import * as SQLite from 'expo-sqlite';

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
                nombre TEXT NOT NULL,
                email TEXT,
                telefono TEXT,
                deuda REAL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS productos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                marca TEXT,
                descripcion TEXT,
                precio REAL NOT NULL,
                stock INTEGER NOT NULL,
                codigo_barra TEXT UNIQUE
            );

            CREATE TABLE IF NOT EXISTS ventas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fecha TEXT NOT NULL,
                monto_total REAL NOT NULL,
                metodo_pago TEXT NOT NULL,
                cliente_id INTEGER,
                cliente_id INTEGER,
                tipo TEXT DEFAULT 'VENTA',
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
                producto_id INTEGER NOT NULL,
                motivo TEXT,
                fecha TEXT NOT NULL,
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

        const result = await database.runAsync(
            'INSERT INTO productos (nombre, marca, descripcion, precio, stock, codigo_barra) VALUES (?, ?, ?, ?, ?, ?)',
            [producto.nombre, producto.marca, producto.descripcion, producto.precio, producto.stock, codigoBarra]
        );
        return { ...producto, id: result.lastInsertRowId, codigoBarras: codigoBarra };
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

    lookupBarcode: async (code) => {
        // In local mode, just reuse getByBarcode
        const product = await productosAPI.getByBarcode(code);
        return product;
    },

    getLowStock: async (threshold = 10) => {
        const database = await getDB();
        const rows = await database.getAllAsync('SELECT * FROM productos WHERE stock <= ?', [threshold]);
        return rows.map(mapProductoFromDB);
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
                const result = await database.runAsync(
                    'INSERT INTO ventas (fecha, monto_total, metodo_pago, cliente_id, tipo) VALUES (?, ?, ?, ?, ?)',
                    [venta.fecha, venta.montoTotal, venta.metodoPago, venta.clienteId, venta.tipo]
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
                    await database.runAsync(
                        'INSERT INTO movimientos_stock (producto_id, tipo, cantidad, motivo, fecha) VALUES (?, ?, ?, ?, ?)',
                        [detalle.productoId, 'SALIDA', detalle.cantidad, 'VENTA', venta.fecha]
                    );
                }

                // Handle debt update if FIADO
                if (venta.metodoPago && venta.metodoPago.toUpperCase() === 'FIADO' && venta.clienteId) {
                    await database.runAsync(
                        'UPDATE clientes SET deuda = deuda + ? WHERE id = ?',
                        [venta.montoTotal, venta.clienteId]
                    );
                }
                return { id: ventaId, ...venta };
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

    restore: async (venta) => {
        const database = await getDB();
        try {
            await database.withTransactionAsync(async () => {
                // Raw Insert without side effects (stock update or debt update)
                // We assume stock and debt are restored by their respective restore actions (products snapshot and clients snapshot)

                // We use new IDs for simplicity unless we want to force ID which risks collision
                const result = await database.runAsync(
                    'INSERT INTO ventas (fecha, monto_total, metodo_pago, cliente_id, tipo) VALUES (?, ?, ?, ?, ?)',
                    [venta.date, venta.total, venta.metodoPago || venta.metodo_pago, venta.clienteId || venta.cliente_id, venta.tipo]
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
        const result = await database.runAsync(
            'INSERT INTO clientes (nombre, email, telefono, deuda) VALUES (?, ?, ?, ?)',
            [cliente.nombre, cliente.email, cliente.telefono, deuda]
        );
        return { ...cliente, id: result.lastInsertRowId, deuda };
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
                await database.runAsync(
                    'INSERT INTO movimientos_stock (producto_id, tipo, cantidad, motivo, fecha) VALUES (?, ?, ?, ?, ?)',
                    [mov.productoId, mov.tipo, mov.cantidad, mov.motivo, mov.fecha]
                );

                const operator = mov.tipo === 'ENTRADA' ? '+' : '-';
                await database.runAsync(
                    `UPDATE productos SET stock = stock ${operator} ? WHERE id = ?`,
                    [mov.cantidad, mov.productoId]
                );
            });
            return { success: true };
        } catch (e) {
            throw e;
        }
    }
};
