import { View, Text, ScrollView, TouchableOpacity } from "react-native"
import { Ionicons, Feather } from '@expo/vector-icons'
import { calculateTotalSalesToday, calculateTotalInventoryValue } from '../utils/calculations'

export const Dashboard = ({ products, sales, onShowProductModal, onShowSaleModal }) => {
    const totalSalesToday = calculateTotalSalesToday(sales)
    const totalInventoryValue = calculateTotalInventoryValue(products)

    return (
        <ScrollView style={{ flex: 1, padding: 16 }}>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                <View style={{ flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                    <View style={{ width: 40, height: 40, backgroundColor: '#d1fae5', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                        <Ionicons name="cash-outline" size={20} color="#10b981" />
                    </View>
                    <Text style={{ color: '#6b7280', fontSize: 14 }}>Ventas hoy</Text>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>${totalSalesToday}</Text>
                </View>

                <View style={{ flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                    <View style={{ width: 40, height: 40, backgroundColor: '#dbeafe', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                        <Feather name="package" size={20} color="#3b82f6" />
                    </View>
                    <Text style={{ color: '#6b7280', fontSize: 14 }}>Productos</Text>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>{products.length}</Text>
                </View>
            </View>

            <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>Acciones rápidas</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                        style={{ flex: 1, backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, alignItems: 'center' }}
                        onPress={onShowProductModal}
                    >
                        <Ionicons name="add" size={24} color="#fff" />
                        <Text style={{ fontWeight: '600', color: 'white', marginTop: 8 }}>Nuevo Producto</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{ flex: 1, backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center' }}
                        onPress={onShowSaleModal}
                    >
                        <Ionicons name="cart-outline" size={24} color="#fff" />
                        <Text style={{ fontWeight: '600', color: 'white', marginTop: 8 }}>Nueva Venta</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>Ventas recientes</Text>
                {sales
                    .slice(-5)
                    .reverse()
                    .map((sale) => (
                        <View key={sale.id} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text style={{ fontSize: 12, color: '#6b7280' }}>
                                    {sale.items.length} {sale.items.length === 1 ? 'producto' : 'productos'}
                                </Text>
                                <Text style={{ fontWeight: 'bold', color: '#10b981' }}>${sale.total}</Text>
                            </View>
                            {sale.items.map((item, idx) => (
                                <Text key={idx} style={{ fontSize: 14, color: '#374151' }}>
                                    • {item.productName} x{item.quantity}
                                </Text>
                            ))}
                        </View>
                    ))}
                {sales.length === 0 && <Text style={{ color: '#9ca3af', textAlign: 'center', paddingVertical: 16 }}>No hay ventas registradas</Text>}
            </View>

            <View style={{ backgroundColor: '#3b82f6', padding: 24, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}>
                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Valor del inventario</Text>
                <Text style={{ color: 'white', fontSize: 30, fontWeight: 'bold' }}>${totalInventoryValue.toLocaleString()}</Text>
            </View>
        </ScrollView>
    )
}
