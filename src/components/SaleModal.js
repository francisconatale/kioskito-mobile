import { useState } from "react"
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator } from "react-native"
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
    onShowBarcodeScanner,
    clients
}) => {
    const PAYMENT_OPTIONS = {
        efectivo: { label: 'Efectivo', surcharge: 0, icon: 'cash-outline' },
        transferencia: { label: 'Transferencia', surcharge: 0, icon: 'phone-portrait-outline' },
        debito: { label: 'Débito (~3%)', surcharge: 0.03, icon: 'card-outline' },
        prepaga: { label: 'Prepaga (4.5%)', surcharge: 0.045, icon: 'wallet-outline' },
        credito_inmediato: { label: 'Crédito Inmediato (8%)', surcharge: 0.08, icon: 'flash-outline' },
        fiado: { label: 'Fiado (Deuda)', surcharge: 0, icon: 'person-outline' },
    }

    const [newSale, setNewSale] = useState({ productId: "", quantity: "1" })
    const [metodoPago, setMetodoPago] = useState("efectivo")
    const [processing, setProcessing] = useState(false)
    const [clienteId, setClienteId] = useState(null)
    const [step, setStep] = useState(1) // 1: Carrito/Agregar, 2: Pagar, 3: Resumen
    const [searchTerm, setSearchTerm] = useState("")
    const [completedSaleData, setCompletedSaleData] = useState(null)

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
        setProcessing(true)
        try {
            const surchargePct = PAYMENT_OPTIONS[metodoPago]?.surcharge || 0
            const currentTotal = saleCart.reduce((sum, item) => sum + item.subtotal, 0)
            const recargoAmount = currentTotal * surchargePct
            const finalTotal = currentTotal + recargoAmount

            const result = await onCompleteSale(metodoPago, clienteId, recargoAmount)
            if (result && result.success) {
                setCompletedSaleData({
                    total: finalTotal,
                    subtotal: currentTotal,
                    surcharge: recargoAmount,
                    method: metodoPago,
                    methodLabel: PAYMENT_OPTIONS[metodoPago]?.label,
                    itemsCount: saleCart.reduce((acc, item) => acc + item.quantity, 0)
                })
                setStep(3)
            }
        } finally {
            setProcessing(false)
        }
    }

    const cartTotal = saleCart.reduce((sum, item) => sum + item.subtotal, 0)

    const handleClose = () => {
        // Reset full state
        onClearCart()
        setNewSale({ productId: "", quantity: "1" })
        setMetodoPago("efectivo")
        setClienteId(null)
        setCompletedSaleData(null)
        setStep(1)
        onClose()
    }

    const startNewSale = () => {
        onClearCart()
        setNewSale({ productId: "", quantity: "1" })
        setMetodoPago("efectivo")
        setClienteId(null)
        setCompletedSaleData(null)
        setStep(1)
    }

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 500, maxHeight: '90%', borderWidth: 1, borderColor: '#E5E7EB' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {step === 2 && (
                                <TouchableOpacity onPress={() => setStep(1)} style={{ marginRight: 16 }}>
                                    <Ionicons name="arrow-back" size={22} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
                            <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', fontFamily: 'System' }}>
                                {step === 1 ? 'Nueva Venta' : step === 2 ? 'Finalizar Venta' : 'Venta Completada'}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={22} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView>
                        {step === 1 ? (
                            <>
                                {/* 1. Add Product Section */}
                                <View style={{ marginBottom: 16 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', fontFamily: 'System' }}>Agregar producto</Text>
                                        <TouchableOpacity
                                            onPress={() => onShowBarcodeScanner('sale')}
                                            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 2 }}
                                        >
                                            <Ionicons name="scan-outline" size={16} color="#2563EB" />
                                            <Text style={{ fontSize: 12, fontWeight: '600', color: '#2563EB', marginLeft: 4, fontFamily: 'System' }}>Escanear</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={{ marginBottom: 8 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 10 }}>
                                            <Ionicons name="search" size={16} color="#9CA3AF" />
                                            <TextInput
                                                style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 8, fontSize: 14, color: '#111827', fontFamily: 'System' }}
                                                placeholder="Buscar producto..."
                                                placeholderTextColor="#9CA3AF"
                                                value={searchTerm}
                                                onChangeText={setSearchTerm}
                                            />
                                            {searchTerm.length > 0 && (
                                                <TouchableOpacity onPress={() => setSearchTerm("")}>
                                                    <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>

                                    <ScrollView style={{ maxHeight: 200, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' }}>
                                        {filteredProducts.map((product) => (
                                            <TouchableOpacity
                                                key={product.id}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    paddingVertical: 10,
                                                    paddingHorizontal: 12,
                                                    borderBottomWidth: 1,
                                                    borderBottomColor: '#F3F4F6',
                                                    backgroundColor: newSale.productId === product.id ? '#eff6ff' : 'transparent'
                                                }}
                                                onPress={() => setNewSale({ ...newSale, productId: product.id, quantity: "1" })}
                                            >
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontWeight: '600', color: '#111827', fontSize: 14, fontFamily: 'System' }}>{product.nombre}</Text>
                                                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2, fontFamily: 'System' }}>
                                                        ${product.precio} · {product.stock} un.
                                                    </Text>
                                                </View>
                                                {newSale.productId === product.id && (
                                                    <Ionicons name="checkmark" size={18} color="#2563EB" />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                {/* 2. Quantity/Add (Contextual) */}
                                {newSale.productId ? (
                                    <View style={{ marginBottom: 24, marginTop: -8, backgroundColor: '#eff6ff', padding: 12, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, borderWidth: 1, borderColor: '#dbeafe', borderTopWidth: 0 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#dbeafe' }}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        const current = parseInt(newSale.quantity) || 1
                                                        if (current > 1) setNewSale({ ...newSale, quantity: (current - 1).toString() })
                                                    }}
                                                    style={{ padding: 8 }}
                                                >
                                                    <Ionicons name="remove" size={18} color="#2563EB" />
                                                </TouchableOpacity>
                                                <Text style={{ marginHorizontal: 12, fontSize: 15, fontWeight: '600', color: '#1e40af', minWidth: 20, textAlign: 'center', fontFamily: 'System' }}>
                                                    {newSale.quantity}
                                                </Text>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        const current = parseInt(newSale.quantity) || 0
                                                        setNewSale({ ...newSale, quantity: (current + 1).toString() })
                                                    }}
                                                    style={{ padding: 8 }}
                                                >
                                                    <Ionicons name="add" size={18} color="#2563EB" />
                                                </TouchableOpacity>
                                            </View>

                                            <TouchableOpacity
                                                style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                                                onPress={handleAddToCart}
                                            >
                                                <Text style={{ color: '#2563EB', fontWeight: '600', fontSize: 14, fontFamily: 'System' }}>Agregar a la venta</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : null}

                                {/* 3. Shopping Cart (Below Product List) */}
                                {saleCart.length > 0 ? (
                                    <View style={{ marginBottom: 24, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 20 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 12, fontFamily: 'System' }}>Carrito de compra</Text>
                                        <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' }}>
                                            {saleCart.map((item) => (
                                                <View key={item.productId} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={{ fontWeight: '600', color: '#111827', fontSize: 14, fontFamily: 'System' }}>{item.productName}</Text>
                                                        <Text style={{ fontSize: 12, color: '#6B7280', fontFamily: 'System' }}>${item.price} c/u</Text>
                                                    </View>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                        <TouchableOpacity
                                                            style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}
                                                            onPress={() => onUpdateCartQuantity(item.productId, item.quantity - 1)}
                                                        >
                                                            <Ionicons name="remove" size={14} color="#374151" />
                                                        </TouchableOpacity>
                                                        <Text style={{ fontWeight: '600', color: '#111827', minWidth: 16, textAlign: 'center', fontSize: 13, fontFamily: 'System' }}>{item.quantity}</Text>
                                                        <TouchableOpacity
                                                            style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}
                                                            onPress={() => onUpdateCartQuantity(item.productId, item.quantity + 1)}
                                                        >
                                                            <Ionicons name="add" size={14} color="#374151" />
                                                        </TouchableOpacity>
                                                        <Text style={{ fontWeight: 'bold', color: '#16A34A', minWidth: 60, textAlign: 'right', fontSize: 14, fontFamily: 'System' }}>${item.subtotal}</Text>
                                                        <TouchableOpacity
                                                            style={{ marginLeft: 6 }}
                                                            onPress={() => onRemoveFromCart(item.productId)}
                                                        >
                                                            <Ionicons name="trash-outline" size={16} color="#9CA3AF" />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            ))}
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 14 }}>
                                                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#111827', fontFamily: 'System' }}>Total:</Text>
                                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#16A34A', fontFamily: 'System' }}>${cartTotal}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={{ alignItems: 'center', paddingVertical: 32, opacity: 0.5 }}>
                                        <Ionicons name="cart-outline" size={40} color="#9CA3AF" />
                                        <Text style={{ marginTop: 8, color: '#6B7280', fontSize: 13, fontFamily: 'System' }}>El carrito está vacío</Text>
                                    </View>
                                )}

                                {saleCart.length > 0 && (
                                    <TouchableOpacity
                                        style={{ backgroundColor: '#16A34A', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 }}
                                        onPress={() => setStep(2)}
                                    >
                                        <Text style={{ color: 'white', fontWeight: '600', fontSize: 16, fontFamily: 'System' }}>
                                            Continuar (${cartTotal})
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        ) : step === 2 ? (
                            <>
                                {/* Step 2: Payment & Confirm */}
                                {(() => {
                                    const surchargePct = PAYMENT_OPTIONS[metodoPago]?.surcharge || 0
                                    const recargoAmount = cartTotal * surchargePct
                                    const finalTotal = cartTotal + recargoAmount

                                    return (
                                        <>
                                            <View style={{ width: '100%', backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#E5E7EB' }}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                                    <Text style={{ color: '#6B7280', fontSize: 15, fontFamily: 'System' }}>Subtotal</Text>
                                                    <Text style={{ fontWeight: '600', color: '#111827', fontSize: 16, fontFamily: 'System' }}>${Math.round(cartTotal)}</Text>
                                                </View>

                                                {recargoAmount > 0 && (
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                                        <Text style={{ color: '#C2410C', fontSize: 14, fontFamily: 'System' }}>Recargo ({(surchargePct * 100).toLocaleString()}%)</Text>
                                                        <Text style={{ fontWeight: '600', color: '#C2410C', fontSize: 14, fontFamily: 'System' }}>+${Math.round(recargoAmount)}</Text>
                                                    </View>
                                                )}

                                                <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 }} />

                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', fontFamily: 'System' }}>Total Final</Text>
                                                    <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#16A34A', fontFamily: 'System' }}>${Math.round(finalTotal)}</Text>
                                                </View>

                                                <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8, textAlign: 'right', fontFamily: 'System' }}>
                                                    {saleCart.reduce((acc, item) => acc + item.quantity, 0)} productos
                                                </Text>
                                            </View>

                                            <View style={{ marginBottom: 32 }}>
                                                <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'System' }}>Método de Pago</Text>
                                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                                    {Object.entries(PAYMENT_OPTIONS).map(([key, option]) => (
                                                        <TouchableOpacity
                                                            key={key}
                                                            style={{
                                                                width: '48%', // Approx 2 columns
                                                                flexDirection: 'row',
                                                                alignItems: 'center',
                                                                padding: 10,
                                                                borderRadius: 12,
                                                                borderWidth: 1,
                                                                borderColor: metodoPago === key ? '#2563EB' : '#E5E7EB',
                                                                backgroundColor: metodoPago === key ? '#eff6ff' : 'white',
                                                            }}
                                                            onPress={() => setMetodoPago(key)}
                                                        >
                                                            <Ionicons name={option.icon} size={18} color={metodoPago === key ? '#2563EB' : '#9CA3AF'} style={{ marginRight: 8 }} />
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={{
                                                                    fontSize: 12,
                                                                    fontWeight: metodoPago === key ? '700' : '500',
                                                                    color: metodoPago === key ? '#111827' : '#374151',
                                                                    fontFamily: 'System'
                                                                }}>
                                                                    {option.label}
                                                                </Text>
                                                            </View>
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            </View>

                                            {metodoPago === "fiado" && (
                                                <View style={{ marginBottom: 24 }}>
                                                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'System' }}>Seleccionar Cliente (Requerido)</Text>
                                                    <View style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 4 }}>
                                                        {!clienteId ? (
                                                            <View>
                                                                <TextInput
                                                                    style={{ padding: 12, fontSize: 14 }}
                                                                    placeholder="Buscar cliente por nombre..."
                                                                    onChangeText={(text) => {
                                                                        // Basic local filter for simplicity or we could use the searchClients from useBusinessData
                                                                        // Since we already have clients prop:
                                                                        setSearchTerm(text) // Reusing searchTerm state
                                                                    }}
                                                                />
                                                                <ScrollView style={{ maxHeight: 120 }}>
                                                                    {(clients || [])
                                                                        .filter(c => c.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
                                                                        .map(client => (
                                                                            <TouchableOpacity
                                                                                key={client.id}
                                                                                style={{ padding: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}
                                                                                onPress={() => setClienteId(client.id)}
                                                                            >
                                                                                <Text style={{ fontWeight: '600' }}>{client.nombre}</Text>
                                                                                <Text style={{ fontSize: 12, color: '#6B7280' }}>Deuda: ${client.deuda}</Text>
                                                                            </TouchableOpacity>
                                                                        ))}
                                                                </ScrollView>
                                                            </View>
                                                        ) : (
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 }}>
                                                                <View>
                                                                    <Text style={{ fontWeight: '700', color: '#111827' }}>
                                                                        {(clients || []).find(c => c.id === clienteId)?.nombre || 'Cliente Seleccionado'}
                                                                    </Text>
                                                                    <Text style={{ fontSize: 12, color: '#6B7280' }}>ID: {clienteId}</Text>
                                                                </View>
                                                                <TouchableOpacity onPress={() => setClienteId(null)}>
                                                                    <Text style={{ color: '#2563EB', fontWeight: '600' }}>Cambiar</Text>
                                                                </TouchableOpacity>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                            )}

                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: processing ? '#86EFAC' : '#16A34A',
                                                    padding: 14,
                                                    borderRadius: 12,
                                                    alignItems: 'center',
                                                    flexDirection: 'row',
                                                    justifyContent: 'center',
                                                    opacity: processing ? 0.8 : 1
                                                }}
                                                onPress={handleCompleteSale}
                                                disabled={processing || (metodoPago === "fiado" && !clienteId)}
                                            >
                                                {processing && (
                                                    <View style={{ marginRight: 8 }}>
                                                        <ActivityIndicator size="small" color="#fff" />
                                                    </View>
                                                )}
                                                <Text style={{ color: 'white', fontWeight: '600', fontSize: 16, fontFamily: 'System' }}>
                                                    {processing ? 'Procesando...' : `Cobrar $${Math.round(finalTotal)}`}
                                                </Text>
                                            </TouchableOpacity>
                                        </>
                                    )
                                })()}
                            </>
                        ) : (
                            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                                <View style={{
                                    width: 72, height: 72,
                                    backgroundColor: '#DCFCE7',
                                    borderRadius: 36,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 20
                                }}>
                                    <Ionicons name="checkmark" size={40} color="#16A34A" />
                                </View>

                                <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8, fontFamily: 'System' }}>
                                    ¡Venta Exitosa!
                                </Text>
                                <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, fontFamily: 'System' }}>
                                    La transacción se registró correctamente
                                </Text>

                                <View style={{ width: '100%', backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#E5E7EB' }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <Text style={{ color: '#6B7280', fontSize: 13, fontFamily: 'System' }}>Total cobrado</Text>
                                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', fontFamily: 'System' }}>
                                            ${Math.round(completedSaleData?.total || 0)}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <Text style={{ color: '#6B7280', fontSize: 13, fontFamily: 'System' }}>Método de pago</Text>
                                        <Text style={{ fontWeight: '500', color: '#111827', fontSize: 13, fontFamily: 'System' }}>
                                            {completedSaleData?.methodLabel}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Text style={{ color: '#6B7280', fontSize: 13, fontFamily: 'System' }}>Productos</Text>
                                        <Text style={{ fontWeight: '500', color: '#111827', fontSize: 13, fontFamily: 'System' }}>
                                            {completedSaleData?.itemsCount} items
                                        </Text>
                                    </View>
                                </View>

                                <View style={{ width: '100%', gap: 10 }}>
                                    <TouchableOpacity
                                        style={{ backgroundColor: '#2563EB', padding: 14, borderRadius: 12, alignItems: 'center' }}
                                        onPress={startNewSale}
                                    >
                                        <Text style={{ color: 'white', fontWeight: '600', fontSize: 15, fontFamily: 'System' }}>Nueva Venta</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={{ backgroundColor: 'white', padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' }}
                                        onPress={handleClose}
                                    >
                                        <Text style={{ color: '#374151', fontWeight: '600', fontSize: 15, fontFamily: 'System' }}>Cerrar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </View >
            </View >
        </Modal >
    )
}
