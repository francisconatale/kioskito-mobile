import React, { useState, useCallback } from "react"
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, StyleSheet } from "react-native"
import { Ionicons, Feather } from '@expo/vector-icons'
import { calculateOutstandingDebt } from "../utils/calculations"

export const Debtors = ({ clients, sales, onRegistrarPago, onShowSaleDetails, onShowClientModal, onRefresh, onShowToast, loading, onBack }) => {
    const [searchTerm, setSearchTerm] = useState("")
    const [refreshing, setRefreshing] = useState(false)

    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        if (onRefresh) {
            await onRefresh()
        }
        setRefreshing(false)
    }, [onRefresh])

    const totalOutstanding = calculateOutstandingDebt(clients)

    const debtors = clients.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.telefono && c.telefono.includes(searchTerm))
    ).sort((a, b) => (b.deuda || 0) - (a.deuda || 0))

    const [selectedDebtor, setSelectedDebtor] = useState(null)
    const [showPayModal, setShowPayModal] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [payAmount, setPayAmount] = useState("")
    const [paying, setPaying] = useState(false)

    const handlePay = async () => {
        if (!payAmount || parseFloat(payAmount) <= 0) return
        setPaying(true)
        try {
            const result = await onRegistrarPago(selectedDebtor.id, parseFloat(payAmount))

            if (result.success) {
                setShowPayModal(false)
                setPayAmount("")
                setShowSuccessModal(true)
            } else {
                if (onShowToast) onShowToast(result.message || "Error al registrar pago", "error")
            }
        } finally {
            setPaying(false)
        }
    }

    const renderHistoryView = () => {
        const debtorSales = sales.filter(s => s.clienteId === selectedDebtor.id && s.tipo === 'VENTA')
            .sort((a, b) => new Date(b.date) - new Date(a.date))

        return (
            <View style={styles.historyContainer}>
                <View style={styles.historyHeader}>
                    <TouchableOpacity onPress={() => setSelectedDebtor(null)} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.historyTitle}>{selectedDebtor.nombre}</Text>
                        <Text style={styles.historySubtitle}>
                            {selectedDebtor.deuda >= 0 ? 'Deuda actual' : 'Saldo a favor'}
                        </Text>
                    </View>
                    <View style={styles.debtBox}>
                        <Text style={[
                            styles.debtAmount,
                            selectedDebtor.deuda > 0 ? styles.redText : (selectedDebtor.deuda < 0 ? styles.greenText : styles.grayText)
                        ]}>
                            ${Math.abs(selectedDebtor.deuda || 0).toLocaleString('es-ES')}
                        </Text>
                    </View>
                </View>

                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ padding: 20 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#4F46E5']} />
                    }
                >
                    <TouchableOpacity
                        style={styles.payButton}
                        onPress={() => {
                            setPayAmount((selectedDebtor.deuda || 0).toString())
                            setShowPayModal(true)
                        }}
                    >
                        <Feather name="dollar-sign" size={20} color="white" />
                        <Text style={styles.payButtonText}>Registrar Entrega de Dinero</Text>
                    </TouchableOpacity>

                    <Text style={styles.sectionHeading}>Historial de Compras</Text>

                    {debtorSales.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Feather name="file-text" size={40} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No hay ventas para este cliente</Text>
                        </View>
                    ) : (
                        debtorSales.map(sale => (
                            <TouchableOpacity
                                key={sale.id}
                                style={styles.saleHistoryCard}
                                onPress={() => onShowSaleDetails(sale)}
                            >
                                <View style={styles.saleHistoryInfo}>
                                    <Text style={styles.saleHistoryDate}>
                                        {new Date(sale.date).toLocaleDateString("es-ES")} · {new Date(sale.date).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                    <View style={styles.itemsBadge}>
                                        <Text style={styles.itemsBadgeText}>{sale.items?.length || 0} prod.</Text>
                                    </View>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.saleHistoryPrice}>${sale.total}</Text>
                                    <Text style={styles.saleHistoryType}>{sale.metodoPago}</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            </View>
        )
    }

    const renderListView = () => {
        return (
            <View style={{ flex: 1 }}>
                <View style={styles.listHeader}>
                    {onBack && (
                        <TouchableOpacity onPress={onBack} style={styles.backBtnSmall}>
                            <Ionicons name="arrow-back" size={24} color="#111827" />
                        </TouchableOpacity>
                    )}
                    <View style={styles.titleRow}>
                        <Text style={styles.mainTitle}>Clientes</Text>
                        <TouchableOpacity style={styles.addClientBtn} onPress={() => onShowClientModal()}>
                            <Ionicons name="person-add" size={18} color="white" />
                            <Text style={styles.addClientText}>Nuevo</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.summaryBox}>
                        <View>
                            <Text style={styles.summaryLabel}>Deuda total a cobrar</Text>
                            <Text style={styles.summaryValue}>${totalOutstanding.toLocaleString('es-ES')}</Text>
                        </View>
                        <View style={styles.summaryIcon}>
                            <Feather name="users" size={24} color="#4F46E5" />
                        </View>
                    </View>

                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#9CA3AF" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar por nombre o teléfono..."
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                        />
                    </View>
                </View>

                {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="small" color="#4F46E5" />
                    </View>
                ) : (
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{ padding: 20 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#4F46E5']} />
                        }
                    >
                        {debtors.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="people-outline" size={64} color="#D1D5DB" />
                                <Text style={styles.emptyText}>
                                    {searchTerm ? "No se encontraron resultados" : "No hay clientes registrados"}
                                </Text>
                            </View>
                        ) : (
                            debtors.map(debtor => (
                                <TouchableOpacity
                                    key={debtor.id}
                                    style={styles.clientCard}
                                    onPress={() => setSelectedDebtor(debtor)}
                                >
                                    <View style={styles.clientAvatar}>
                                        <Text style={styles.avatarText}>
                                            {debtor.nombre?.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.clientMainInfo}>
                                        <Text style={styles.clientName}>{debtor.nombre}</Text>
                                        <Text style={styles.clientPhone}>{debtor.telefono || "Sin teléfono"}</Text>
                                    </View>
                                    <View style={styles.clientDebtBox}>
                                        <Text style={[
                                            styles.clientDebtValue,
                                            debtor.deuda > 0 ? styles.redText : (debtor.deuda < 0 ? styles.greenText : styles.grayText)
                                        ]}>
                                            ${Math.abs(debtor.deuda || 0).toLocaleString('es-ES')}
                                        </Text>
                                        <Text style={styles.clientDebtLabel}>
                                            {debtor.deuda > 0 ? 'Debe' : (debtor.deuda < 0 ? 'Favor' : 'Al día')}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color="#D1D5DB" style={{ marginLeft: 8 }} />
                                </TouchableOpacity>
                            ))
                        )}
                        <View style={{ height: 100 }} />
                    </ScrollView>
                )}
            </View>
        )
    }

    return (
        <View style={styles.container}>
            {selectedDebtor ? renderHistoryView() : renderListView()}

            {/* Pay Modal */}
            {showPayModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Registrar Pago</Text>
                        <Text style={styles.modalSubtitle}>Deuda de {selectedDebtor.nombre}: <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>${selectedDebtor.deuda}</Text></Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Monto recibido</Text>
                            <View style={styles.amountInputContainer}>
                                <Text style={styles.currencySymbol}>$</Text>
                                <TextInput
                                    style={styles.amountInput}
                                    keyboardType="numeric"
                                    value={payAmount}
                                    onChangeText={setPayAmount}
                                    autoFocus
                                />
                            </View>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setShowPayModal(false)}
                            >
                                <Text style={styles.cancelBtnText}>Cerrar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmBtn}
                                onPress={handlePay}
                                disabled={paying}
                            >
                                {paying ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.confirmBtnText}>Confirmar</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { alignItems: 'center', paddingVertical: 40 }]}>
                        <View style={styles.successIconBox}>
                            <Ionicons name="checkmark" size={40} color="#10B981" />
                        </View>
                        <Text style={styles.successTitle}>¡Pago Exitoso!</Text>
                        <Text style={styles.successSubtitle}>El saldo ha sido actualizado.</Text>

                        <TouchableOpacity
                            style={styles.doneBtn}
                            onPress={() => {
                                setShowSuccessModal(false)
                                setSelectedDebtor(null)
                            }}
                        >
                            <Text style={styles.doneBtnText}>Entendido</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    historyContainer: {
        flex: 1,
    },
    historyHeader: {
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingTop: 12,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    historyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
    },
    historySubtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    debtBox: {
        alignItems: 'flex-end',
    },
    debtAmount: {
        fontSize: 20,
        fontWeight: '900',
    },
    payButton: {
        backgroundColor: '#10B981',
        borderRadius: 16,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 32,
        shadowColor: "#10B981",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 4,
    },
    payButtonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
    },
    sectionHeading: {
        fontSize: 14,
        fontWeight: '800',
        color: '#111827',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
    },
    saleHistoryCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    saleHistoryInfo: {
        flex: 1,
    },
    saleHistoryDate: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    itemsBadge: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    itemsBadgeText: {
        fontSize: 11,
        color: '#4F46E5',
        fontWeight: '700',
    },
    saleHistoryPrice: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },
    saleHistoryType: {
        fontSize: 11,
        color: '#9CA3AF',
        textTransform: 'uppercase',
        marginTop: 2,
    },
    listHeader: {
        backgroundColor: 'white',
        paddingTop: 12,
        paddingHorizontal: 20,
        paddingBottom: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        zIndex: 10,
    },
    backBtnSmall: {
        marginBottom: 12,
        marginLeft: -8,
        padding: 8,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
    },
    addClientBtn: {
        backgroundColor: '#4F46E5',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
    },
    addClientText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
    },
    summaryBox: {
        backgroundColor: '#EEF2FF',
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    summaryLabel: {
        fontSize: 13,
        color: '#4F46E5',
        fontWeight: '600',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: '900',
        color: '#111827',
    },
    summaryIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        paddingHorizontal: 16,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 12,
        fontSize: 15,
        color: '#111827',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clientCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    clientAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#4F46E5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    avatarText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
    },
    clientMainInfo: {
        flex: 1,
    },
    clientName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    clientPhone: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 2,
    },
    clientDebtBox: {
        alignItems: 'flex-end',
    },
    clientDebtValue: {
        fontSize: 16,
        fontWeight: '800',
    },
    clientDebtLabel: {
        fontSize: 10,
        color: '#9CA3AF',
        textTransform: 'uppercase',
        marginTop: 2,
    },
    redText: { color: '#EF4444' },
    greenText: { color: '#10B981' },
    grayText: { color: '#6B7280' },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        color: '#9CA3AF',
        marginTop: 12,
        fontSize: 14,
        textAlign: 'center',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 8,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        paddingHorizontal: 20,
    },
    currencySymbol: {
        fontSize: 20,
        fontWeight: '800',
        color: '#9CA3AF',
    },
    amountInput: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 12,
        fontSize: 22,
        fontWeight: '900',
        color: '#111827',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    cancelBtnText: {
        fontWeight: '700',
        color: '#6B7280',
    },
    confirmBtn: {
        flex: 2,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        backgroundColor: '#10B981',
    },
    confirmBtnText: {
        fontWeight: '800',
        color: 'white',
    },
    successIconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#ECFDF5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#111827',
        marginBottom: 8,
    },
    successSubtitle: {
        fontSize: 15,
        color: '#6B7280',
        marginBottom: 32,
    },
    doneBtn: {
        backgroundColor: '#4F46E5',
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
    },
    doneBtnText: {
        color: 'white',
        fontWeight: '800',
        fontSize: 16,
    },
})
