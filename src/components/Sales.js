import { useState, useCallback } from "react"
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from "react-native"
import { Ionicons, Feather } from '@expo/vector-icons'
import { calculateTotalSalesMonth } from '../utils/calculations'

export const Sales = ({ sales, onShowSaleModal, onShowBarcodeScanner, onShowSaleDetails, onRefresh }) => {
    const totalSalesMonth = calculateTotalSalesMonth(sales)
    const [refreshing, setRefreshing] = useState(false)

    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        await onRefresh()
        setRefreshing(false)
    }, [onRefresh])

    const recentSales = [...sales]
        .filter(s => s.tipo !== 'RESTOCK')
        .reverse()

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>Ventas</Text>
                    <TouchableOpacity style={styles.newSaleBtn} onPress={onShowSaleModal}>
                        <Feather name="plus" size={20} color="white" />
                        <Text style={styles.newSaleBtnText}>Nueva Venta</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.summaryCard}>
                    <View>
                        <Text style={styles.summaryLabel}>Ventas del Mes</Text>
                        <Text style={styles.summaryValue}>${totalSalesMonth.toLocaleString('es-ES')}</Text>
                    </View>
                    <View style={styles.summaryIconBox}>
                        <Feather name="calendar" size={20} color="#4F46E5" />
                    </View>
                </View>
            </View>

            <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#4F46E5']} />}
            >
                <Text style={styles.sectionTitle}>Historial Reciente</Text>

                {recentSales.map((sale) => (
                    <TouchableOpacity
                        key={sale.id}
                        style={styles.saleCard}
                        onPress={() => onShowSaleDetails(sale)}
                    >
                        <View style={[
                            styles.saleIconBox,
                            sale.tipo === 'VENTA' && { backgroundColor: '#ECFDF5' },
                            sale.tipo === 'DEVOLUCION' && { backgroundColor: '#FFF7ED' },
                            sale.tipo === 'PAGO' && { backgroundColor: '#EEF2FF' }
                        ]}>
                            <Feather
                                name={sale.tipo === 'PAGO' ? "arrow-down-left" : (sale.tipo === 'DEVOLUCION' ? "rotate-ccw" : "shopping-bag")}
                                size={18}
                                color={sale.tipo === 'PAGO' ? "#2563EB" : (sale.tipo === 'DEVOLUCION' ? "#F59E0B" : "#10B981")}
                            />
                        </View>

                        <View style={styles.saleMain}>
                            <Text style={styles.saleTitle}>
                                {sale.tipo === 'PAGO'
                                    ? `Pago: ${sale.clienteNombre || 'Cliente'}`
                                    : (sale.tipo === 'DEVOLUCION' ? 'Devolución' : 'Venta')
                                }
                            </Text>
                            <Text style={styles.saleTime}>
                                {new Date(sale.date).toLocaleDateString("es-ES", { day: '2-digit', month: 'short' })} · {new Date(sale.date).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}
                                {sale.tipo !== 'PAGO' && ` · ${sale.items?.length || 0} ${sale.items?.length === 1 ? 'producto' : 'productos'}`}
                                {(sale.metodoPago?.toUpperCase() === 'FIADO' && sale.tipo !== 'DEVOLUCION') && " · Fiado"}
                            </Text>
                        </View>

                        <View style={styles.salePriceBox}>
                            {sale.tipo !== 'DEVOLUCION' && (
                                <Text style={[
                                    styles.salePrice,
                                    sale.tipo === 'VENTA' && { color: '#10B981' },
                                    sale.tipo === 'PAGO' && { color: '#2563EB' },
                                    (sale.metodoPago?.toUpperCase() === 'FIADO' && sale.tipo === 'VENTA') && { color: '#D97706' }
                                ]}>
                                    ${sale.total}
                                </Text>
                            )}
                            <Ionicons name="chevron-forward" size={14} color="#D1D5DB" />
                        </View>
                    </TouchableOpacity>
                ))}

                {recentSales.length === 0 && (
                    <View style={styles.emptyState}>
                        <Feather name="layers" size={48} color="#E5E7EB" />
                        <Text style={styles.emptyText}>No hay ventas registradas aún</Text>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
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
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
    },
    newSaleBtn: {
        backgroundColor: '#4F46E5',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
    },
    newSaleBtnText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
    },
    summaryCard: {
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
    },
    summaryIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#111827',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
    },
    saleCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    saleIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    saleMain: {
        flex: 1,
    },
    saleTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    salePrice: {
        fontSize: 16,
        fontWeight: '800',
        marginLeft: 8,
    },
    saleTime: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    salePriceBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        color: '#9CA3AF',
        marginTop: 12,
        fontSize: 14,
    },
})
