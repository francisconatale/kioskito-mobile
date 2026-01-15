import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Image } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { SuccessScreen } from './SuccessScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const Subscription = ({ onBack, onRefresh }) => {
    const { user, setUser } = useAuth();
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState(false);
    const [resultModal, setResultModal] = useState({ visible: false, title: '', message: '', type: 'success' });
    const [allPlans, setAllPlans] = useState([]);

    useEffect(() => {
        fetchSubscription();
        fetchPlanes();
    }, []);

    const fetchPlanes = async () => {
        try {
            const data = await authAPI.getPlanes();
            // Sort: Emprendedor, Negocio, Empresa
            const order = ["EMPRENDEDOR", "NEGOCIO", "EMPRESA"];
            data.sort((a, b) => order.indexOf(a.nombre.toUpperCase()) - order.indexOf(b.nombre.toUpperCase()));
            setAllPlans(data);
        } catch (error) {
            console.error("Error fetching plans:", error);
        }
    };

    const fetchSubscription = async () => {
        try {
            setLoading(true);
            const data = await authAPI.getSubscriptionStatus(user.username);
            setSubscription(data);
        } catch (error) {
            console.error("Error fetching subscription:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleActivateTrial = async () => {
        setActivating(true);
        try {
            const result = await authAPI.activateTrial(user.username);
            setResultModal({
                visible: true,
                title: "¡Prueba Activada!",
                message: "Has activado el Plan Negocio por 30 días gratis.",
                type: "success"
            });

            if (result.user) {
                const updatedUser = result.user;
                await AsyncStorage.setItem('user_session', JSON.stringify(updatedUser));
                setUser(updatedUser);
            }

            await fetchSubscription();
            if (onRefresh) onRefresh();
        } catch (error) {
            setResultModal({
                visible: true,
                title: "Error",
                message: error.message || "Error al activar la prueba",
                type: "error"
            });
        } finally {
            setActivating(false);
        }
    };

    const getPlanColor = (plan) => {
        switch (plan?.toUpperCase()) {
            case "NEGOCIO": return "#A855F7";
            case "EMPRENDEDOR": return "#3B82F6";
            case "EMPRESA": return "#EC4899";
            default: return "#22C55E";
        }
    };

    const getPlanBgColor = (plan) => {
        switch (plan?.toUpperCase()) {
            case "NEGOCIO": return "#F3E8FF";
            case "EMPRENDEDOR": return "#DBEAFE";
            case "EMPRESA": return "#FCE7F3";
            default: return "#DCFCE7";
        }
    };

    if (loading && !subscription) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    const isTrialAvailable = !subscription?.trialUsed;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Suscripción</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Current Plan Card */}
                <View style={styles.currentPlanCard}>
                    <View style={styles.cardHeader}>
                        <View>
                            <Text style={styles.label}>Plan Actual</Text>
                            <View style={[styles.planBadge, { backgroundColor: getPlanBgColor(subscription?.plan) }]}>
                                <Text style={[styles.planText, { color: getPlanColor(subscription?.plan) }]}>
                                    {subscription?.plan || 'Free'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.statusBadge}>
                            <Feather name="check-circle" size={14} color="#10B981" />
                            <Text style={styles.statusText}>Activo</Text>
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Días restantes</Text>
                            <Text style={styles.statValue}>{subscription?.diasRestantes ?? "-"}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Límite Productos</Text>
                            <Text style={styles.statValue}>
                                {subscription?.limiteProductos === -1 ? '∞' : subscription?.limiteProductos}
                            </Text>
                        </View>
                    </View>

                    {subscription?.fechaFin && (
                        <Text style={styles.expiryText}>
                            Siguiente facturación: {new Date(subscription.fechaFin).toLocaleDateString('es-AR')}
                        </Text>
                    )}
                </View>

                {/* Trial Box */}
                {isTrialAvailable && (
                    <View style={styles.trialBox}>
                        <View style={styles.trialContent}>
                            <View style={styles.trialIconBox}>
                                <Feather name="zap" size={24} color="#F59E0B" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.trialTitle}>Prueba el Plan Negocio</Text>
                                <Text style={styles.trialDescription}>
                                    Disfruta de productos ilimitados y estadísticas avanzadas por 30 días gratis.
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.activateButton}
                            onPress={handleActivateTrial}
                            disabled={activating}
                        >
                            {activating ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.activateButtonText}>Comenzar Prueba Gratis</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Plans Comparison */}
                <Text style={styles.sectionTitle}>Planes Disponibles</Text>

                {allPlans.map((plan) => {
                    const isNegocio = plan.nombre.toUpperCase() === "NEGOCIO";
                    const isEmprendedor = plan.nombre.toUpperCase() === "EMPRENDEDOR";
                    const color = getPlanColor(plan.nombre);

                    return (
                        <View key={plan.id} style={[
                            styles.planInfoCard,
                            { borderLeftColor: color },
                            isNegocio && { backgroundColor: '#F9F5FF' }
                        ]}>
                            <View style={styles.popularRow}>
                                <Text style={styles.planInfoTitle}>
                                    Plan {plan.nombre.charAt(0).toUpperCase() + plan.nombre.slice(1).toLowerCase()}
                                </Text>
                                {isNegocio && (
                                    <View style={styles.popularBadge}>
                                        <Text style={styles.popularBadgeText}>POPULAR</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.planInfoPrice}>
                                {plan.precioMensual === 0 ? "Gratis" : `$${plan.precioMensual.toLocaleString()}`}
                            </Text>

                            {(plan.features || []).map((feature, idx) => (
                                <View key={idx} style={styles.featureItem}>
                                    <Feather name="check" size={16} color="#10B981" />
                                    <Text style={styles.featureText}>{feature}</Text>
                                </View>
                            ))}
                        </View>
                    );
                })}

                <TouchableOpacity style={styles.supportButton}>
                    <Text style={styles.supportButtonText}>¿Necesitas ayuda con tu plan?</Text>
                    <Text style={styles.supportButtonSub}>Contactar a soporte especializado</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            <Modal
                visible={resultModal.visible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setResultModal({ ...resultModal, visible: false })}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <SuccessScreen
                            title={resultModal.title}
                            message={resultModal.message}
                            primaryButtonText="¡Excelente!"
                            onPrimaryAction={() => setResultModal({ ...resultModal, visible: false })}
                            icon={resultModal.type === 'success' ? 'checkmark' : 'alert-circle'}
                            iconColor={resultModal.type === 'success' ? '#16A34A' : '#DC2626'}
                            iconBgColor={resultModal.type === 'success' ? '#DCFCE7' : '#FEE2E2'}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 20,
        backgroundColor: 'white',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    scrollContent: {
        padding: 20,
    },
    currentPlanCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 5,
        marginBottom: 24,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    planBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        alignSelf: 'flex-start',
    },
    planText: {
        fontWeight: '800',
        fontSize: 16,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusText: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 4,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: '#E5E7EB',
    },
    expiryText: {
        fontSize: 13,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    trialBox: {
        backgroundColor: '#FFFBEB',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#FEF3C7',
        marginBottom: 32,
    },
    trialContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    trialIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    trialTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#92400E',
    },
    trialDescription: {
        fontSize: 13,
        color: '#B45309',
        marginTop: 2,
        lineHeight: 18,
    },
    activateButton: {
        backgroundColor: '#F59E0B',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    activateButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    planInfoCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderLeftWidth: 4,
    },
    planInfoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    planInfoPrice: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        marginVertical: 8,
    },
    popularRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    popularBadge: {
        backgroundColor: '#A855F7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    popularBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '900',
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    featureText: {
        fontSize: 14,
        color: '#4B5563',
        marginLeft: 8,
    },
    supportButton: {
        marginTop: 16,
        alignItems: 'center',
        padding: 20,
    },
    supportButtonText: {
        color: '#4F46E5',
        fontWeight: 'bold',
        fontSize: 15,
    },
    supportButtonSub: {
        color: '#9CA3AF',
        fontSize: 12,
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
});
