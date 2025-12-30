import { View, Text, ScrollView } from "react-native"
import { Ionicons } from '@expo/vector-icons'
import {
    calculateTotalSalesMonth,
    calculateTotalSalesToday,
    calculateRealCashToday,
    calculateOutstandingDebt,
    calculateTotalInventoryValue,
    getTopProducts,
    countLowStockProducts
} from '../utils/calculations'

export const Analytics = ({ products, sales, clients }) => {
    const totalSalesMonth = calculateTotalSalesMonth(sales)
    const totalSalesToday = calculateTotalSalesToday(sales)
    const realCashToday = calculateRealCashToday(sales)
    const outstandingDebt = calculateOutstandingDebt(clients || [])
    const totalInventoryValue = calculateTotalInventoryValue(products)
    const topProducts = getTopProducts(sales, 5)
    const lowStockCount = countLowStockProducts(products, 10)

    return (
        <ScrollView style={{ flex: 1, padding: 16 }}>
            <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                    <Ionicons name="bar-chart-outline" size={24} color="#3b82f6" />
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginLeft: 8 }}>Análisis de Caja</Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                    <View style={{ flex: 1, backgroundColor: '#fef3c7', padding: 12, borderRadius: 8 }}>
                        <Text style={{ fontSize: 12, color: '#92400e' }}>Caja hoy (Efectivo)</Text>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#d97706' }}>${realCashToday}</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: '#d1fae5', padding: 12, borderRadius: 8 }}>
                        <Text style={{ fontSize: 12, color: '#047857' }}>Ventas hoy (Total)</Text>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#10b981' }}>${totalSalesToday}</Text>
                    </View>
                </View>

                <View style={{ backgroundColor: '#fee2e2', padding: 16, borderRadius: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={{ fontSize: 14, color: '#991b1b', marginBottom: 4 }}>Saldo Total a Cobrar</Text>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#dc2626' }}>${outstandingDebt.toLocaleString()}</Text>
                        </View>
                        <Ionicons name="people-circle-outline" size={40} color="#dc2626" />
                    </View>
                </View>
            </View>

            <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>Productos más vendidos</Text>
                {topProducts.map((product, index) => (
                    <View
                        key={product.productId}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <View style={{ width: 32, height: 32, backgroundColor: '#3b82f6', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>{index + 1}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontWeight: '600', color: '#111827' }}>{product.productName}</Text>
                                <Text style={{ fontSize: 14, color: '#6b7280' }}>{product.quantity} unidades</Text>
                            </View>
                        </View>
                        <Text style={{ fontWeight: 'bold', color: '#10b981' }}>${product.total}</Text>
                    </View>
                ))}
                {topProducts.length === 0 && <Text style={{ color: '#9ca3af', textAlign: 'center', paddingVertical: 16 }}>No hay datos suficientes</Text>}
            </View>

            <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>Estado del inventario</Text>
                <View style={{ backgroundColor: '#fff7ed', padding: 16, borderRadius: 8, marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>Valor total en inventario</Text>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#f97316' }}>${totalInventoryValue.toLocaleString()}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1, backgroundColor: '#f9fafb', padding: 12, borderRadius: 8 }}>
                        <Text style={{ fontSize: 12, color: '#6b7280' }}>Total productos</Text>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>{products.length}</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: '#fee2e2', padding: 12, borderRadius: 8 }}>
                        <Text style={{ fontSize: 12, color: '#6b7280' }}>Stock bajo</Text>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ef4444' }}>{lowStockCount}</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    )
}
