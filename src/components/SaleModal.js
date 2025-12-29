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
    const PAYMENT_OPTIONS = {
        efectivo: { label: 'Efectivo', surcharge: 0, icon: 'cash-outline' },
        transferencia: { label: 'Transferencia', surcharge: 0, icon: 'phone-portrait-outline' },
        debito: { label: 'Débito (~3%)', surcharge: 0.03, icon: 'card-outline' },
        prepaga: { label: 'Prepaga (4.5%)', surcharge: 0.045, icon: 'wallet-outline' },
        credito_inmediato: { label: 'Crédito Inmediato (8%)', surcharge: 0.08, icon: 'flash-outline' },
    }

    const [newSale, setNewSale] = useState({ productId: "", quantity: "1" })
    const [metodoPago, setMetodoPago] = useState("efectivo")
    const [clienteId, setClienteId] = useState(null)
    const [step, setStep] = useState(1) // 1: Carrito/Agregar, 2: Pagar
    const [searchTerm, setSearchTerm] = useState("")

    const filteredProducts = products.filter(product =>
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    )


    const handleAddToCart = () => {
        const success = onAddToCart(newSale.productId, newSale.quantity)
        if (success) {
            setNewSale({ productId: "", quantity: "1" })
        }
    }

    const handleCompleteSale = async () => {
        const surchargePct = PAYMENT_OPTIONS[metodoPago]?.surcharge || 0
        const currentTotal = saleCart.reduce((sum, item) => sum + item.subtotal, 0)
        const recargoAmount = currentTotal * surchargePct

        const result = await onCompleteSale(metodoPago, clienteId, recargoAmount)
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

                                    <View style={{ marginBottom: 8 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: '#e5e7eb' }}>
                                            <Ionicons name="search" size={18} color="#9ca3af" />
                                            <TextInput
                                                style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 8, fontSize: 14, color: '#111827' }}
                                                placeholder="Buscar producto..."
                                                placeholderTextColor="#9ca3af"
                                                value={searchTerm}
                                                onChangeText={setSearchTerm}
                                            />
                                            {searchTerm.length > 0 && (
                                                <TouchableOpacity onPress={() => setSearchTerm("")}>
                                                    <Ionicons name="close-circle" size={18} color="#9ca3af" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>

                                    <ScrollView style={{ maxHeight: 240, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#f3f4f6' }}>
                                        {filteredProducts.map((product) => (
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
                                {(() => {
                                    const surchargePct = PAYMENT_OPTIONS[metodoPago]?.surcharge || 0
                                    const recargoAmount = cartTotal * surchargePct
                                    const finalTotal = cartTotal + recargoAmount

                                    return (
                                        <>
                                            <View style={{ width: '100%', backgroundColor: '#f9fafb', padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#f3f4f6' }}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                                    <Text style={{ color: '#4b5563', fontSize: 16 }}>Subtotal</Text>
                                                    <Text style={{ fontWeight: '600', color: '#111827', fontSize: 16 }}>${Math.round(cartTotal)}</Text>
                                                </View>

                                                {recargoAmount > 0 && (
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                                        <Text style={{ color: '#c2410c', fontSize: 15 }}>Recargo ({(surchargePct * 100).toLocaleString()}%)</Text>
                                                        <Text style={{ fontWeight: '600', color: '#c2410c', fontSize: 15 }}>+${Math.round(recargoAmount)}</Text>
                                                    </View>
                                                )}

                                                <View style={{ height: 1, backgroundColor: '#e5e7eb', marginVertical: 8 }} />

                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>Total Final</Text>
                                                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#10b981' }}>${Math.round(finalTotal)}</Text>
                                                </View>

                                                <Text style={{ fontSize: 13, color: '#9ca3af', marginTop: 8, textAlign: 'right' }}>
                                                    {saleCart.reduce((acc, item) => acc + item.quantity, 0)} productos
                                                </Text>
                                            </View>

                                            <View style={{ marginBottom: 32 }}>
                                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Método de Pago</Text>
                                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                                    {Object.entries(PAYMENT_OPTIONS).map(([key, option]) => (
                                                        <TouchableOpacity
                                                            key={key}
                                                            style={{
                                                                width: '48%', // Approx 2 columns
                                                                flexDirection: 'row',
                                                                alignItems: 'center',
                                                                padding: 12,
                                                                borderRadius: 12,
                                                                borderWidth: 1,
                                                                borderColor: metodoPago === key ? '#3b82f6' : '#e5e7eb',
                                                                backgroundColor: metodoPago === key ? '#eff6ff' : 'white',
                                                            }}
                                                            onPress={() => setMetodoPago(key)}
                                                        >
                                                            <Ionicons name={option.icon} size={20} color={metodoPago === key ? '#3b82f6' : '#6b7280'} style={{ marginRight: 8 }} />
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={{
                                                                    fontSize: 13,
                                                                    fontWeight: metodoPago === key ? '700' : '400',
                                                                    color: metodoPago === key ? '#111827' : '#374151',
                                                                }}>
                                                                    {option.label}
                                                                </Text>
                                                            </View>
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            </View>

                                            <TouchableOpacity
                                                style={{ backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center' }}
                                                onPress={handleCompleteSale}
                                            >
                                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
                                                    Cobrar ${Math.round(finalTotal)}
                                                </Text>
                                            </TouchableOpacity>
                                        </>
                                    )
                                })()}
                            </>
                        )}
                    </ScrollView>
                </View >
            </View >
        </Modal >
    )
}
