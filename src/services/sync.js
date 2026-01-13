
import * as LocalDB from './db';
import * as OnlineAPI from './api';

export const syncService = {
    // 1. Upload Pending Data (Push)
    syncUp: async () => {
        try {
            console.log('Starting Sync UP...');
            const deletedProductos = await LocalDB.productosAPI.getDeleted();
            if (deletedProductos.length > 0) {
                const processedUuids = [];
                for (const p of deletedProductos) {
                    try {
                        await OnlineAPI.productosAPI.deleteByUuid(p.uuid);
                        processedUuids.push(p.uuid);
                    } catch (e) {
                        console.error("Failed to delete product on server:", p.uuid, e);
                        // If 404, server already deleted it, consider it sync'd
                        if (e.message.includes('404')) processedUuids.push(p.uuid);
                    }
                }
                if (processedUuids.length > 0) {
                    await LocalDB.productosAPI.hardDeleteByUuids(processedUuids);
                }
            }

            // 2. Clientes Deletions
            const deletedClientes = await LocalDB.clientesAPI.getDeleted();
            if (deletedClientes.length > 0) {
                const processedUuids = [];
                for (const c of deletedClientes) {
                    try {
                        await OnlineAPI.clientesAPI.deleteByUuid(c.uuid);
                        processedUuids.push(c.uuid);
                    } catch (e) {
                        console.error("Failed to delete client on server:", c.uuid, e);
                        if (e.message.includes('404')) processedUuids.push(c.uuid);
                    }
                }
                if (processedUuids.length > 0) {
                    await LocalDB.clientesAPI.hardDeleteByUuids(processedUuids);
                }
            }

            // 3. Ventas Deletions (Ventas don't have deleteByUuid yet, but typically we don't delete sales often)
            // For now let's focus on products and clients.

            // B. Productos (Pending Upload)
            const pendingProductos = await LocalDB.productosAPI.getPending();
            if (pendingProductos && pendingProductos.length > 0) {
                const pendingMovimientos = await LocalDB.movimientosStockAPI.getPending();
                const productosWithPendingMovements = new Set(
                    pendingMovimientos.map(m => m.productoUuid)
                );

                const syncedProductUuids = [];
                for (const producto of pendingProductos) {
                    try {
                        // Skip products that have pending manual stock movements
                        // The movement sync will handle the stock change on the server
                        if (productosWithPendingMovements.has(producto.uuid)) {
                            console.log(`Skipping product ${producto.nombre} - has pending stock movements`);
                            continue;
                        }

                        await OnlineAPI.productosAPI.create({
                            ...producto,
                            uuid: producto.uuid
                        });
                        syncedProductUuids.push(producto.uuid);
                    } catch (e) {
                        console.error("Failed to upload product:", producto.uuid, e);
                    }
                }
                if (syncedProductUuids.length > 0) {
                    await LocalDB.productosAPI.markSynced(syncedProductUuids);
                }
            }

            // C. Clientes (Pending Upload)
            const pendingClientes = await LocalDB.clientesAPI.getPending();
            if (pendingClientes && pendingClientes.length > 0) {
                const syncedClientUuids = [];
                for (const cliente of pendingClientes) {
                    try {
                        await OnlineAPI.clientesAPI.create({
                            ...cliente,
                            uuid: cliente.uuid
                        });
                        syncedClientUuids.push(cliente.uuid);
                    } catch (e) {
                        console.error("Failed to upload client:", cliente.uuid, e);
                    }
                }
                if (syncedClientUuids.length > 0) {
                    await LocalDB.clientesAPI.markSynced(syncedClientUuids);
                }
            }

            const pendingMovimientos = await LocalDB.movimientosStockAPI.getPending();
            if (pendingMovimientos && pendingMovimientos.length > 0) {
                console.log(`Found ${pendingMovimientos.length} pending stock movements.`);
                const syncedMovUuids = [];
                for (const mov of pendingMovimientos) {
                    try {
                        await OnlineAPI.movimientosStockAPI.create(mov);
                        syncedMovUuids.push(mov.uuid);
                    } catch (e) {
                        console.error("Failed to upload stock movement:", mov.uuid, e);
                    }
                }
                if (syncedMovUuids.length > 0) {
                    await LocalDB.movimientosStockAPI.markSynced(syncedMovUuids);

                    // Also mark the corresponding products as synced
                    // since their stock change has been applied on the server
                    const productUuidsToMark = [...new Set(pendingMovimientos
                        .filter(m => syncedMovUuids.includes(m.uuid))
                        .map(m => m.productoUuid))];

                    if (productUuidsToMark.length > 0) {
                        await LocalDB.productosAPI.markSynced(productUuidsToMark);
                    }

                    console.log(`Successfully synced ${syncedMovUuids.length} stock movements.`);
                }
            }

            const pendingVentas = await LocalDB.ventasAPI.getPending();
            if (pendingVentas.length === 0) {
                console.log('No pending sales to sync.');
            } else {
                console.log(`Found ${pendingVentas.length} pending sales.`);
                const syncedUuids = [];

                for (const venta of pendingVentas) {
                    try {
                        const payload = {
                            uuid: venta.uuid,
                            fecha: venta.fecha || venta.date,
                            montoTotal: venta.montoTotal || venta.total,
                            metodoPago: venta.metodoPago,
                            clienteId: venta.clienteId,
                            clienteUuid: venta.clienteUuid,
                            tipo: venta.tipo,
                            detalles: venta.items.map(d => ({
                                productoId: d.productoId || d.producto_id,
                                productoUuid: d.productUuid || d.producto_uuid,
                                cantidad: d.quantity || d.cantidad,
                                precioUnitario: d.price || d.precio_unitario
                            }))
                        };

                        console.log('Uploading sale:', payload.uuid);
                        await OnlineAPI.ventasAPI.create(payload);
                        syncedUuids.push(venta.uuid);
                    } catch (e) {
                        console.error(`Failed to upload sale ${venta.uuid}:`, e);
                    }
                }

                if (syncedUuids.length > 0) {
                    await LocalDB.ventasAPI.markSynced(syncedUuids);
                    console.log(`Successfully synced ${syncedUuids.length} sales.`);
                }
            }

            return { success: true };
        } catch (error) {
            console.error('Sync Up Error:', error);
            return { success: false, error };
        }
    },

    // 2. Download Latest Data (Pull)
    syncDown: async () => {
        try {
            console.log('Starting Sync DOWN...');

            // A. Productos
            const remoteProducts = await OnlineAPI.productosAPI.getAll();
            if (remoteProducts && remoteProducts.length > 0) {
                await LocalDB.productosAPI.upsertProducts(remoteProducts);
                console.log(`Products synced from server: ${remoteProducts.length}`);
            }

            // B. Clientes
            const remoteClients = await OnlineAPI.clientesAPI.getAll();
            if (remoteClients && remoteClients.length > 0) {
                await LocalDB.clientesAPI.upsertClients(remoteClients);
                console.log(`Clients synced from server: ${remoteClients.length}`);
            }

            console.log('Sync Down finished.');
            return { success: true };
        } catch (error) {
            console.error('Sync Down Error:', error);
            return { success: false, error };
        }
    },

    // 3. Full Sync
    syncAll: async () => {
        console.log('=== SYNC STARTED ===');
        const upResult = await syncService.syncUp();
        const downResult = await syncService.syncDown();
        console.log('=== SYNC COMPLETED ===');
        return { up: upResult, down: downResult };
    },

    // 4. Force Sync (Clear local and fetch fresh)
    forceSync: async () => {
        console.log('=== FORCE SYNC STARTED ===');
        // A. Try to upload what's pending so we don't lose data
        await syncService.syncUp();

        // B. Clear local DB
        await LocalDB.clearDatabase();

        // C. Fetch all fresh
        const result = await syncService.syncDown();
        console.log('=== FORCE SYNC COMPLETED ===');
        return result;
    }
};
