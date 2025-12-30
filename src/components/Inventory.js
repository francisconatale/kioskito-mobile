import { useState, useCallback } from "react"
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, RefreshControl } from "react-native"
import { Ionicons, Feather } from '@expo/vector-icons'
import { getInventoryMovements } from '../utils/calculations'

export const Inventory = ({
    products,
    sales,
    movements,
    loading,
    onShowProductModal,
    onDeleteProduct,
    onEditProduct,
    onShowBarcodeScanner,
    onShowRestockModal,
    onRefresh
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
        <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
            <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>Inventario</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                        style={{ backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' }}
                        onPress={onShowBarcodeScanner}
                    >
                        <Ionicons name="barcode-outline" size={18} color="#2563EB" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{ backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center' }}
                        onPress={onShowRestockModal}
                    >
                        <Ionicons name="add-circle-outline" size={18} color="#fff" />
                        <Text style={{ color: 'white', fontWeight: '600', marginLeft: 4, fontSize: 13 }}>Ingresar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{ backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center' }}
                        onPress={onShowProductModal}
                    >
                        <Ionicons name="add" size={18} color="#fff" />
                        <Text style={{ color: 'white', fontWeight: '600', marginLeft: 4, fontSize: 13 }}>Nuevo</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12 }}>
                <TouchableOpacity
                    onPress={() => setActiveTab("list")}
                    style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderBottomWidth: 2,
                        borderBottomColor: activeTab === 'list' ? '#2563EB' : 'transparent',
                        alignItems: 'center'
                    }}
                >
                    <Text style={{ fontWeight: activeTab === 'list' ? 'bold' : '500', color: activeTab === 'list' ? '#2563EB' : '#6B7280' }}>Lista Stock</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab("movements")}
                    style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderBottomWidth: 2,
                        borderBottomColor: activeTab === 'movements' ? '#2563EB' : 'transparent',
                        alignItems: 'center'
                    }}
                >
                    <Text style={{ fontWeight: activeTab === 'movements' ? 'bold' : '500', color: activeTab === 'movements' ? '#2563EB' : '#6B7280' }}>Movimientos</Text>
                </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 16, pb: 12, paddingBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 12 }}>
                    <Ionicons name="search" size={18} color="#9CA3AF" />
                    <TextInput
                        style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 8, fontSize: 14, color: '#111827' }}
                        placeholder={activeTab === 'list' ? "Buscar productos..." : "Buscar movimientos..."}
                        placeholderTextColor="#9CA3AF"
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>
            </View>
        </View>
    )

    const renderProductList = () => (
        <ScrollView
            style={{ flex: 1, padding: 16 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#2563EB']} />}
        >
            {filteredProducts.map((product) => (
                <View key={product.id} style={{ backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 10, overflow: 'hidden' }}>
                    <TouchableOpacity
                        style={{ flexDirection: 'row', padding: 14 }}
                        onPress={() => onEditProduct(product)}
                    >
                        <View style={{ width: 44, height: 44, backgroundColor: '#DBEAFE', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                            <Feather name="package" size={20} color="#2563EB" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>{product.nombre}</Text>
                                    {product.marca && (
                                        <Text style={{ fontSize: 12, color: '#2563EB', fontWeight: '500' }}>{product.marca}</Text>
                                    )}
                                </View>
                                <TouchableOpacity style={{ padding: 6 }} onPress={() => onDeleteProduct(product.id)}>
                                    <Ionicons name="trash-outline" size={16} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                                <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 16 }}>${product.precio}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: product.stock < 10 ? '#FEE2E2' : '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                                    <Text style={{ fontSize: 12, color: product.stock < 10 ? '#DC2626' : '#6B7280', fontWeight: 'bold' }}>
                                        {product.stock} un.
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            ))}
            {filteredProducts.length === 0 && (
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 64 }}>
                    <Feather name="package" size={48} color="#E5E7EB" />
                    <Text style={{ color: '#9CA3AF', marginTop: 12 }}>No hay productos</Text>
                </View>
            )}
            <View style={{ height: 40 }} />
        </ScrollView>
    )

    const renderMovements = () => (
        <ScrollView
            style={{ flex: 1, padding: 16 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#2563EB']} />}
        >
            {filteredMovements.map((m) => (
                <View key={m.id} style={{ backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        backgroundColor: m.tipo === 'ENTRADA' ? '#DCFCE7' : '#FEE2E2',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12
                    }}>
                        <Ionicons
                            name={m.tipo === 'ENTRADA' ? 'arrow-up' : 'arrow-down'}
                            size={20}
                            color={m.tipo === 'ENTRADA' ? '#16A34A' : '#DC2626'}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '600', color: '#111827', fontSize: 14 }}>{m.productoNombre}</Text>
                        <Text style={{ fontSize: 12, color: '#6B7280' }}>
                            {new Date(m.fecha).toLocaleDateString()} · {new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{
                            fontWeight: 'bold',
                            fontSize: 16,
                            color: m.tipo === 'ENTRADA' ? '#16A34A' : '#DC2626'
                        }}>
                            {m.tipo === 'ENTRADA' ? '+' : '-'}{m.cantidad}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{m.tipo === 'ENTRADA' ? 'Ingreso' : (m.motivo || 'Salida')}</Text>
                    </View>
                </View>
            ))}
            {filteredMovements.length === 0 && (
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 64 }}>
                    <Ionicons name="swap-vertical-outline" size={48} color="#E5E7EB" />
                    <Text style={{ color: '#9CA3AF', marginTop: 12 }}>No hay movimientos</Text>
                </View>
            )}
            <View style={{ height: 40 }} />
        </ScrollView>
    )

    if (loading && !products.length) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#2563EB" />
            </View>
        )
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            {renderHeader()}
            {activeTab === 'list' ? renderProductList() : renderMovements()}
        </View>
    )
}
