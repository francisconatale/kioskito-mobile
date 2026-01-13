import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native"
import { Ionicons } from '@expo/vector-icons'
import { exportData, importData } from '../services/backup'
import { syncService } from '../services/sync'

export const Menu = ({ onNavigate, appMode, onRefresh, onToggleMode, user, onLogout }) => {

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

    const handleClearDB = async () => {
        if (appMode === 'ONLINE') {
            Alert.alert("Acción no permitida", "Esta opción solo está disponible para limpiar la base de datos local (Offline).");
            return;
        }

        Alert.alert(
            "¿Borrar TODOS los datos?",
            "Esta acción eliminará permanentemente todos los productos, ventas y clientes almacenados en este dispositivo. No se puede deshacer.\n\nSe recomienda hacer un Backup antes.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Sí, Borrar Todo",
                    style: "destructive",
                    onPress: async () => {
                        const { clearDatabase } = require('../services/db');
                        const result = await clearDatabase();
                        alert(result.message);
                        if (result.success && onRefresh) onRefresh();
                    }
                }
            ]
        );
    }


    // Menu items configuration
    const menuItems = [
        {
            id: 'account',
            label: 'Mi Cuenta',
            subtitle: 'Editar perfil y cerrar sesión',
            icon: 'person-circle-outline',
            color: '#8B5CF6' // Violet
        },
        {
            id: 'debtors',
            label: 'Deudores',
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
            id: 'mode',
            label: 'Modo de almacenamiento',
            subtitle: appMode === 'ONLINE' ? 'Nube - Datos sincronizados' : 'Dispositivo - Sin internet',
            icon: appMode === 'ONLINE' ? 'cloud-outline' : 'phone-portrait-outline',
            color: appMode === 'ONLINE' ? '#2563EB' : '#D97706',
            action: async () => {
                const newMode = appMode === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
                if (newMode === 'ONLINE' && !user) {
                    alert("Debes iniciar sesión para usar el modo Online.");
                    return;
                }

                if (newMode === 'ONLINE') {
                    // Trigger Sync
                    try {
                        alert("Sincronizando datos con la nube...");
                        const result = await syncService.syncAll();
                        if (result.up.success && result.down.success) {
                            alert("Sincronización completada exitosamente.");
                        } else {
                            alert("Hubo errores en la sincronización, pero se activó el modo Online.");
                        }
                    } catch (e) {
                        console.error("Sync error in menu:", e);
                        alert("Error al sincronizar");
                    }
                }

                onToggleMode();
            }
        },
        {
            id: 'backup',
            label: 'Realizar copia de seguridad',
            subtitle: 'Exportar datos a un archivo',
            icon: 'save-outline',
            color: '#8B5CF6',
            action: handleBackup
        },
        {
            id: 'restore',
            label: 'Restaurar copia de seguridad',
            subtitle: 'Importar datos desde un archivo',
            icon: 'cloud-upload-outline',
            color: '#10B981',
            action: handleRestore
        },
        {
            id: 'reset_db',
            label: 'Restablecer base de datos',
            subtitle: 'Borrar todos los datos locales',
            icon: 'trash-outline',
            color: '#EF4444',
            action: handleClearDB
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

            {/* Account section removed, moved to dedicated menu item */}

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
    },
    accountCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
        marginBottom: 8
    },
    avatarContainer: {
        marginRight: 16
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#BFDBFE'
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2563EB'
    },
    userInfo: {
        flex: 1
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4
    },
    userRole: {
        fontSize: 14,
        color: '#2563EB',
        fontWeight: '600',
        marginBottom: 2,
        backgroundColor: '#EFF6FF',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4
    },
    userEmail: {
        fontSize: 14,
        color: '#6B7280'
    }
})
