import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch } from "react-native"
import { Ionicons, Feather } from '@expo/vector-icons'
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

    const menuItems = [
        {
            id: 'account',
            label: 'Mi Cuenta',
            subtitle: 'Perfil, negocio y seguridad',
            icon: 'user',
            color: '#4F46E5'
        },
        {
            id: 'debtors',
            label: 'Deudores',
            subtitle: 'Cuentas corrientes y pagos',
            icon: 'users',
            color: '#F59E0B'
        },
        {
            id: 'analytics',
            label: 'Estadísticas',
            subtitle: 'Reportes y rendimiento',
            icon: 'bar-chart-2',
            color: '#10B981'
        }
    ];

    const isOnline = appMode === 'ONLINE'

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            {/* Header / Profile */}
            <View style={styles.profileHeader}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user?.nombre?.charAt(0).toUpperCase() || 'U'}</Text>
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user?.nombre || 'Usuario'}</Text>
                    <Text style={styles.userEmail}>{user?.email || 'user@kioskito.com'}</Text>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
                    <Feather name="log-out" size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>

            {/* Mode Selector Card */}
            <View style={styles.modeCard}>
                <View style={styles.modeInfo}>
                    <View style={[styles.modeIconBox, { backgroundColor: isOnline ? '#EEF2FF' : '#FFF7ED' }]}>
                        <Feather name={isOnline ? 'cloud' : 'hard-drive'} size={20} color={isOnline ? '#4F46E5' : '#D97706'} />
                    </View>
                    <View>
                        <Text style={styles.modeTitle}>{isOnline ? 'Modo Online' : 'Modo Offline'}</Text>
                        <Text style={styles.modeSubtitle}>{isOnline ? 'Sincronizado con la nube' : 'Datos locales únicamente'}</Text>
                    </View>
                </View>
                <Switch
                    value={isOnline}
                    onValueChange={onToggleMode}
                    trackColor={{ false: "#D1D5DB", true: "#818CF8" }}
                    thumbColor={isOnline ? "#4F46E5" : "#F3F4F6"}
                />
            </View>

            {/* Main Section */}
            <Text style={styles.sectionTitle}>Gestión</Text>
            <View style={styles.menuGroup}>
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[styles.menuItem, index === menuItems.length - 1 && { borderBottomWidth: 0 }]}
                        onPress={() => onNavigate(item.id)}
                    >
                        <View style={[styles.menuIconBox, { backgroundColor: item.color + '15' }]}>
                            <Feather name={item.icon} size={20} color={item.color} />
                        </View>
                        <View style={styles.menuText}>
                            <Text style={styles.menuLabel}>{item.label}</Text>
                            <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                        </View>
                        <Feather name="chevron-right" size={18} color="#D1D5DB" />
                    </TouchableOpacity>
                ))}
            </View>

            {/* System Section */}
            <Text style={styles.sectionTitle}>Sistema</Text>
            <View style={styles.menuGroup}>
                <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleForceSync}>
                    <View style={[styles.menuIconBox, { backgroundColor: '#F3F4F6' }]}>
                        <Feather name="refresh-cw" size={20} color="#6B7280" />
                    </View>
                    <View style={styles.menuText}>
                        <Text style={styles.menuLabel}>Sincronizar ahora</Text>
                        <Text style={styles.menuSubtitle}>Forzar actualización de datos</Text>
                    </View>
                    <Feather name="chevron-right" size={18} color="#D1D5DB" />
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <Text style={styles.versionText}>Kioskito v2.0.0</Text>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    contentContainer: {
        padding: 24,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: '#4F46E5',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#4F46E5",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 4,
    },
    avatarText: {
        color: 'white',
        fontSize: 24,
        fontWeight: '800',
    },
    userInfo: {
        flex: 1,
        marginLeft: 16,
    },
    userName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
    },
    userEmail: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    logoutBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#FEF2F2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modeCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    modeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modeIconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    modeTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    modeSubtitle: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 1,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    menuGroup: {
        backgroundColor: 'white',
        borderRadius: 24,
        paddingHorizontal: 16,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
    },
    menuIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    menuText: {
        flex: 1,
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    menuSubtitle: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 1,
    },
    footer: {
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 40,
    },
    versionText: {
        fontSize: 12,
        color: '#D1D5DB',
        fontWeight: '600',
    },
});
