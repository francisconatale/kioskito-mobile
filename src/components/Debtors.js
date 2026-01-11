import React, { useState, useCallback } from "react"
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from "react-native"
import { Ionicons, Feather } from '@expo/vector-icons'

export const Debtors = ({ clients, sales, onRegistrarPago, onShowSaleDetails, onShowClientModal, onRefresh, onShowToast, loading }) => {
    const [searchTerm, setSearchTerm] = useState("")
    const [refreshing, setRefreshing] = useState(false)

    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        if (onRefresh) {
            await onRefresh()
        }
        setRefreshing(false)
    }, [onRefresh])

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
                // NO longer return to list here, wait for Success Modal confirmation
                setShowSuccessModal(true)
            } else {
                if (onShowToast) onShowToast(result.message || "Error al registrar pago", "error")
            }
            // The list will update via clients prop
        } finally {
            setPaying(false)
        }
    }

    const renderHistoryView = () => {
        const debtorSales = sales.filter(s => s.clienteId === selectedDebtor.id && s.tipo === 'VENTA')
            .sort((a, b) => new Date(b.date) - new Date(a.date))

        return (
            <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
                <View style={{ padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity onPress={() => setSelectedDebtor(null)}>
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    <View>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>{selectedDebtor.nombre}</Text>
                        <Text style={{ fontSize: 13, color: '#6B7280' }}>
                            {selectedDebtor.deuda >= 0 ? 'Deuda total: ' : 'Saldo a favor: '}
                            <Text style={{
                                color: selectedDebtor.deuda > 0 ? '#DC2626' : (selectedDebtor.deuda < 0 ? '#16A34A' : '#6B7280'),
                                fontWeight: '700'
                            }}>
                                {selectedDebtor.deuda < 0 ? `- $${Math.abs(selectedDebtor.deuda)}` : `$${selectedDebtor.deuda || 0}`}
                            </Text>
                        </Text>
                    </View>
                </View>

                <ScrollView
                    style={{ flex: 1, padding: 16 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#2563EB']} />
                    }
                >
                    <TouchableOpacity
                        style={{ backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 24, flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                        onPress={() => {
                            setPayAmount((selectedDebtor.deuda || 0).toString())
                            setShowPayModal(true)
                        }}
                    >
                        <Ionicons name="cash-outline" size={20} color="white" />
                        <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Registrar Entrega / Pago</Text>
                    </TouchableOpacity>

                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Historial de Deudas</Text>

                    {debtorSales.length === 0 ? (
                        <View style={{ alignItems: 'center', padding: 40 }}>
                            <Feather name="info" size={32} color="#D1D5DB" />
                            <Text style={{ marginTop: 12, color: '#9CA3AF', fontSize: 14 }}>No hay ventas registradas para este cliente</Text>
                        </View>
                    ) : (
                        debtorSales.map(sale => (
                            <TouchableOpacity
                                key={sale.id}
                                style={{ backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' }}
                                onPress={() => onShowSaleDetails(sale)}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View>
                                        <Text style={{ fontWeight: '600', color: '#111827' }}>{new Date(sale.date).toLocaleDateString("es-ES")} - {new Date(sale.date).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}</Text>
                                        <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{sale.items.length} productos</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: sale.metodoPago === 'FIADO' ? '#DC2626' : '#16A34A' }}>
                                            ${sale.total}
                                        </Text>
                                        <Text style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase' }}>{sale.metodoPago}</Text>
                                    </View>
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
                <View style={{ padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>Deudores</Text>
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#2563EB',
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 10,
                                gap: 6
                            }}
                            onPress={() => onShowClientModal()}
                        >
                            <Ionicons name="person-add-outline" size={18} color="white" />
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>Alta Cliente</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 16 }}>
                        <Ionicons name="search" size={20} color="#9CA3AF" />
                        <TextInput
                            style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 12, fontSize: 16 }}
                            placeholder="Buscar por nombre o teléfono..."
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                        />
                    </View>
                </View>

                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#2563EB" />
                    </View>
                ) : (
                    <ScrollView
                        style={{ flex: 1, padding: 16 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#2563EB']} />
                        }
                    >
                        {debtors.length === 0 ? (
                            <View style={{ alignItems: 'center', padding: 40 }}>
                                <Ionicons name="people-outline" size={64} color="#D1D5DB" />
                                <Text style={{ marginTop: 16, fontSize: 16, color: '#6B7280', textAlign: 'center' }}>
                                    {searchTerm ? "No se encontraron clientes con deuda" : "No hay clientes con saldos pendientes"}
                                </Text>
                            </View>
                        ) : (
                            debtors.map(debtor => (
                                <TouchableOpacity
                                    key={debtor.id}
                                    style={{
                                        backgroundColor: 'white',
                                        padding: 16,
                                        borderRadius: 16,
                                        marginBottom: 12,
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        borderWidth: 1,
                                        borderColor: '#E5E7EB',
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: 0.05,
                                        shadowRadius: 2,
                                        elevation: 2
                                    }}
                                    onPress={() => setSelectedDebtor(debtor)}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>{debtor.nombre}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                                            <Ionicons name="call-outline" size={12} color="#6B7280" />
                                            <Text style={{ fontSize: 13, color: '#6B7280' }}>{debtor.telefono || "Sin teléfono"}</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={{ padding: 10, marginRight: 8 }}
                                        onPress={() => onShowClientModal(debtor)}
                                    >
                                        <Ionicons name="pencil-outline" size={18} color="#9CA3AF" />
                                    </TouchableOpacity>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={{
                                            fontSize: 18,
                                            fontWeight: 'bold',
                                            color: debtor.deuda > 0 ? '#DC2626' : (debtor.deuda < 0 ? '#16A34A' : '#6B7280')
                                        }}>
                                            {debtor.deuda < 0 ? `- $${Math.abs(debtor.deuda)}` : `$${debtor.deuda || 0}`}
                                        </Text>
                                        <Text style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                            {debtor.deuda > 0 ? 'Saldo Pendiente' : (debtor.deuda < 0 ? 'Saldo a Favor' : 'Sin Deuda')}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#D1D5DB" style={{ marginLeft: 12 }} />
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                )}
            </View>
        )
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            {selectedDebtor ? renderHistoryView() : renderListView()}

            {/* Pay Modal */}
            {showPayModal && (
                <View style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 100
                }}>
                    <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Registrar Pago</Text>
                        <Text style={{ color: '#6B7280', marginBottom: 20 }}>Saldo actual: <Text style={{ color: '#DC2626', fontWeight: '700' }}>${selectedDebtor.deuda}</Text></Text>

                        <View style={{ marginBottom: 24 }}>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Monto a descontar</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 16 }}>
                                <Text style={{ fontSize: 18, color: '#6B7280' }}>$</Text>
                                <TextInput
                                    style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontSize: 18, fontWeight: 'bold' }}
                                    keyboardType="numeric"
                                    value={payAmount}
                                    onChangeText={setPayAmount}
                                    autoFocus
                                />
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                style={{ flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#F3F4F6' }}
                                onPress={() => setShowPayModal(false)}
                            >
                                <Text style={{ fontWeight: '600', color: '#374151' }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 2, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#10B981', opacity: paying ? 0.7 : 1 }}
                                onPress={handlePay}
                                disabled={paying}
                            >
                                {paying ? <ActivityIndicator size="small" color="white" /> : <Text style={{ fontWeight: '700', color: 'white' }}>Confirmar Pago</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <View style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 110
                }}>
                    <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 32, width: '100%', maxWidth: 350, alignItems: 'center' }}>
                        <View style={{ backgroundColor: '#D1FAE5', padding: 20, borderRadius: 50, marginBottom: 20 }}>
                            <Ionicons name="checkmark-circle" size={60} color="#10B981" />
                        </View>
                        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 8, textAlign: 'center' }}>¡Pago Registrado!</Text>
                        <Text style={{ fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 24 }}>El saldo del cliente ha sido actualizado correctamente.</Text>

                        <TouchableOpacity
                            style={{ backgroundColor: '#2563EB', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, width: '100%', alignItems: 'center' }}
                            onPress={() => {
                                setShowSuccessModal(false)
                                setSelectedDebtor(null) // Return to list AFTER confirmation
                            }}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Entendido</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    )
}
