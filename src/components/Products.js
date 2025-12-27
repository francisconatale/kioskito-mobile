import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native"
import { Ionicons, Feather } from '@expo/vector-icons'

export const Products = ({ products, loading, onShowProductModal, onDeleteProduct }) => {
    return (
        <View style={{ flex: 1 }}>
            <View style={{ backgroundColor: 'white', padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>Mis Productos</Text>
                    <TouchableOpacity
                        style={{ backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
                        onPress={onShowProductModal}
                    >
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={{ color: 'white', fontWeight: '600', marginLeft: 4 }}>Agregar</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={{ color: '#6b7280', marginTop: 12 }}>Cargando productos...</Text>
                </View>
            ) : (
                <ScrollView style={{ flex: 1, padding: 16 }}>
                    {products.map((product) => (
                        <View key={product.id} style={{ backgroundColor: 'white', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 12 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>{product.nombre}</Text>
                                    {product.descripcion && (
                                        <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>{product.descripcion}</Text>
                                    )}
                                    {product.codigoBarras && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                            <Ionicons name="barcode-outline" size={14} color="#6b7280" style={{ marginRight: 4 }} />
                                            <Text style={{ fontSize: 12, color: '#6b7280' }}>{product.codigoBarras}</Text>
                                        </View>
                                    )}
                                    <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
                                        <View>
                                            <Text style={{ fontSize: 12, color: '#6b7280' }}>Precio</Text>
                                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#10b981' }}>${product.precio}</Text>
                                        </View>
                                        <View>
                                            <Text style={{ fontSize: 12, color: '#6b7280' }}>Stock</Text>
                                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: product.stock < 10 ? '#ef4444' : '#111827' }}>
                                                {product.stock}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={{ backgroundColor: '#fee2e2', padding: 8, borderRadius: 8 }}
                                    onPress={() => onDeleteProduct(product.id)}
                                >
                                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                    {products.length === 0 && !loading && (
                        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
                            <Feather name="package" size={48} color="#d1d5db" />
                            <Text style={{ color: '#9ca3af', marginTop: 16 }}>No hay productos registrados</Text>
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    )
}
