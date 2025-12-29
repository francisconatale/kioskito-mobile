import { useState } from "react"
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal } from "react-native"
import { Ionicons, Feather } from '@expo/vector-icons'

export const SaleModal = ({
    visible,
    onClose,
    products,
    saleCart,
    onAddToCart,
    onRemoveFromCart,
    onUpdateCartQuantity,
    onCompleteSale,
    onClearCart,
    onShowBarcodeScanner
}) => {
    const [newSale, setNewSale] = useState({ productId: "", quantity: "1" })
    const [metodoPago, setMetodoPago] = useState("efectivo")
    const [clienteId, setClienteId] = useState(null)
    const [step, setStep] = useState(1) // 1: Carrito/Agregar, 2: Pagar

    const handleAddToCart = () => {
        const success = onAddToCart(newSale.productId, newSale.quantity)
        if (success) {
            setNewSale({ productId: "", quantity: "1" })
        }
    }

    const handleCompleteSale = async () => {
        const result = await onCompleteSale(metodoPago, clienteId)
        if (result && result.success) {
            setNewSale({ productId: "", quantity: "1" })
            setMetodoPago("efectivo")
            setClienteId(null)
            onClose()
        }
    }

    const cartTotal = saleCart.reduce((sum, item) => sum + item.subtotal, 0)

    const handleClose = () => {
        onClearCart()
        setNewSale({ productId: "", quantity: "1" })
        setStep(1)
        onClose()
    }

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, width: '100%', maxWidth: 500, maxHeight: '90%' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {step === 2 && (
                                <TouchableOpacity onPress={() => setStep(1)} style={{ marginRight: 16 }}>
                                    <Ionicons name="arrow-back" size={24} color="#6b7280" />
                                </TouchableOpacity>
                            )}
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>
                                {step === 1 ? 'Nueva Venta' : 'Finalizar Venta'}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView>
                        {step === 1 ? (
                            <>
                                {/* 1. Add Product Section */}
                                <View style={{ marginBottom: 16 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>Agregar producto</Text>
                                        <TouchableOpacity
                                            onPress={() => onShowBarcodeScanner('sale')}
                                            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4 }}
                                        >
                                            <Ionicons name="scan-outline" size={16} color="#3b82f6" />
                                            <Text style={{ fontSize: 12, fontWeight: '500', color: '#3b82f6', marginLeft: 4 }}>Escanear</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <ScrollView style={{ maxHeight: 240, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#f3f4f6' }}>
                                        {products.map((product) => (
                                            <TouchableOpacity
                                                key={product.id}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    paddingVertical: 10,
                                                    paddingHorizontal: 12,
                                                    borderBottomWidth: 1,
                                                    borderBottomColor: '#f3f4f6',
                                                    backgroundColor: newSale.productId === product.id ? '#eff6ff' : 'transparent'
                                                }}
                                                onPress={() => setNewSale({ ...newSale, productId: product.id, quantity: "1" })}
                                            >
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontWeight: '600', color: '#111827', fontSize: 14 }}>{product.nombre}</Text>
                                                    <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                                                        ${product.precio} · {product.stock} disponibles
                                                    </Text>
                                                </View>
                                                {newSale.productId === product.id && (
                                                    <Ionicons name="checkmark" size={18} color="#3b82f6" />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                {/* 2. Quantity/Add (Contextual) */}
                                {newSale.productId ? (
                                    <View style={{ marginBottom: 24, marginTop: -8, backgroundColor: '#eff6ff', padding: 12, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: '#dbeafe' }}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        const current = parseInt(newSale.quantity) || 1
                                                        if (current > 1) setNewSale({ ...newSale, quantity: (current - 1).toString() })
                                                    }}
                                                    style={{ padding: 8 }}
                                                >
                                                    <Ionicons name="remove" size={20} color="#3b82f6" />
                                                </TouchableOpacity>
                                                <Text style={{ marginHorizontal: 12, fontSize: 16, fontWeight: '600', color: '#1e40af', minWidth: 20, textAlign: 'center' }}>
                                                    {newSale.quantity}
                                                </Text>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        const current = parseInt(newSale.quantity) || 0
                                                        setNewSale({ ...newSale, quantity: (current + 1).toString() })
                                                    }}
                                                    style={{ padding: 8 }}
                                                >
                                                    <Ionicons name="add" size={20} color="#3b82f6" />
                                                </TouchableOpacity>
                                            </View>

                                            <TouchableOpacity
                                                style={{ paddingHorizontal: 16, paddingVertical: 10 }}
                                                onPress={handleAddToCart}
                                            >
                                                <Text style={{ color: '#2563eb', fontWeight: '600' }}>Agregar a la venta</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : null}

                                {/* 3. Shopping Cart (Below Product List) */}
                                {saleCart.length > 0 ? (
                                    <View style={{ marginBottom: 24, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 16 }}>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Carrito de compra</Text>
                                        <View style={{ backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#f3f4f6' }}>
                                            {saleCart.map((item) => (
                                                <View key={item.productId} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={{ fontWeight: '600', color: '#111827' }}>{item.productName}</Text>
                                                        <Text style={{ fontSize: 13, color: '#6b7280' }}>${item.price} c/u</Text>
                                                    </View>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                        <TouchableOpacity
                                                            style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#e5e7eb', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
                                                            onPress={() => onUpdateCartQuantity(item.productId, item.quantity - 1)}
                                                        >
                                                            <Ionicons name="remove" size={16} color="#374151" />
                                                        </TouchableOpacity>
                                                        <Text style={{ fontWeight: 'bold', color: '#111827', minWidth: 20, textAlign: 'center' }}>{item.quantity}</Text>
                                                        <TouchableOpacity
                                                            style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#e5e7eb', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
                                                            onPress={() => onUpdateCartQuantity(item.productId, item.quantity + 1)}
                                                        >
                                                            <Ionicons name="add" size={16} color="#374151" />
                                                        </TouchableOpacity>
                                                        <Text style={{ fontWeight: 'bold', color: '#10b981', minWidth: 60, textAlign: 'right' }}>${item.subtotal}</Text>
                                                        <TouchableOpacity
                                                            style={{ marginLeft: 8 }}
                                                            onPress={() => onRemoveFromCart(item.productId)}
                                                        >
                                                            <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            ))}
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 16 }}>
                                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>Total:</Text>
                                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#10b981' }}>${cartTotal}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={{ alignItems: 'center', paddingVertical: 32, opacity: 0.5 }}>
                                        <Ionicons name="cart-outline" size={48} color="#9ca3af" />
                                        <Text style={{ marginTop: 8, color: '#6b7280' }}>El carrito está vacío</Text>
                                    </View>
                                )}

                                {saleCart.length > 0 && (
                                    <TouchableOpacity
                                        style={{ backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 }}
                                        onPress={() => setStep(2)}
                                    >
                                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                                            Continuar (${cartTotal})
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        ) : (
                            <>
                                {/* Step 2: Payment & Confirm */}
                                <View style={{ alignItems: 'center', marginVertical: 24 }}>
                                    <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>Total a pagar</Text>
                                    <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#111827' }}>${cartTotal}</Text>
                                    <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{saleCart.reduce((acc, item) => acc + item.quantity, 0)} productos</Text>
                                </View>

                                <View style={{ marginBottom: 32 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Método de Pago</Text>
                                    <View style={{ gap: 8 }}>
                                        {['efectivo', 'tarjeta', 'transferencia'].map((metodo) => (
                                            <TouchableOpacity
                                                key={metodo}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    padding: 16,
                                                    borderRadius: 12,
                                                    borderWidth: 1,
                                                    borderColor: metodoPago === metodo ? '#3b82f6' : '#e5e7eb',
                                                    backgroundColor: metodoPago === metodo ? '#eff6ff' : 'white',
                                                }}
                                                onPress={() => setMetodoPago(metodo)}
                                            >
                                                <View style={{
                                                    width: 20,
                                                    height: 20,
                                                    borderRadius: 10,
                                                    borderWidth: 2,
                                                    borderColor: metodoPago === metodo ? '#3b82f6' : '#9ca3af',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginRight: 12
                                                }}>
                                                    {metodoPago === metodo && (
                                                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#3b82f6' }} />
                                                    )}
                                                </View>
                                                <Text style={{
                                                    fontSize: 16,
                                                    fontWeight: metodoPago === metodo ? '600' : '400',
                                                    color: metodoPago === metodo ? '#111827' : '#374151',
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {metodo}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={{ backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center' }}
                                    onPress={handleCompleteSale}
                                >
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Confimar Venta</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </ScrollView>
                </View >
            </View >
        </Modal >
    )
}
