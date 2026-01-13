import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native"
import { Ionicons } from '@expo/vector-icons'
import { syncService } from '../services/sync'

export const Menu = ({ onNavigate, appMode, onRefresh, onToggleMode, user, onLogout }) => {

    const handleForceSync = async () => {
        Alert.alert(
            "Forzar sincronización",
            "Esta acción intentará subir tus cambios pendientes, luego borrará la base de datos local y descargará todo de nuevo desde la nube. \n\n¿Deseas continuar?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Sincronizar",
                    onPress: async () => {
                        try {
                            const result = await syncService.forceSync();
                            if (result.success) {
                                Alert.alert("Éxito", "La base de datos se ha sincronizado correctamente.");
                                if (onRefresh) onRefresh();
                            } else {
                                Alert.alert("Error", "Hubo un problema al sincronizar.");
                            }
                        } catch (e) {
                            Alert.alert("Error", "Error inesperado: " + e.message);
                        }
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
            id: 'sync',
            label: 'Sincronizar base de datos',
            subtitle: 'Actualizar productos y clientes desde la nube',
            icon: 'sync-outline',
            color: '#10B981',
            action: handleForceSync
        },
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
