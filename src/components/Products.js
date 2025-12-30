import { useState, useCallback } from "react"
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, RefreshControl } from "react-native"
import { Ionicons, Feather } from '@expo/vector-icons'

export const Products = ({ products, loading, onShowProductModal, onDeleteProduct, onEditProduct, onShowBarcodeScanner, onRefresh }) => {
    const [searchTerm, setSearchTerm] = useState("")
    const [refreshing, setRefreshing] = useState(false)

    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        await onRefresh()
        setRefreshing(false)
    }, [onRefresh])

    const filteredProducts = products.filter(product =>
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <View style={{ backgroundColor: 'white', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', fontFamily: 'System' }}>Productos</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                            style={{ backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' }}
                            onPress={onShowBarcodeScanner}
                        >
                            <Ionicons name="barcode-outline" size={18} color="#2563EB" />
                            <Text style={{ color: '#2563EB', fontWeight: '600', marginLeft: 4, fontSize: 13, fontFamily: 'System' }}>Escanear</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center' }}
                            onPress={onShowProductModal}
                        >
                            <Ionicons name="add" size={18} color="#fff" />
                            <Text style={{ color: 'white', fontWeight: '600', marginLeft: 4, fontSize: 13, fontFamily: 'System' }}>Agregar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={{ backgroundColor: 'white', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 12 }}>
                    <Ionicons name="search" size={18} color="#9CA3AF" />
                    <TextInput
                        style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 8, fontSize: 14, color: '#111827', fontFamily: 'System' }}
                        placeholder="Buscar productos..."
                        placeholderTextColor="#9CA3AF"
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                    {searchTerm.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchTerm("")}>
                            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading && !filteredProducts.length ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#2563EB" />
                    <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 13, fontFamily: 'System' }}>Cargando productos...</Text>
                </View>
            ) : (
                <ScrollView
                    style={{ flex: 1, padding: 16 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#3b82f6']} />
                    }
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
                                            <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827', fontFamily: 'System' }}>{product.nombre}</Text>
                                            {product.marca && (
                                                <Text style={{ fontSize: 12, color: '#2563EB', fontWeight: '500', fontFamily: 'System' }}>{product.marca}</Text>
                                            )}
                                        </View>
                                        <TouchableOpacity
                                            style={{ padding: 6 }}
                                            onPress={() => onDeleteProduct(product.id)}
                                        >
                                            <Ionicons name="trash-outline" size={16} color="#9CA3AF" />
                                        </TouchableOpacity>
                                    </View>

                                    {product.descripcion && (
                                        <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2, fontFamily: 'System' }} numberOfLines={1}>{product.descripcion}</Text>
                                    )}

                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                                        <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 16, fontFamily: 'System' }}>${product.precio}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: product.stock < 10 ? '#FEE2E2' : '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                                            <Feather name="layers" size={10} color={product.stock < 10 ? '#DC2626' : '#6B7280'} style={{ marginRight: 4 }} />
                                            <Text style={{ fontSize: 11, color: product.stock < 10 ? '#DC2626' : '#6B7280', fontWeight: '600', fontFamily: 'System' }}>
                                                {product.stock} un.
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                    ))}
                    {filteredProducts.length === 0 && !loading && (
                        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
                            <Feather name="package" size={48} color="#d1d5db" />
                            <Text style={{ color: '#9ca3af', marginTop: 16 }}>
                                {searchTerm ? "No se encontraron productos" : "No hay productos registrados"}
                            </Text>
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    )
}
