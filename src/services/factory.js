
import * as OnlineAPI from './api';
import * as LocalDB from './db';
import AsyncStorage from '@react-native-async-storage/async-storage';

let currentMode = 'OFFLINE'; // Default to OFFLINE

export const setMode = async (mode) => {
    currentMode = mode;
    try {
        await AsyncStorage.setItem('APP_MODE', mode);
    } catch (e) {
        console.error('Failed to save mode', e);
    }
};

export const getMode = () => currentMode;

export const initService = async () => {
    try {
        const savedMode = await AsyncStorage.getItem('APP_MODE');
        if (savedMode) {
            currentMode = savedMode;
        } else {
            currentMode = 'OFFLINE';
        }
        await LocalDB.initDB(); // Always init DB just in case we switch
    } catch (e) {
        console.error('Service init error', e);
    }
};

const getProvider = () => {
    return currentMode === 'ONLINE' ? OnlineAPI : LocalDB;
};

const createProxy = (target) => {
    return new Proxy({}, {
        get: (obj, prop) => {
            const provider = getProvider();
            if (provider[target] && provider[target][prop]) {
                return provider[target][prop];
            }

            if (!provider[target]) {
                console.warn(`Provider ${currentMode} does not have API group ${target}`);
                return () => Promise.resolve(null);
            }
            console.warn(`Provider ${currentMode} does not have method ${target}.${prop}`);
            return () => Promise.resolve(null);
        }
    });
};

export const productosAPI = new Proxy({}, {
    get: (_, prop) => {
        const provider = getProvider();
        return provider.productosAPI[prop];
    }
});

export const ventasAPI = new Proxy({}, {
    get: (_, prop) => {
        const provider = getProvider();
        return provider.ventasAPI[prop];
    }
});

export const clientesAPI = new Proxy({}, {
    get: (_, prop) => {
        const provider = getProvider();
        return provider.clientesAPI[prop];
    }
});

export const movimientosStockAPI = new Proxy({}, {
    get: (_, prop) => {
        const provider = getProvider();
        return provider.movimientosStockAPI[prop];
    }
});

export const cierresAPI = new Proxy({}, {
    get: (_, prop) => {
        const provider = getProvider();
        if (!provider.cierresAPI) return () => Promise.resolve([]);
        return provider.cierresAPI[prop];
    }
});

// Explicit exports for checks
export const healthCheck = async () => {
    const provider = getProvider();
    if (provider.healthCheck) return provider.healthCheck();
    return true; // Local is always "healthy"
};
