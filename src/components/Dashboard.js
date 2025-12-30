import { useState, useCallback } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from "react-native"
import { Ionicons, Feather } from "@expo/vector-icons"
import { calculateTotalSalesToday, calculateRealCashToday, calculateTotalInventoryValue } from "../utils/calculations"

export const Dashboard = ({ products, sales, onShowProductModal, onShowSaleModal, onShowSaleDetails, onRefresh }) => {
    const totalSalesToday = calculateTotalSalesToday(sales)
    const realCashToday = calculateRealCashToday(sales)
    const totalInventoryValue = calculateTotalInventoryValue(products)
    const [refreshing, setRefreshing] = useState(false)

    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        if (onRefresh) {
            await onRefresh()
        }
        setRefreshing(false)
    }, [onRefresh])

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#3b82f6']} />
            }
        >
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Acciones rápidas</Text>
                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={[styles.actionButton, styles.blueButton]} onPress={onShowProductModal}>
                        <Ionicons name="add" size={24} color="#fff" />
                        <Text style={styles.actionButtonText}>Nuevo Producto</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionButton, styles.greenButton]} onPress={onShowSaleModal}>
                        <Ionicons name="cart-outline" size={24} color="#fff" />
                        <Text style={styles.actionButtonText}>Nueva Venta</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.salesCard}>
                <Text style={styles.sectionTitle}>Ventas recientes</Text>
                {sales
                    .filter(s => s.tipo !== 'RESTOCK')
                    .slice(-5)
                    .reverse()
                    .map((sale) => (
                        <TouchableOpacity key={sale.id} style={styles.saleItem} onPress={() => onShowSaleDetails(sale)}>
                            <View style={styles.saleInfo}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    {sale.metodoPago?.toUpperCase() === 'FIADO' && (
                                        <View style={{ backgroundColor: '#fee2e2', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, marginRight: 6 }}>
                                            <Text style={{ fontSize: 10, color: '#dc2626', fontWeight: 'bold' }}>FIADO</Text>
                                        </View>
                                    )}
                                    {sale.tipo === 'PAGO' && (
                                        <View style={{ backgroundColor: '#dbeafe', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, marginRight: 6 }}>
                                            <Text style={{ fontSize: 10, color: '#2563EB', fontWeight: 'bold' }}>PAGO</Text>
                                        </View>
                                    )}
                                    <Text style={styles.saleProductCount}>
                                        {sale.tipo === 'PAGO'
                                            ? `Pago de ${sale.clienteNombre || 'Cliente'}`
                                            : `${sale.items.length} ${sale.items.length === 1 ? "producto" : "productos"}`
                                        }
                                    </Text>
                                </View>
                                <Text style={styles.saleTime}>
                                    {new Date(sale.date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                                </Text>
                            </View>
                            <View style={styles.saleDetails}>
                                <Text style={styles.saleTotal}>${sale.total}</Text>
                                <Text style={styles.saleLink}>Ver más</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                {sales.length === 0 && <Text style={styles.emptyText}>No hay ventas registradas</Text>}
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    statsContainer: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: "white",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    greenIconBg: {
        backgroundColor: "#d1fae5",
    },
    blueIconBg: {
        backgroundColor: "#dbeafe",
    },
    statLabel: {
        color: "#6b7280",
        fontSize: 14,
    },
    statValue: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#111827",
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#111827",
        marginBottom: 12,
    },
    actionsContainer: {
        flexDirection: "row",
        gap: 12,
    },
    actionButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    blueButton: {
        backgroundColor: "#3b82f6",
    },
    greenButton: {
        backgroundColor: "#10b981",
    },
    actionButtonText: {
        fontWeight: "600",
        color: "white",
        marginTop: 8,
    },
    salesCard: {
        backgroundColor: "white",
        padding: 16,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        marginBottom: 24,
    },
    saleItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    saleInfo: {
        flex: 1,
    },
    saleProductCount: {
        fontSize: 14,
        color: "#374151",
        fontWeight: "500",
    },
    saleTime: {
        fontSize: 12,
        color: "#6b7280",
        marginTop: 2,
    },
    saleDetails: {
        alignItems: "flex-end",
    },
    saleTotal: {
        fontWeight: "bold",
        color: "#10b981",
        fontSize: 16,
    },
    saleLink: {
        fontSize: 10,
        color: "#3b82f6",
        marginTop: 2,
    },
    emptyText: {
        color: "#9ca3af",
        textAlign: "center",
        paddingVertical: 16,
    },
})
