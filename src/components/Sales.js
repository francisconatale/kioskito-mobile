import { useState, useCallback } from "react"
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native"
import { Ionicons } from '@expo/vector-icons'
import { calculateTotalSalesMonth } from '../utils/calculations'

export const Sales = ({ sales, onShowSaleModal, onShowBarcodeScanner, onShowSaleDetails, onRefresh }) => {
    const totalSalesMonth = calculateTotalSalesMonth(sales)
    const [refreshing, setRefreshing] = useState(false)

    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        await onRefresh()
        setRefreshing(false)
    }, [onRefresh])

    return (
        <View style={{ flex: 1 }}>
            <View style={{ backgroundColor: 'white', padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>Registrar Venta</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                            style={{ backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
                            onPress={onShowSaleModal}
                        >
                            <Ionicons name="add" size={20} color="#fff" />
                            <Text style={{ color: 'white', fontWeight: '600', marginLeft: 4 }}>Manual</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <ScrollView
                style={{ flex: 1, padding: 16 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#10b981']} />
                }
            >
                <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 16 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>Resumen de ventas</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                        <Text style={{ color: '#6b7280' }}>Total del mes:</Text>
                        <Text style={{ fontWeight: 'bold', color: '#10b981', fontSize: 18 }}>${totalSalesMonth}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                        <Text style={{ color: '#6b7280' }}>Total de ventas:</Text>
                        <Text style={{ fontWeight: 'bold', color: '#111827' }}>{sales.length}</Text>
                    </View>
                </View>

                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>Historial</Text>
                {sales
                    .slice()
                    .reverse()
                    .map((sale) => (
                        <TouchableOpacity
                            key={sale.id}
                            style={{ backgroundColor: 'white', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 12 }}
                            onPress={() => onShowSaleDetails(sale)}
                        >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 14, color: '#6b7280' }}>
                                        {new Date(sale.date).toLocaleDateString("es-ES")} - {new Date(sale.date).toLocaleTimeString("es-ES")}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: '#3b82f6', marginTop: 2, fontWeight: '600' }}>
                                        {sale.items.length} {sale.items.length === 1 ? 'producto' : 'productos'} • Ver detalle
                                    </Text>
                                </View>
                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#10b981' }}>${sale.total}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                {sales.length === 0 && (
                    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
                        <Ionicons name="cart-outline" size={48} color="#d1d5db" />
                        <Text style={{ color: '#9ca3af', marginTop: 16 }}>No hay ventas registradas</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    )
}
