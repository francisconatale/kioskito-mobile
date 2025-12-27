import { useState } from "react"
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal } from "react-native"
import { Ionicons } from '@expo/vector-icons'

export const SaleModal = ({
    visible,
    onClose,
    products,
    saleCart,
    onAddToCart,
    onRemoveFromCart,
    onUpdateCartQuantity,
    onCompleteSale,
    onClearCart
}) => {
    const [newSale, setNewSale] = useState({ productId: "", quantity: "1" })
    const [metodoPago, setMetodoPago] = useState("efectivo")
    const [clienteId, setClienteId] = useState(null)

    const handleAddToCart = () => {
        const success = onAddToCart(newSale.productId, newSale.quantity)
        if (success) {
            setNewSale({ productId: "", quantity: "1" })
        }
    }

    const handleCompleteSale = () => {
        const result = onCompleteSale(metodoPago, clienteId)
        if (result && result.success) {
            setNewSale({ productId: "", quantity: "1" })
            setMetodoPago("efectivo")
            setClienteId(null)
            onClose()
        }
    }

    const handleClose = () => {
        onClearCart()
        setNewSale({ productId: "", quantity: "1" })
        onClose()
    }

    const cartTotal = saleCart.reduce((sum, item) => sum + item.subtotal, 0)

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>Nueva Venta</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView>
                        {/* Shopping Cart */}
                        {saleCart.length > 0 && (
                            <View style={{ marginBottom: 16 }}>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Carrito de compra</Text>
                                <View style={{ backgroundColor: '#f9fafb', borderRadius: 8, padding: 12 }}>
                                    {saleCart.map((item) => (
                                        <View key={item.productId} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontWeight: '600', color: '#111827' }}>{item.productName}</Text>
                                                <Text style={{ fontSize: 14, color: '#6b7280' }}>${item.price} c/u</Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <TouchableOpacity
                                                    style={{ backgroundColor: '#e5e7eb', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
                                                    onPress={() => onUpdateCartQuantity(item.productId, item.quantity - 1)}
                                                >
                                                    <Ionicons name="remove" size={16} color="#374151" />
                                                </TouchableOpacity>
                                                <Text style={{ fontWeight: 'bold', color: '#111827', minWidth: 24, textAlign: 'center' }}>{item.quantity}</Text>
                                                <TouchableOpacity
                                                    style={{ backgroundColor: '#e5e7eb', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
                                                    onPress={() => onUpdateCartQuantity(item.productId, item.quantity + 1)}
                                                >
                                                    <Ionicons name="add" size={16} color="#374151" />
                                                </TouchableOpacity>
                                                <Text style={{ fontWeight: 'bold', color: '#10b981', minWidth: 60, textAlign: 'right' }}>${item.subtotal}</Text>
                                                <TouchableOpacity
                                                    style={{ backgroundColor: '#fee2e2', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
                                                    onPress={() => onRemoveFromCart(item.productId)}
                                                >
                                                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12 }}>
                                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>Total:</Text>
                                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#10b981' }}>
                                            ${cartTotal}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Add Product Section */}
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Agregar producto</Text>
                            <ScrollView style={{ maxHeight: 160, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8 }}>
                                {products.map((product) => (
                                    <TouchableOpacity
                                        key={product.id}
                                        style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', backgroundColor: newSale.productId === product.id ? '#eff6ff' : 'transparent' }}
                                        onPress={() => setNewSale({ ...newSale, productId: product.id })}
                                    >
                                        <Text style={{ fontWeight: '600', color: '#111827' }}>{product.nombre}</Text>
                                        <Text style={{ fontSize: 14, color: '#6b7280' }}>
                                            ${product.precio} - Stock: {product.stock}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Cantidad</Text>
                                <TextInput
                                    style={{ backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, color: '#111827' }}
                                    placeholder="1"
                                    keyboardType="numeric"
                                    value={newSale.quantity}
                                    onChangeText={(text) => setNewSale({ ...newSale, quantity: text })}
                                />
                            </View>
                            <View style={{ justifyContent: 'flex-end' }}>
                                <TouchableOpacity
                                    style={{ backgroundColor: '#3b82f6', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', height: 48 }}
                                    onPress={handleAddToCart}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons name="add-circle-outline" size={20} color="#fff" />
                                        <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 4 }}>Agregar</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={{ marginBottom: 24 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Método de Pago</Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {['efectivo', 'tarjeta', 'transferencia'].map((metodo) => (
                                    <TouchableOpacity
                                        key={metodo}
                                        style={{
                                            flex: 1,
                                            padding: 10,
                                            borderRadius: 8,
                                            borderWidth: 1,
                                            borderColor: metodoPago === metodo ? '#3b82f6' : '#e5e7eb',
                                            backgroundColor: metodoPago === metodo ? '#eff6ff' : 'white',
                                            alignItems: 'center'
                                        }}
                                        onPress={() => setMetodoPago(metodo)}
                                    >
                                        <Text style={{
                                            fontSize: 12,
                                            fontWeight: '600',
                                            color: metodoPago === metodo ? '#3b82f6' : '#6b7280',
                                            textTransform: 'capitalize'
                                        }}>
                                            {metodo}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <TouchableOpacity
                            style={{ backgroundColor: '#10b981', padding: 16, borderRadius: 8, alignItems: 'center' }}
                            onPress={handleCompleteSale}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                                <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 8 }}>
                                    Completar Venta {saleCart.length > 0 && `($${cartTotal})`}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    )
}
