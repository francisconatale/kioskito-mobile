import * as Crypto from 'expo-crypto';

export const createGenericRepository = (tableName, getDB, mapper = (x) => x) => {
    return {
        getAll: async (orderBy = 'id') => {
            const database = await getDB();
            const rows = await database.getAllAsync(`SELECT * FROM ${tableName} WHERE deleted = 0 ORDER BY ${orderBy}`);
            return rows.map(mapper);
        },

        getById: async (id) => {
            const database = await getDB();
            const row = await database.getFirstAsync(`SELECT * FROM ${tableName} WHERE id = ? AND deleted = 0`, [id]);
            return row ? mapper(row) : null;
        },

        getByUuid: async (uuid) => {
            const database = await getDB();
            const row = await database.getFirstAsync(`SELECT * FROM ${tableName} WHERE uuid = ? AND deleted = 0`, [uuid]);
            return row ? mapper(row) : null;
        },

        create: async (item) => {
            const database = await getDB();
            const uuid = item.uuid || Crypto.randomUUID();

            // Extract keys and values except id
            const data = { ...item, uuid, synced: 0, deleted: 0 };
            delete data.id;

            const keys = Object.keys(data);
            const placeholders = keys.map(() => '?').join(',');
            const values = Object.values(data);

            const result = await database.runAsync(
                `INSERT INTO ${tableName} (${keys.join(',')}) VALUES (${placeholders})`,
                values
            );
            return { ...data, id: result.lastInsertRowId };
        },

        update: async (id, item) => {
            const database = await getDB();
            const data = { ...item, synced: 0 };
            delete data.id;
            delete data.uuid; // Don't allow updating UUID

            const keys = Object.keys(data);
            const setClause = keys.map(k => `${k} = ?`).join(',');
            const values = [...Object.values(data), id];

            await database.runAsync(
                `UPDATE ${tableName} SET ${setClause} WHERE id = ?`,
                values
            );
            return { ...item, id };
        },

        delete: async (id) => {
            const database = await getDB();
            // Check if it's already synced
            const row = await database.getFirstAsync(`SELECT synced FROM ${tableName} WHERE id = ?`, [id]);

            if (row && row.synced === 1) {
                // Soft delete: mark as deleted to inform server later
                await database.runAsync(`UPDATE ${tableName} SET deleted = 1 WHERE id = ?`, [id]);
            } else {
                // Hard delete: not on server yet, can safely remove
                await database.runAsync(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
            }
            return { success: true };
        },

        getPending: async () => {
            const database = await getDB();
            const rows = await database.getAllAsync(`SELECT * FROM ${tableName} WHERE synced = 0 AND deleted = 0`);
            return rows.map(mapper);
        },

        getDeleted: async () => {
            const database = await getDB();
            const rows = await database.getAllAsync(`SELECT * FROM ${tableName} WHERE deleted = 1`);
            return rows.map(mapper);
        },

        markSynced: async (uuids) => {
            if (!uuids || uuids.length === 0) return;
            const database = await getDB();
            const placeholders = uuids.map(() => '?').join(',');
            await database.runAsync(
                `UPDATE ${tableName} SET synced = 1 WHERE uuid IN (${placeholders})`,
                uuids
            );
        },

        hardDeleteByUuids: async (uuids) => {
            if (!uuids || uuids.length === 0) return;
            const database = await getDB();
            const placeholders = uuids.map(() => '?').join(',');
            await database.runAsync(
                `DELETE FROM ${tableName} WHERE uuid IN (${placeholders})`,
                uuids
            );
        }
    };
};
