
import * as LocalDB from './db';
import * as OnlineAPI from './api';

export const syncService = {
    // 1. Upload Pending Data (Push)
    syncUp: async () => {
        try {
            console.log('Starting Sync UP...');

            // A. Clientes (Pending Upload)
            // Note: We need a getPending() for clients in db.js first, but assuming we can filter or use similar logic to ventas
            // For now, let's implement a quick check if we had `getPendingClientes` or similar.
            // Since we don't have it yet in db.js interface, I'll add the TODO reminder to implement it fully in db.js 
            // OR I can quickly add a `clientesAPI.getPending` to db.js now.

            // Let's assume we added `getPending` to `clientesAPI` in `db.js`. 
            // I will go and add that to `db.js` next.
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

            // B. Ventas (Pending Upload)
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
                            clienteId: venta.clienteId, // Make sure this ID is mapped correctly if it was created offline! 
                            // This is a TRICKY part: If client was created offline, it has a local ID. 
                            // The backend won't know this ID.
                            // IDEAL: Use UUID for client reference in VentaDTO too. 
                            // FOR NOW: We might fail if client is new. 
                            // Mitigation: Synced Clients first.
                            tipo: venta.tipo,
                            detalles: venta.items.map(d => ({
                                productoId: d.productId || d.producto_id, // Same issue with Product ID
                                cantidad: d.quantity || d.cantidad,
                                precioUnitario: d.price || d.precio_unitario
                            }))
                        };

                        console.log('Uploading sale:', payload.uuid);
                        await OnlineAPI.ventasAPI.create(payload);
                        syncedUuids.push(venta.uuid);
                    } catch (e) {
                        console.error(`Failed to upload sale ${venta.uuid}:`, e);
                        // If 409 Conflict (already exists), we might want to mark as synced?
                        // If 400 Bad Request (invalid client/product), we are stuck.
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

            console.log('Products sync finished.');
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
    }
};
