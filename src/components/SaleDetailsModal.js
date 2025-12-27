import React from "react"
import { View, Text, ScrollView, TouchableOpacity, Modal } from "react-native"
import { Ionicons } from '@expo/vector-icons'

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
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>Detalle de Venta</Text>
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
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ color: '#6b7280' }}>Método de pago:</Text>
                            <Text style={{ fontWeight: '600', color: '#3b82f6', textTransform: 'capitalize' }}>
                                {sale.metodoPago || 'Efectivo'}
                            </Text>
                        </View>
                    </View>

                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>Productos</Text>
                    <ScrollView style={{ marginBottom: 20 }}>
                        {sale.items.map((item, index) => (
                            <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontWeight: '600', color: '#374151' }}>{item.productName}</Text>
                                    <Text style={{ fontSize: 14, color: '#6b7280' }}>
                                        {item.quantity} x ${item.price}
                                    </Text>
                                </View>
                                <Text style={{ fontWeight: 'bold', color: '#111827', alignSelf: 'center' }}>
                                    ${item.subtotal}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={{ borderTopWidth: 2, borderTopColor: '#f3f4f6', paddingTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>Total:</Text>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#10b981' }}>
                            ${sale.total}
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
