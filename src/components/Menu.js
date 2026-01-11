import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native"
import { Ionicons } from '@expo/vector-icons'
import { exportData, importData } from '../services/backup'

export const Menu = ({ onNavigate, appMode, onRefresh }) => {

    // Helper to handle backup actions
    const handleBackup = async () => {
        if (appMode === 'ONLINE') {
            alert("El backup local solo es necesario en modo Offline. En Online tus datos ya están seguros.");
            return;
        }
        const result = await exportData();
        if (result.success) {
            alert(result.message || "Copia de seguridad guardada exitosamente");
        } else {
            alert("Error: " + result.message);
        }
    }

    const handleRestore = async () => {
        if (appMode === 'ONLINE') return;
        const result = await importData();
        alert(result.message);
        if (result.success && onRefresh) onRefresh();
    }

    const menuItems = [
        {
            id: 'debtors',
            label: 'Deudores y Fiados',
            subtitle: 'Gestionar cuentas corrientes y pagos',
            icon: 'people-outline',
            color: '#F59E0B'
        },
        {
            id: 'analytics',
            label: 'Estadísticas',
            subtitle: 'Ver reportes de ventas y ganancias',
            icon: 'bar-chart-outline',
            color: '#3B82F6'
        }
    ];

    const settingsItems = [
        {
            id: 'backup',
            label: 'Realizar Copia de Seguridad',
            subtitle: 'Exportar datos a un archivo',
            icon: 'save-outline',
            color: '#8B5CF6',
            action: handleBackup
        },
        {
            id: 'restore',
            label: 'Restaurar Copia de Seguridad',
            subtitle: 'Importar datos desde un archivo',
            icon: 'cloud-upload-outline',
            color: '#10B981',
            action: handleRestore
        }
    ]

    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Gestión</Text>
                {menuItems.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.item}
                        onPress={() => onNavigate(item.id)}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                            <Ionicons name={item.icon} size={24} color={item.color} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.itemTitle}>{item.label}</Text>
                            <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sistema y Seguridad</Text>
                {settingsItems.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.item}
                        onPress={item.action}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                            <Ionicons name={item.icon} size={24} color={item.color} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.itemTitle}>{item.label}</Text>
                            <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                        </View>
                        {/* No chevron for actions usually, or different icon */}
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        padding: 16
    },
    header: {
        marginBottom: 24,
        paddingVertical: 12
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827'
    },
    section: {
        marginBottom: 32
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    item: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 }
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16
    },
    textContainer: {
        flex: 1
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2
    },
    itemSubtitle: {
        fontSize: 12,
        color: '#6B7280'
    }
})
