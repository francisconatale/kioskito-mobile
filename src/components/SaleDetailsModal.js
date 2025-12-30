import React from "react"
import { View, Text, ScrollView, TouchableOpacity, Modal } from "react-native"
import { Ionicons, Feather } from '@expo/vector-icons'

export const SaleDetailsModal = ({ visible, onClose, sale }) => {
    if (!sale) return null

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
                    maxHeight: '80%',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 5
                }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>
                            {sale.tipo === 'RESTOCK' ? 'Detalle de Restock' : (sale.tipo === 'PAGO' ? 'Comprobante de Pago' : 'Detalle de Venta')}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <View style={{ marginBottom: 20, padding: 16, backgroundColor: '#f9fafb', borderRadius: 12 }}>
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
                            <Text style={{ fontWeight: '600', color: sale.tipo === 'RESTOCK' ? '#6B7280' : (sale.tipo === 'PAGO' ? '#2563EB' : '#16A34A'), textTransform: 'capitalize' }}>
                                {sale.tipo === 'RESTOCK' ? 'Ingreso de Stock' : (sale.tipo === 'PAGO' ? 'Cobro de Deuda' : 'Venta Cliente')}
                            </Text>
                        </View>
                        {sale.clienteNombre && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={{ color: '#6b7280' }}>Cliente:</Text>
                                <Text style={{ fontWeight: '600', color: '#111827' }}>{sale.clienteNombre}</Text>
                            </View>
                        )}
                    </View>

                    {sale.tipo !== 'PAGO' && (
                        <>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>Productos</Text>
                            <ScrollView style={{ marginBottom: 20 }}>
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
                                                {sale.tipo !== 'RESTOCK' && (
                                                    <Text style={{ fontWeight: 'bold', color: '#111827' }}>
                                                        ${item.subtotal}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>
                        </>
                    )}

                    <View style={{ borderTopWidth: 2, borderTopColor: '#f3f4f6', paddingTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>
                            {sale.tipo === 'RESTOCK' ? 'Total Unidades:' : (sale.tipo === 'PAGO' ? 'Monto Cobrado:' : 'Total:')}
                        </Text>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: (sale.tipo === 'RESTOCK' || sale.tipo === 'PAGO') ? '#2563EB' : '#10b981' }}>
                            {sale.tipo === 'RESTOCK'
                                ? `${sale.items.reduce((acc, item) => acc + item.quantity, 0)}`
                                : `$${sale.total}`}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={{ backgroundColor: '#f3f4f6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 }}
                        onPress={onClose}
                    >
                        <Text style={{ fontWeight: 'bold', color: '#374151' }}>Cerrar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    )
}
