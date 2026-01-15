import { useState, useCallback, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Image, ActivityIndicator, Alert, Modal } from "react-native"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons, Feather } from "@expo/vector-icons"
import { calculateTotalSalesToday, calculateRealCashToday, calculateTotalInventoryValue, calculateOutstandingDebt } from "../utils/calculations"
import { useAuth } from "../contexts/AuthContext"
import { authAPI } from "../services/api"
import { SuccessScreen } from "./SuccessScreen"

export const Dashboard = ({ products, sales, onShowProductModal, onShowSaleModal, onShowSaleDetails, onRefresh, appMode, onToggleMode, clients, onNavigate }) => {
    const { user, setUser } = useAuth()
    const totalSalesToday = calculateTotalSalesToday(sales)
    const realCashToday = calculateRealCashToday(sales)
    const totalInventoryValue = calculateTotalInventoryValue(products)
    const outstandingDebt = calculateOutstandingDebt(clients || [])

    const [refreshing, setRefreshing] = useState(false)
    const [subscription, setSubscription] = useState(null)

    useEffect(() => {
        if (user?.username) {
            authAPI.getSubscriptionStatus(user.username)
                .then(subData => {
                    setSubscription(subData);
                    // Sync plan if it changed on backend
                    if (subData.plan && subData.plan !== user.plan) {
                        const updatedUser = { ...user, plan: subData.plan, trialUsed: subData.trialUsed };
                        AsyncStorage.setItem('user_session', JSON.stringify(updatedUser));
                        setUser(updatedUser);
                    }
                })
                .catch(console.error)
        }
    }, [user])

    const [activatingTrial, setActivatingTrial] = useState(false)
    const [resultModal, setResultModal] = useState({ visible: false, title: '', message: '', type: 'success' });

    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        if (onRefresh) {
            await onRefresh()
        }
        if (user?.username) {
            authAPI.getSubscriptionStatus(user.username)
                .then(subData => {
                    setSubscription(subData);
                    // Sync plan on refresh
                    if (subData.plan && subData.plan !== user.plan) {
                        const updatedUser = { ...user, plan: subData.plan, trialUsed: subData.trialUsed };
                        AsyncStorage.setItem('user_session', JSON.stringify(updatedUser));
                        setUser(updatedUser);
                    }
                })
                .catch(console.error)
        }
        setRefreshing(false)
    }, [onRefresh, user])

    const handleActivateTrial = async () => {
        if (!user?.username) return;

        setActivatingTrial(true);
        try {
            await authAPI.activateTrial(user.username);
            setResultModal({
                visible: true,
                title: "¡Prueba Activada!",
                message: "Has activado el Plan Negocio por 30 días gratis.",
                type: "success"
            });
            // Refresh subscription and update global user state
            const subData = await authAPI.getSubscriptionStatus(user.username);
            setSubscription(subData);

            // Update local session for persistence and immediate UI update
            const updatedUser = { ...user, plan: 'NEGOCIO', trialUsed: true };
            await AsyncStorage.setItem('user_session', JSON.stringify(updatedUser));
            setUser(updatedUser);
        } catch (error) {
            setResultModal({
                visible: true,
                title: "Error",
                message: error.message || "Error al activar la prueba",
                type: "error"
            });
        } finally {
            setActivatingTrial(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#4F46E5']} />
                }
            >
                {/* Subscription Warning */}
                {subscription && subscription.diasRestantes <= 5 && (
                    <TouchableOpacity onPress={() => onNavigate("account")} style={{ marginBottom: 20 }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            padding: 12,
                            borderRadius: 16,
                            backgroundColor: '#FFFBEB',
                            borderWidth: 1,
                            borderColor: '#FCD34D'
                        }}>
                            <Ionicons name="alert-circle" size={24} color="#D97706" />
                            <View style={{ marginLeft: 12, flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: '700', color: '#B45309' }}>
                                    Tu plan vence en {subscription.diasRestantes} días
                                </Text>
                                <Text style={{ fontSize: 12, color: '#B45309', marginTop: 2 }}>
                                    Toca aquí para gestionar tu suscripción
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#D97706" />
                        </View>
                    </TouchableOpacity>
                )}

                {/* Trial Activation Card */}
                {subscription && subscription.plan !== "NEGOCIO" && !subscription.trialUsed && (
                    <View style={{
                        backgroundColor: '#FAF5FF',
                        padding: 16,
                        borderRadius: 16,
                        marginBottom: 20,
                        borderWidth: 1,
                        borderColor: '#E9D5FF'
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <Ionicons name="trending-up" size={20} color="#9333EA" />
                            <Text style={{ marginLeft: 8, fontWeight: 'bold', color: '#9333EA', fontSize: 16 }}>¡Potencia tu negocio!</Text>
                        </View>
                        <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 12, lineHeight: 20 }}>
                            Prueba el Plan Negocio gratis por 30 días. Accede a estadísticas avanzadas, control de stock ilimitado y más.
                        </Text>
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#9333EA',
                                padding: 12,
                                borderRadius: 12,
                                alignItems: 'center'
                            }}
                            onPress={handleActivateTrial}
                            disabled={activatingTrial}
                        >
                            {activatingTrial ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>Activar Prueba Gratis</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Quick Actions */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
                </View>

                <View style={styles.actionsGrid}>
                    <TouchableOpacity style={styles.actionCard} onPress={onShowSaleModal}>
                        <View style={[styles.actionIconBox, styles.successBg]}>
                            <Ionicons name="cart" size={24} color="#10B981" />
                        </View>
                        <Text style={styles.actionText}>Nueva Venta</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard} onPress={onShowProductModal}>
                        <View style={[styles.actionIconBox, styles.blueBg]}>
                            <Ionicons name="add" size={24} color="#3B82F6" />
                        </View>
                        <Text style={styles.actionText}>Nuevo Producto</Text>
                    </TouchableOpacity>
                </View>

                {/* Recent Sales Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Ventas Recientes</Text>
                    <TouchableOpacity onPress={() => onNavigate("sales")}>
                        <Text style={styles.viewAllText}>Ver todas</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.salesList}>
                    {sales
                        .filter(s => s.tipo !== 'RESTOCK')
                        .slice(-5)
                        .reverse()
                        .map((sale) => (
                            <TouchableOpacity key={sale.uuid || sale.id} style={styles.saleItem} onPress={() => onShowSaleDetails(sale)}>
                                <View style={[
                                    styles.saleIcon,
                                    sale.tipo === 'VENTA' && { backgroundColor: '#ECFDF5' },
                                    sale.tipo === 'DEVOLUCION' && { backgroundColor: '#FFF7ED' },
                                    sale.tipo === 'PAGO' && { backgroundColor: '#EEF2FF' }
                                ]}>
                                    <Feather
                                        name={sale.tipo === 'PAGO' ? "arrow-down-left" : (sale.tipo === 'DEVOLUCION' ? "rotate-ccw" : "shopping-bag")}
                                        size={18}
                                        color={sale.tipo === 'PAGO' ? "#2563EB" : (sale.tipo === 'DEVOLUCION' ? "#F59E0B" : "#10B981")}
                                    />
                                </View>
                                <View style={styles.saleMainInfo}>
                                    <Text style={styles.saleTitle}>
                                        {sale.tipo === 'PAGO'
                                            ? `Pago de ${sale.clienteNombre || 'Cliente'}`
                                            : (sale.tipo === 'DEVOLUCION' ? 'Devolución' : 'Venta')
                                        }
                                    </Text>
                                    <Text style={styles.saleTime}>
                                        {new Date(sale.date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                                        {sale.tipo !== 'PAGO' && ` · ${sale.items?.length || 0} ${sale.items?.length === 1 ? 'producto' : 'productos'}`}
                                        {(sale.metodoPago?.toUpperCase() === 'FIADO' && sale.tipo !== 'DEVOLUCION') && " · Fiado"}
                                    </Text>
                                </View>
                                <View style={styles.salePriceBox}>
                                    {sale.tipo !== 'DEVOLUCION' && (
                                        <Text style={[
                                            styles.salePrice,
                                            sale.tipo === 'VENTA' && { color: '#10B981' },
                                            sale.tipo === 'PAGO' && { color: '#2563EB' },
                                            (sale.metodoPago?.toUpperCase() === 'FIADO' && sale.tipo === 'VENTA') && { color: '#D97706' }
                                        ]}>
                                            ${sale.total}
                                        </Text>
                                    )}
                                    <Ionicons name="chevron-forward" size={14} color="#D1D5DB" />
                                </View>
                            </TouchableOpacity>
                        ))}
                    {sales.length === 0 && (
                        <View style={styles.emptyState}>
                            <Feather name="coffee" size={32} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No hay ventas registradas</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView >

            {/* Generic Result Modal */}
            <Modal
                visible={resultModal.visible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setResultModal({ ...resultModal, visible: false })}
            >
                <View style={{
                    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center', alignItems: 'center', padding: 20
                }}>
                    <View style={{
                        backgroundColor: 'white', borderRadius: 20, padding: 24,
                        width: '100%', maxWidth: 400
                    }}>
                        <SuccessScreen
                            title={resultModal.title}
                            message={resultModal.message}
                            primaryButtonText="Aceptar"
                            onPrimaryAction={() => setResultModal({ ...resultModal, visible: false })}
                            icon={resultModal.type === 'success' ? 'checkmark' : 'alert-circle'}
                            iconColor={resultModal.type === 'success' ? '#16A34A' : '#DC2626'} // Green or Red
                            iconBgColor={resultModal.type === 'success' ? '#DCFCE7' : '#FEE2E2'} // Light Green or Light Red
                        />
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    contentContainer: {
        padding: 20,
    },
    heroCard: {
        backgroundColor: "#4F46E5",
        borderRadius: 24,
        padding: 24,
        shadowColor: "#4F46E5",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
        marginBottom: 20,
    },
    heroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    heroLabel: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 14,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    heroValue: {
        color: "white",
        fontSize: 36,
        fontWeight: "800",
        marginBottom: 24,
    },
    heroFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 16,
        padding: 16,
    },
    heroSubStat: {
        flex: 1,
    },
    heroSubLabel: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 11,
        fontWeight: "600",
        marginBottom: 2,
    },
    heroSubValue: {
        color: "white",
        fontSize: 15,
        fontWeight: "700",
    },
    divider: {
        width: 1,
        height: '80%',
        backgroundColor: "rgba(255,255,255,0.2)",
        marginHorizontal: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 28,
    },
    statCardSmall: {
        flex: 1,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    indigoBg: { backgroundColor: "#EEF2FF" },
    amberBg: { backgroundColor: "#FFFBEB" },
    statLabelSmall: {
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "500",
    },
    statValueSmall: {
        fontSize: 15,
        fontWeight: "700",
        color: "#111827",
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#111827",
    },
    viewAllText: {
        color: "#4F46E5",
        fontSize: 14,
        fontWeight: "600",
    },
    actionsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    actionCard: {
        flex: 1,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    actionIconBox: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    successBg: { backgroundColor: "#ECFDF5" },
    blueBg: { backgroundColor: "#EFF6FF" },
    actionText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#374151",
    },
    salesList: {
        backgroundColor: "white",
        borderRadius: 24,
        padding: 8,
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    saleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
    },
    saleIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#F9FAFB",
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    saleMainInfo: {
        flex: 1,
    },
    saleTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#111827",
    },
    saleTime: {
        fontSize: 12,
        color: "#9CA3AF",
        marginTop: 2,
    },
    salePriceBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    salePrice: {
        fontSize: 16,
        fontWeight: "800",
        color: "#111827",
    },
    paymentText: {
        color: "#2563EB",
    },
    emptyState: {
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        color: "#9CA3AF",
        fontSize: 14,
        marginTop: 12,
    },
})
