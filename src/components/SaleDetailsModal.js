import React, { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput } from "react-native"
import { Ionicons, Feather } from '@expo/vector-icons'

export const SaleDetailsModal = ({ visible, onClose, sale, onReturn }) => {
    const [returnMode, setReturnMode] = useState(false)
    const [returnQuantities, setReturnQuantities] = useState({}) // { index: qty }

    useEffect(() => {
        if (visible) {
            setReturnMode(false)
            setReturnQuantities({})
        }
    }, [visible])

    if (!sale) return null

    const handleReturn = () => {
        if (!onReturn) return

        const returnItems = sale.items.map((item, index) => ({
            ...item,
            quantity: returnQuantities[index] || 0
        })).filter(item => item.quantity > 0)

        if (returnItems.length === 0) return

        const totalToReturn = returnItems.reduce((acc, item) => acc + (item.quantity * item.price), 0)

        onReturn({
            ...sale,
            items: returnItems,
            total: totalToReturn
        })
        onClose()
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
                    borderRadius: 16,
                    padding: 24,
                    width: '100%',
                    maxWidth: 500,
                    maxHeight: '90%',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 5
                }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>
                            {returnMode ? 'Seleccionar Devolución' : (sale.tipo === 'RESTOCK' ? 'Detalle de Restock' : (sale.tipo === 'PAGO' ? 'Comprobante de Pago' : (sale.tipo === 'DEVOLUCION' ? 'Detalle de Devolución' : 'Detalle de Venta')))}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ flex: 1 }}>
                        <View style={{ marginBottom: 20, padding: 16, backgroundColor: returnMode ? '#FEF2F2' : '#f9fafb', borderRadius: 12, borderWidth: returnMode ? 1 : 0, borderColor: '#FCA5A5' }}>
                            {returnMode ? (
                                <View>
                                    <Text style={{ fontSize: 13, color: '#991B1B', fontWeight: '600', marginBottom: 4 }}>MODO DEVOLUCIÓN PARCIAL</Text>
                                    <Text style={{ fontSize: 12, color: '#B91C1C' }}>Ajusta las cantidades que el cliente está devolviendo.</Text>
                                </View>
                            ) : (
                                <>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <Text style={{ color: '#6b7280' }}>Fecha:</Text>
                                        <Text style={{ fontWeight: '600', color: '#111827' }}>
                                            {new Date(sale.date).toLocaleDateString("es-ES")}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <Text style={{ color: '#6b7280' }}>Hora:</Text>
                                        <Text style={{ fontWeight: '600', color: '#111827' }}>
                                            {new Date(sale.date).toLocaleTimeString("es-ES")}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <Text style={{ color: '#6b7280' }}>Tipo:</Text>
                                        <Text style={{
                                            fontWeight: '600',
                                            color: sale.tipo === 'RESTOCK' ? '#6B7280' :
                                                (sale.tipo === 'PAGO' ? '#2563EB' :
                                                    (sale.tipo === 'DEVOLUCION' ? '#EF4444' : '#16A34A')),
                                            textTransform: 'capitalize'
                                        }}>
                                            {sale.tipo === 'RESTOCK' ? 'Ingreso de Stock' :
                                                (sale.tipo === 'PAGO' ? 'Cobro de Deuda' :
                                                    (sale.tipo === 'DEVOLUCION' ? 'Devolución de Venta' : 'Venta Cliente'))}
                                        </Text>
                                    </View>
                                    {sale.clienteNombre && (
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <Text style={{ color: '#6b7280' }}>Cliente:</Text>
                                            <Text style={{ fontWeight: '600', color: '#111827' }}>{sale.clienteNombre}</Text>
                                        </View>
                                    )}
                                </>
                            )}
                        </View>

                        {sale.tipo !== 'PAGO' && (
                            <>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>Productos</Text>
                                <View style={{ marginBottom: 20 }}>
                                    {sale.items.map((item, index) => (
                                        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                                            <View style={{ width: 36, height: 36, backgroundColor: '#f3f6ff', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                                <Feather name="package" size={18} color="#3b82f6" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <View>
                                                        <Text style={{ fontWeight: '600', color: '#374151', fontSize: 15 }}>
                                                            {item.productName}
                                                            {item.productoMarca && <Text style={{ color: '#2563EB', fontWeight: '500', fontSize: 13 }}> · {item.productoMarca}</Text>}
                                                        </Text>
                                                        {item.productoDescripcion && (
                                                            <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }} numberOfLines={1}>
                                                                {item.productoDescripcion}
                                                            </Text>
                                                        )}
                                                        <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                                                            {sale.tipo === 'RESTOCK' ? `Ingreso: ${item.quantity} unidades` : `${item.quantity} x $${item.price}`}
                                                        </Text>
                                                    </View>

                                                    {returnMode ? (
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 8, padding: 4 }}>
                                                            <TouchableOpacity
                                                                onPress={() => updateReturnQty(index, -1, item.quantity)}
                                                                style={{ padding: 4 }}
                                                            >
                                                                <Ionicons name="remove-circle" size={24} color={returnQuantities[index] > 0 ? '#EF4444' : '#D1D5DB'} />
                                                            </TouchableOpacity>
                                                            <Text style={{ marginHorizontal: 8, fontWeight: '700', fontSize: 16 }}>{returnQuantities[index] || 0}</Text>
                                                            <TouchableOpacity
                                                                onPress={() => updateReturnQty(index, 1, item.quantity)}
                                                                style={{ padding: 4 }}
                                                            >
                                                                <Ionicons name="add-circle" size={24} color={(returnQuantities[index] || 0) < item.quantity ? '#10B981' : '#D1D5DB'} />
                                                            </TouchableOpacity>
                                                        </View>
                                                    ) : (
                                                        sale.tipo !== 'RESTOCK' && (
                                                            <Text style={{ fontWeight: 'bold', color: '#111827' }}>
                                                                ${item.subtotal}
                                                            </Text>
                                                        )
                                                    )}
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </>
                        )}
                    </ScrollView>

                    <View style={{ borderTopWidth: 2, borderTopColor: '#f3f4f6', paddingTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>
                            {returnMode ? 'Total a Devolver:' : (sale.tipo === 'RESTOCK' ? 'Total Unidades:' : (sale.tipo === 'PAGO' ? 'Monto Cobrado:' : (sale.tipo === 'DEVOLUCION' ? 'Monto Devuelto:' : 'Total:')))}
                        </Text>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: (sale.tipo === 'RESTOCK' || sale.tipo === 'PAGO') ? '#2563EB' : (sale.tipo === 'DEVOLUCION' || returnMode ? '#EF4444' : '#10b981') }}>
                            {returnMode
                                ? `$${totalToReturn}`
                                : (sale.tipo === 'RESTOCK'
                                    ? `${sale.items.reduce((acc, item) => acc + item.quantity, 0)}`
                                    : `$${sale.total}`)}
                        </Text>
                    </View>

                    <View style={{ gap: 8 }}>
                        {sale.tipo === 'VENTA' && onReturn && !returnMode && (
                            <TouchableOpacity
                                style={{ backgroundColor: '#FEE2E2', padding: 16, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                                onPress={() => setReturnMode(true)}
                            >
                                <Ionicons name="return-up-back-outline" size={20} color="#EF4444" />
                                <Text style={{ fontWeight: 'bold', color: '#EF4444' }}>Gestionar Devolución</Text>
                            </TouchableOpacity>
                        )}

                        {returnMode && (
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity
                                    style={{ flex: 1, backgroundColor: '#f3f4f6', padding: 16, borderRadius: 12, alignItems: 'center' }}
                                    onPress={() => setReturnMode(false)}
                                >
                                    <Text style={{ fontWeight: 'bold', color: '#374151' }}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{ flex: 2, backgroundColor: totalToReturn > 0 ? '#EF4444' : '#D1D5DB', padding: 16, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                                    onPress={handleReturn}
                                    disabled={totalToReturn <= 0}
                                >
                                    <Ionicons name="checkmark-circle" size={20} color="white" />
                                    <Text style={{ fontWeight: 'bold', color: 'white' }}>Confirmar Devolución</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {!returnMode && (
                            <TouchableOpacity
                                style={{ backgroundColor: '#f3f4f6', padding: 16, borderRadius: 12, alignItems: 'center' }}
                                onPress={onClose}
                            >
                                <Text style={{ fontWeight: 'bold', color: '#374151' }}>Cerrar</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    )
}
