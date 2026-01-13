
import { syncService } from '../src/services/sync';
import * as LocalDB from '../src/services/db';
import * as OnlineAPI from '../src/services/api';

// Mocks
jest.mock('../src/services/db', () => ({
    ventasAPI: {
        getPending: jest.fn(),
        markSynced: jest.fn()
    },
    productosAPI: {
        getAll: jest.fn(),
        upsertProducts: jest.fn(),
        getByBarcode: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
    },
    clientesAPI: {
        getPending: jest.fn(),
        markSynced: jest.fn(),
        create: jest.fn()
    }
}));

jest.mock('../src/services/api', () => ({
    ventasAPI: {
        create: jest.fn()
    },
    productosAPI: {
        getAll: jest.fn()
    },
    clientesAPI: {
        create: jest.fn()
    }
}));

describe('SyncService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('syncDown', () => {
        it('should fetch remote products and upsert locally', async () => {
            const mockRemoteProducts = [
                { uuid: 'p1', nombre: 'Coca Cola', synced: 1 }
            ];
            OnlineAPI.productosAPI.getAll.mockResolvedValue(mockRemoteProducts);
            LocalDB.productosAPI.upsertProducts.mockResolvedValue({ success: true });

            const result = await syncService.syncDown();

            expect(OnlineAPI.productosAPI.getAll).toHaveBeenCalled();
            expect(LocalDB.productosAPI.upsertProducts).toHaveBeenCalledWith(mockRemoteProducts);
            expect(result.success).toBe(true);
        });

        it('should handle errors gracefully', async () => {
            OnlineAPI.productosAPI.getAll.mockRejectedValue(new Error('Network error'));
            const result = await syncService.syncDown();
            expect(result.success).toBe(false);
        });
    });

    describe('syncUp', () => {
        it('should sync pending clients first', async () => {
            const mockPendingClients = [
                { uuid: 'c1', nombre: 'Juan', synced: 0 }
            ];
            LocalDB.clientesAPI.getPending.mockResolvedValue(mockPendingClients);
            LocalDB.ventasAPI.getPending.mockResolvedValue([]);

            // Mock success upload
            OnlineAPI.clientesAPI.create.mockResolvedValue({ id: 100, uuid: 'c1' });

            await syncService.syncUp();

            expect(OnlineAPI.clientesAPI.create).toHaveBeenCalledWith(expect.objectContaining({ uuid: 'c1' }));
            expect(LocalDB.clientesAPI.markSynced).toHaveBeenCalledWith(['c1']);
        });

        it('should sync pending sales', async () => {
            LocalDB.clientesAPI.getPending.mockResolvedValue([]);
            const mockPendingVentas = [
                {
                    uuid: 'v1',
                    fecha: '2023-01-01',
                    montoTotal: 100,
                    items: [{ productId: 1, quantity: 1, price: 100 }]
                }
            ];
            LocalDB.ventasAPI.getPending.mockResolvedValue(mockPendingVentas);
            OnlineAPI.ventasAPI.create.mockResolvedValue({ id: 200 });

            await syncService.syncUp();

            expect(OnlineAPI.ventasAPI.create).toHaveBeenCalledWith(expect.objectContaining({ uuid: 'v1' }));
            expect(LocalDB.ventasAPI.markSynced).toHaveBeenCalledWith(['v1']);
        });
    });
});
