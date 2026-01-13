
jest.mock('expo-sqlite', () => ({
    openDatabaseAsync: jest.fn(() => Promise.resolve({
        runAsync: jest.fn(() => Promise.resolve({ lastInsertRowId: 1 })),
        getAllAsync: jest.fn(() => Promise.resolve([])),
        getFirstAsync: jest.fn(() => Promise.resolve(null)),
        withTransactionAsync: jest.fn((cb) => cb()),
        closeAsync: jest.fn()
    }))
}));

jest.mock('expo-crypto', () => ({
    randomUUID: jest.fn(() => 'mock-uuid-1234')
}));

jest.mock('expo', () => ({
    registerRootComponent: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
