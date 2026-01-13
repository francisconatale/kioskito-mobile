import React, { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator } from "react-native"
import { Ionicons, Feather } from '@expo/vector-icons'
import { SuccessScreen } from './SuccessScreen'

export const SaleDetailsModal = ({ visible, onClose, sale, onReturn }) => {
    const [returnMode, setReturnMode] = useState(false)
    const [returnQuantities, setReturnQuantities] = useState({}) // { index: qty }
    const [processing, setProcessing] = useState(false)
    const [completed, setCompleted] = useState(false)

    useEffect(() => {
        if (visible) {
            setReturnMode(false)
            setReturnQuantities({})
            setCompleted(false)
            setProcessing(false)
        }
    }, [visible])

    if (!sale) return null

    const handleReturn = async () => {
        if (!onReturn) return

        const returnItems = sale.items.map((item, index) => ({
            ...item,
            quantity: returnQuantities[index] || 0
        })).filter(item => item.quantity > 0)

        if (returnItems.length === 0) return

        setProcessing(true)
        try {
            const totalToReturn = returnItems.reduce((acc, item) => acc + (item.quantity * item.price), 0)

            const result = await onReturn({
                ...sale,
                items: returnItems,
                total: totalToReturn
            })

            if (result && result.success) {
                setCompleted(true)
            } else {
                // Keep modal open or show error
                setProcessing(false)
            }
        } catch (error) {
            console.error("Error in return:", error)
            setProcessing(false)
        }
    }

    const updateReturnQty = (index, delta, max) => {
        const current = returnQuantities[index] || 0
        const newValue = Math.max(0, Math.min(max, current + delta))
        setReturnQuantities({ ...returnQuantities, [index]: newValue })
    }

    const totalToReturn = sale.items.reduce((acc, item, index) => {
        return acc + ((returnQuantities[index] || 0) * item.price)
    }, 0)

    return (
        <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
            <View style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20
            }}>
                <View style={{
                    backgroundColor: 'white',
                    borderRadius: 24,
                    padding: 24,
                    width: '100%',
                    maxWidth: 480,
                    maxHeight: '85%',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.1,
                    shadowRadius: 20,
                    elevation: 10,
                    borderWidth: 1,
                    borderColor: '#F1F5F9'
                }}>
                    {/* Header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: '#1E293B', fontFamily: 'System' }}>
                            {returnMode ? 'Gestionar Devolución' : (sale.tipo === 'RESTOCK' ? 'Ingreso de Stock' : (sale.tipo === 'PAGO' ? 'Detalle de Cobro' : (sale.tipo === 'DEVOLUCION' ? 'Devolución' : 'Detalle de Venta')))}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                            <Ionicons name="close" size={22} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    {!completed ? (
                        <>
                            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginBottom: 16 }}>
                                {/* Info Banner */}
                                <View style={{
                                    marginBottom: 20,
                                    padding: 16,
                                    backgroundColor: returnMode ? '#FEF2F2' : '#F8FAFC',
                                    borderRadius: 16,
                                    borderWidth: 1,
                                    borderColor: returnMode ? '#FCA5A5' : '#F1F5F9'
                                }}>
                                    {returnMode ? (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' }}>
                                                <Ionicons name="alert-circle" size={18} color="white" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 13, color: '#B91C1C', fontWeight: '700' }}>Modo Devolución</Text>
                                                <Text style={{ fontSize: 12, color: '#DC2626' }}>Indica qué productos y cantidades regresan.</Text>
                                            </View>
                                        </View>
                                    ) : (
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '800', marginBottom: 4 }}>Información de Venta</Text>
                                                <Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '600' }}>
                                                    {new Date(sale.date).toLocaleDateString("es-ES", { day: '2-digit', month: 'long' })}
                                                </Text>
                                                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
                                                    {new Date(sale.date).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })} hs
                                                </Text>
                                            </View>
                                            <View style={{ alignItems: 'flex-end', gap: 6 }}>
                                                <View style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                                                    <Text style={{ fontSize: 10, color: '#4F46E5', fontWeight: '800' }}>{sale.tipo || 'VENTA'}</Text>
                                                </View>
                                                {sale.metodoPago?.toUpperCase() === 'FIADO' && (
                                                    <View style={{ backgroundColor: '#FFF7ED', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                                                        <Text style={{ fontSize: 10, color: '#C2410C', fontWeight: '800' }}>FIADO</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    )}
                                </View>

                                <Text style={{ fontSize: 13, fontWeight: '800', color: '#64748B', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    {sale.tipo === 'PAGO' ? 'Concepto' : `Productos (${sale.items?.length || 0})`}
                                </Text>

                                <View style={{ gap: 10 }}>
                                    {sale.items.map((item, index) => (
                                        <View
                                            key={index}
                                            style={{
                                                backgroundColor: 'white',
                                                borderRadius: 14,
                                                padding: 12,
                                                borderWidth: 1,
                                                borderColor: '#F1F5F9',
                                                shadowColor: '#000',
                                                shadowOffset: { width: 0, height: 1 },
                                                shadowOpacity: 0.04,
                                                shadowRadius: 3,
                                                elevation: 1
                                            }}
                                        >
                                            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                                                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' }}>
                                                    <Ionicons name="cube-outline" size={20} color="#64748B" />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B' }} numberOfLines={1}>
                                                        {item.productName || item.productoNombre}
                                                        {item.productoMarca ? (
                                                            <Text style={{ fontWeight: '400', color: '#64748B' }}>
                                                                {' · ' + item.productoMarca}
                                                            </Text>
                                                        ) : null}
                                                    </Text>
                                                    <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                                                        {sale.tipo === 'RESTOCK' ? `Cantidad: ${item.quantity}` : `${item.quantity} x $${item.price}`}
                                                    </Text>
                                                </View>

                                                {returnMode ? (
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 10, padding: 2, borderWidth: 1, borderColor: '#E2E8F0' }}>
                                                        <TouchableOpacity
                                                            onPress={() => updateReturnQty(index, -1, item.quantity)}
                                                            style={{ padding: 6 }}
                                                        >
                                                            <Ionicons name="remove-circle" size={26} color={returnQuantities[index] > 0 ? '#EF4444' : '#E2E8F0'} />
                                                        </TouchableOpacity>
                                                        <Text style={{ marginHorizontal: 8, fontWeight: '800', fontSize: 15, color: '#1E293B', minWidth: 20, textAlign: 'center' }}>
                                                            {returnQuantities[index] || 0}
                                                        </Text>
                                                        <TouchableOpacity
                                                            onPress={() => updateReturnQty(index, 1, item.quantity)}
                                                            style={{ padding: 6 }}
                                                        >
                                                            <Ionicons name="add-circle" size={26} color={(returnQuantities[index] || 0) < item.quantity ? '#10B981' : '#E2E8F0'} />
                                                        </TouchableOpacity>
                                                    </View>
                                                ) : (
                                                    sale.items.length > 0 && sale.tipo !== 'RESTOCK' && (
                                                        <Text style={{ fontWeight: '800', color: '#1E293B', fontSize: 15 }}>
                                                            ${item.subtotal}
                                                        </Text>
                                                    )
                                                )}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </ScrollView>

                            {/* Summary Footer */}
                            <View style={{
                                backgroundColor: '#F8FAFC',
                                borderRadius: 18,
                                padding: 18,
                                marginBottom: 20,
                                borderWidth: 1,
                                borderColor: '#E2E8F0',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1 }}>
                                    {returnMode ? 'Monto Crédito' : (sale.tipo === 'RESTOCK' ? 'Unidades' : (sale.tipo === 'PAGO' ? 'Cobrado' : (sale.tipo === 'DEVOLUCION' ? `Devuelto (${sale.items.reduce((acc, item) => acc + item.quantity, 0)} ítems)` : 'Total General')))}
                                </Text>
                                <Text style={{
                                    fontSize: 26,
                                    fontWeight: '900',
                                    color: (sale.tipo === 'RESTOCK' || sale.tipo === 'PAGO') ? '#2563EB' : (sale.tipo === 'DEVOLUCION' || returnMode ? '#EF4444' : '#10B981')
                                }}>
                                    {returnMode
                                        ? `$${totalToReturn}`
                                        : (sale.tipo === 'RESTOCK'
                                            ? `${sale.items.reduce((acc, item) => acc + item.quantity, 0)}`
                                            : `$${sale.total}`)}
                                </Text>
                            </View>

                            {/* Action Buttons */}
                            <View style={{ gap: 10 }}>
                                {sale.tipo === 'VENTA' && onReturn && !returnMode && (
                                    <TouchableOpacity
                                        style={{ backgroundColor: '#FEF2F2', padding: 16, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: '#FEE2E2' }}
                                        onPress={() => setReturnMode(true)}
                                    >
                                        <Ionicons name="refresh-circle-outline" size={22} color="#EF4444" />
                                        <Text style={{ fontWeight: '800', color: '#EF4444', fontSize: 15 }}>Registrar Devolución</Text>
                                    </TouchableOpacity>
                                )}

                                {returnMode && (
                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                        <TouchableOpacity
                                            style={{ flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}
                                            onPress={() => setReturnMode(false)}
                                            disabled={processing}
                                        >
                                            <Text style={{ fontWeight: '700', color: '#64748B', fontSize: 15 }}>Cerrar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={{
                                                flex: 2,
                                                backgroundColor: (totalToReturn > 0 && !processing) ? '#EF4444' : '#CBD5E1',
                                                padding: 16,
                                                borderRadius: 16,
                                                alignItems: 'center',
                                                flexDirection: 'row',
                                                justifyContent: 'center',
                                                gap: 10
                                            }}
                                            onPress={handleReturn}
                                            disabled={totalToReturn <= 0 || processing}
                                        >
                                            {processing ? (
                                                <ActivityIndicator color="white" size="small" />
                                            ) : (
                                                <Ionicons name="checkmark-done-circle" size={22} color="white" />
                                            )}
                                            <Text style={{ fontWeight: '800', color: 'white', fontSize: 15 }}>
                                                {processing ? 'Guardando...' : 'Confirmar'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                                {!returnMode && (
                                    <TouchableOpacity
                                        style={{ backgroundColor: '#F1F5F9', paddingVertical: 14, borderRadius: 16, alignItems: 'center' }}
                                        onPress={onClose}
                                    >
                                        <Text style={{ fontWeight: '800', color: '#475569', fontSize: 15 }}>Cerrar</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </>
                    ) : (
                        <View style={{ paddingVertical: 20 }}>
                            <SuccessScreen
                                title="¡Devolución Exitosa!"
                                message={`Se han devuelto ${Object.values(returnQuantities).reduce((a, b) => a + b, 0)} productos y se ha ajustado la venta original.`}
                                primaryButtonText="Entendido"
                                onPrimaryAction={onClose}
                                icon="refresh"
                                iconColor="#EF4444"
                                iconBgColor="#FEF2F2"
                            />
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    )
}
