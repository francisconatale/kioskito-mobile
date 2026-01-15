import { useState, useCallback } from "react"
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, RefreshControl, StyleSheet } from "react-native"
import { Ionicons, Feather } from '@expo/vector-icons'

export const Inventory = ({
    products,
    movements,
    loading,
    onShowProductModal,
    onDeleteProduct,
    onEditProduct,
    onShowBarcodeScanner,
    onShowRestockModal,
    onRefresh,
    dashboardStats,
    userPlan
}) => {
    const [activeTab, setActiveTab] = useState("list") // "list" or "movements"
    const [searchTerm, setSearchTerm] = useState("")
    const [refreshing, setRefreshing] = useState(false)

    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        await onRefresh()
        setRefreshing(false)
    }, [onRefresh])

    const filteredProducts = products.filter(product =>
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.marca && product.marca.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const filteredMovements = movements.filter(m =>
        m.productoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.productoMarca && m.productoMarca.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View style={styles.headerTop}>
                <View>
                    <Text style={styles.headerTitle}>Inventario</Text>
                    {userPlan === 'EMPRENDEDOR' && dashboardStats && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <View style={{
                                backgroundColor: dashboardStats.productsCount >= dashboardStats.productsLimit ? '#FEE2E2' : '#E0E7FF',
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 6,
                                flexDirection: 'row',
                                alignItems: 'center'
                            }}>
                                <Feather name="package" size={12} color={dashboardStats.productsCount >= dashboardStats.productsLimit ? '#DC2626' : '#4F46E5'} />
                                <Text style={{
                                    fontSize: 11,
                                    fontWeight: '700',
                                    marginLeft: 4,
                                    color: dashboardStats.productsCount >= dashboardStats.productsLimit ? '#DC2626' : '#4F46E5'
                                }}>
                                    {dashboardStats.productsCount} / {dashboardStats.productsLimit} productos
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
                <TouchableOpacity style={styles.barcodeBtn} onPress={onShowBarcodeScanner}>
                    <Ionicons name="barcode-outline" size={22} color="#4F46E5" />
                </TouchableOpacity>
            </View>

            <View style={styles.searchBarContainer}>
                <Feather name="search" size={18} color="#9CA3AF" />
                <TextInput
                    style={styles.searchInput}
                    placeholder={activeTab === 'list' ? "Buscar por nombre o marca..." : "Buscar movimientos..."}
                    placeholderTextColor="#9CA3AF"
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                />
                {searchTerm !== "" && (
                    <TouchableOpacity onPress={() => setSearchTerm("")}>
                        <Ionicons name="close-circle" size={18} color="#D1D5DB" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    onPress={() => setActiveTab("list")}
                    style={[styles.tab, activeTab === 'list' && styles.activeTab]}
                >
                    <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>Lista</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab("movements")}
                    style={[styles.tab, activeTab === 'movements' && styles.activeTab]}
                >
                    <Text style={[styles.tabText, activeTab === 'movements' && styles.activeTabText]}>Movimientos</Text>
                </TouchableOpacity>
            </View>
        </View>
    )

    const renderProductList = () => (
        <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#4F46E5']} />}
        >
            <View style={styles.actionButtonsRow}>
                <TouchableOpacity style={[styles.mainActionBtn, styles.greenBtn]} onPress={onShowRestockModal}>
                    <Feather name="plus-circle" size={18} color="#fff" />
                    <Text style={styles.mainActionBtnText}>Ingreso Mercadería</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.mainActionBtn, styles.indigoBtn]} onPress={onShowProductModal}>
                    <Feather name="plus" size={18} color="#fff" />
                    <Text style={styles.mainActionBtnText}>Nuevo Producto</Text>
                </TouchableOpacity>
            </View>

            {filteredProducts.map((product) => (
                <TouchableOpacity
                    key={product.id}
                    style={styles.productCard}
                    onPress={() => onEditProduct(product)}
                >
                    <View style={styles.productIconBox}>
                        <Feather name="package" size={20} color="#4F46E5" />
                    </View>
                    <View style={styles.productInfo}>
                        <View style={styles.productHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.productName}>{product.nombre}</Text>
                                {product.marca && <Text style={styles.productBrand}>{product.marca}</Text>}
                            </View>
                            <TouchableOpacity style={styles.deleteBtn} onPress={() => onDeleteProduct(product.id)}>
                                <Feather name="trash-2" size={16} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.productFooter}>
                            <Text style={styles.productPrice}>${product.precio.toLocaleString('es-ES')}</Text>
                            <View style={[
                                styles.stockPill,
                                product.stock < 10 ? styles.lowStockPill : styles.normalStockPill
                            ]}>
                                <Text style={[
                                    styles.stockText,
                                    product.stock < 10 ? styles.lowStockText : styles.normalStockText
                                ]}>
                                    {product.stock} unidades
                                </Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            ))}

            {filteredProducts.length === 0 && (
                <View style={styles.emptyContainer}>
                    <Feather name="box" size={48} color="#E5E7EB" />
                    <Text style={styles.emptyText}>No se encontraron productos</Text>
                </View>
            )}
            <View style={{ height: 100 }} />
        </ScrollView>
    )

    const renderMovements = () => (
        <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#4F46E5']} />}
        >
            {filteredMovements.map((m) => (
                <View key={m.id} style={styles.movementCard}>
                    <View style={[
                        styles.movementIconBox,
                        m.tipo === 'ENTRADA' ? styles.entryBg : styles.exitBg
                    ]}>
                        <Feather
                            name={m.tipo === 'ENTRADA' ? "arrow-up" : "arrow-down"}
                            size={18}
                            color={m.tipo === 'ENTRADA' ? "#10B981" : "#EF4444"}
                        />
                    </View>
                    <View style={styles.movementInfo}>
                        <Text style={styles.movementTitle}>{m.productoNombre}</Text>
                        <Text style={styles.movementDate}>
                            {new Date(m.fecha).toLocaleDateString()} · {new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                    <View style={styles.movementAmountBox}>
                        <Text style={[
                            styles.movementAmount,
                            m.tipo === 'ENTRADA' ? styles.entryText : styles.exitText
                        ]}>
                            {m.tipo === 'ENTRADA' ? '+' : '-'}{m.cantidad}
                        </Text>
                        <Text style={styles.movementMotivo}>{m.tipo === 'ENTRADA' ? 'Ingreso' : (m.motivo || 'Venta')}</Text>
                    </View>
                </View>
            ))}

            {filteredMovements.length === 0 && (
                <View style={styles.emptyContainer}>
                    <Feather name="activity" size={48} color="#E5E7EB" />
                    <Text style={styles.emptyText}>Sin movimientos recientes</Text>
                </View>
            )}
            <View style={{ height: 100 }} />
        </ScrollView>
    )

    if (loading && !products.length) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#4F46E5" />
            </View>
        )
    }

    return (
        <View style={styles.mainContainer}>
            {renderHeader()}
            {activeTab === 'list' ? renderProductList() : renderMovements()}
        </View>
    )
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContainer: {
        backgroundColor: 'white',
        paddingTop: 12,
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
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
    },
    barcodeBtn: {
        width: 44,
        height: 44,
        backgroundColor: '#EEF2FF',
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        marginHorizontal: 20,
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 12,
        fontSize: 15,
        color: '#111827',
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#4F46E5',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#4F46E5',
        fontWeight: '700',
    },
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    mainActionBtn: {
        flex: 1,
        height: 48,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    indigoBtn: { backgroundColor: '#4F46E5' },
    greenBtn: { backgroundColor: '#10B981' },
    mainActionBtnText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 13,
    },
    productCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginBottom: 12,
    },
    productIconBox: {
        width: 48,
        height: 48,
        backgroundColor: '#EEF2FF',
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    productInfo: {
        flex: 1,
    },
    productHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    productName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    productBrand: {
        fontSize: 12,
        color: '#4F46E5',
        fontWeight: '600',
        marginTop: 2,
    },
    deleteBtn: {
        padding: 4,
    },
    productFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    productPrice: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
    },
    stockPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    normalStockPill: { backgroundColor: '#F3F4F6' },
    lowStockPill: { backgroundColor: '#FEE2E2' },
    stockText: {
        fontSize: 12,
        fontWeight: '700',
    },
    normalStockText: { color: '#6B7280' },
    lowStockText: { color: '#EF4444' },
    movementCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        flexDirection: 'row',
        alignItems: 'center',
    },
    movementIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    entryBg: { backgroundColor: '#ECFDF5' },
    exitBg: { backgroundColor: '#FEF2F2' },
    movementInfo: {
        flex: 1,
    },
    movementTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    movementDate: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 2,
    },
    movementAmountBox: {
        alignItems: 'flex-end',
    },
    movementAmount: {
        fontSize: 16,
        fontWeight: '800',
    },
    entryText: { color: '#10B981' },
    exitText: { color: '#EF4444' },
    movementMotivo: {
        fontSize: 10,
        color: '#9CA3AF',
        textTransform: 'uppercase',
        marginTop: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        color: '#9CA3AF',
        marginTop: 12,
        fontSize: 14,
    },
})
