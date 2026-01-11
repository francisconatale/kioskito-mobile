import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert, Platform } from 'react-native';
import { productosAPI, ventasAPI, clientesAPI, movimientosStockAPI } from './factory';

export const importData = async () => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'application/json',
            copyToCacheDirectory: true
        });

        if (result.canceled) return { success: false, message: 'Cancelado' };

        const fileUri = result.assets[0].uri;
        const fileContent = await FileSystem.readAsStringAsync(fileUri);
        const data = JSON.parse(fileContent);

        if (!data.version || !data.products) {
            return { success: false, message: 'Formato de archivo inválido' };
        }

        // Restore sequentially
        // 1. Products
        if (data.products && Array.isArray(data.products)) {
            for (const p of data.products) {
                // Check if exists to update or create
                const existing = await productosAPI.getByBarcode(p.codigoBarras);
                if (existing) {
                    await productosAPI.update(existing.id, p);
                } else {
                    await productosAPI.create(p);
                }
            }
        }

        // 2. Clients
        if (data.clients && Array.isArray(data.clients)) {
            for (const c of data.clients) {
                // Ideally check by email or name distinct
                // For simplicity, we just add blindly or simple check? 
                // Let's assume name unique for now or just add
                await clientesAPI.create(c);
            }
        }

        // 3. Sales
        // Sales are trickier because IDs change. We re-import as history.
        // It might duplicate if run twice. Ideally we need unique IDs or clear DB first.
        // For this simple implementation, we will append.

        if (data.sales && Array.isArray(data.sales)) {
            for (const s of data.sales) {
                await ventasAPI.restore(s);
            }
        }

        return { success: true, message: 'Datos de Productos y Clientes importados correctamente.' };

    } catch (e) {
        console.error(e);
        return { success: false, message: 'Error al importar: ' + e.message };
    }
};

export const exportData = async () => {
    try {
        const data = {
            version: 1,
            timestamp: new Date().toISOString(),
            products: await productosAPI.getAll(),
            sales: await ventasAPI.getAll(),
            clients: await clientesAPI.getAll(),
            movements: await movimientosStockAPI.getAll()
        };

        const json = JSON.stringify(data, null, 2);
        const fileName = `kioskito_backup_${new Date().getTime()}.json`;

        let fileUri = FileSystem.documentDirectory + fileName;

        await FileSystem.writeAsStringAsync(fileUri, json, {
            encoding: 'utf8'
        });

        if (Platform.OS === 'web') {
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            return { success: true, message: 'Descarga iniciada' };
        } else {
            if (!(await Sharing.isAvailableAsync())) {
                Alert.alert("Error", "Compartir no está disponible en este dispositivo");
                return { success: false, message: "Sharing not available" };
            }

            await Sharing.shareAsync(fileUri);
            return { success: true, message: 'Copia de seguridad generada' };
        }

    } catch (error) {
        console.error("Export error:", error);
        return { success: false, message: error.message };
    }
};
