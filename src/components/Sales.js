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
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <View style={{ backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', fontFamily: 'System' }}>Actividad</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                            style={{ backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                            onPress={onShowSaleModal}
                        >
                            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13, fontFamily: 'System' }}>Nueva Venta</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <ScrollView
                style={{ flex: 1, paddingHorizontal: 16 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#2563EB']} />
                }
            >
                <View style={{ height: 16 }} />
                {sales
                    .filter(s => s.tipo !== 'RESTOCK')
                    .slice()
                    .reverse()
                    .map((sale) => (
                        <TouchableOpacity
                            key={sale.id}
                            style={{
                                backgroundColor: 'white',
                                paddingHorizontal: 16,
                                paddingVertical: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: '#E5E7EB',
                                marginBottom: 10,
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                            onPress={() => onShowSaleDetails(sale)}
                        >
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                                    <View style={{
                                        paddingHorizontal: 6,
                                        paddingVertical: 1,
                                        borderRadius: 4,
                                        backgroundColor: sale.tipo === 'RESTOCK' ? '#F3F4F6' : (sale.tipo === 'PAGO' ? '#DBEAFE' : '#DCFCE7'),
                                        marginRight: 8
                                    }}>
                                        <Text style={{
                                            fontSize: 10,
                                            fontWeight: '700',
                                            color: sale.tipo === 'RESTOCK' ? '#6B7280' : (sale.tipo === 'PAGO' ? '#2563EB' : '#16A34A'),
                                            textTransform: 'uppercase'
                                        }}>
                                            {sale.tipo === 'RESTOCK' ? 'Restock' : (sale.tipo === 'PAGO' ? 'Pago' : 'Venta')}
                                        </Text>
                                    </View>
                                    {sale.metodoPago?.toUpperCase() === 'FIADO' && (
                                        <View style={{
                                            paddingHorizontal: 6,
                                            paddingVertical: 1,
                                            borderRadius: 4,
                                            backgroundColor: '#FEE2E2',
                                            marginRight: 8
                                        }}>
                                            <Text style={{
                                                fontSize: 10,
                                                fontWeight: '700',
                                                color: '#DC2626',
                                                textTransform: 'uppercase'
                                            }}>
                                                Fiado
                                            </Text>
                                        </View>
                                    )}
                                    <Text style={{ fontSize: 14, color: '#111827', fontFamily: 'System' }}>
                                        #{sale.id.toString().slice(-4)}
                                    </Text>
                                </View>
                                <Text style={{ fontSize: 12, color: '#6B7280', fontFamily: 'System' }}>
                                    {new Date(sale.date).toLocaleDateString("es-ES")} · {new Date(sale.date).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}
                                    {sale.tipo === 'PAGO'
                                        ? ` · Pago de ${sale.clienteNombre || 'Cliente'}`
                                        : ` · ${sale.items?.length || 0} ${sale.items?.length === 1 ? 'producto' : 'productos'}`
                                    }
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <Text style={{
                                    fontSize: 15,
                                    fontWeight: '600',
                                    color: sale.tipo === 'RESTOCK' ? '#6B7280' : (sale.tipo === 'PAGO' ? '#2563EB' : '#16A34A'),
                                    fontFamily: 'System'
                                }}>
                                    ${sale.total}
                                </Text>
                                <Ionicons name="chevron-forward" size={14} color="#D1D5DB" />
                            </View>
                        </TouchableOpacity>
                    ))}
                {sales.length === 0 && (
                    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 64 }}>
                        <Ionicons name="list-outline" size={40} color="#E5E7EB" />
                        <Text style={{ color: '#9CA3AF', marginTop: 12, fontSize: 14, fontFamily: 'System' }}>No hay actividad registrada</Text>
                    </View>
                )}
                <View style={{ height: 32 }} />
            </ScrollView>
        </View>
    )
}
