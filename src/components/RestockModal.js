import { useState } from "react"
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator } from "react-native"
import { Ionicons, Feather } from '@expo/vector-icons'

export const RestockModal = ({
    visible,
    onClose,
    products,
    restockCart,
    onAddToCart,
    onRemoveFromCart,
    onUpdateCartQuantity,
    onCompleteRestock,
    onClearCart,
    onShowBarcodeScanner
}) => {
    const [newItem, setNewItem] = useState({ productId: "", quantity: "1" })
    const [processing, setProcessing] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [completed, setCompleted] = useState(false)

    const filteredProducts = products.filter(product =>
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleAddToCart = () => {
        const success = onAddToCart(newItem.productId, newItem.quantity)
        if (success) {
            setNewItem({ productId: "", quantity: "1" })
        }
    }

    const handleCompleteRestock = async () => {
        setProcessing(true)
        try {
            const result = await onCompleteRestock()
            if (result && result.success) {
                setCompleted(true)
            }
        } finally {
            setProcessing(false)
        }
    }

    const handleClose = () => {
        onClearCart()
        setNewItem({ productId: "", quantity: "1" })
        setCompleted(false)
        onClose()
    }

    const startNewRestock = () => {
        onClearCart()
        setNewItem({ productId: "", quantity: "1" })
        setCompleted(false)
    }

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 500, maxHeight: '90%', borderWidth: 1, borderColor: '#E5E7EB' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', fontFamily: 'System' }}>
                            {completed ? 'Restock Completado' : 'Registrar Restock'}
                        </Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={22} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView>
                        {!completed ? (
                            <>
                                <View style={{ marginBottom: 16 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', fontFamily: 'System' }}>Producto a restockear</Text>
                                        <TouchableOpacity
                                            onPress={() => onShowBarcodeScanner('restock')}
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
                                                    backgroundColor: newItem.productId === product.id ? '#f3f4f6' : 'transparent'
                                                }}
                                                onPress={() => setNewItem({ ...newItem, productId: product.id, quantity: "1" })}
                                            >
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontWeight: '600', color: '#111827', fontSize: 14, fontFamily: 'System' }}>{product.nombre}</Text>
                                                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2, fontFamily: 'System' }}>
                                                        Stock actual: {product.stock} un.
                                                    </Text>
                                                </View>
                                                {newItem.productId === product.id && (
                                                    <Ionicons name="checkmark" size={18} color="#2563EB" />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                {newItem.productId ? (
                                    <View style={{ marginBottom: 24, marginTop: -8, backgroundColor: '#F9FAFB', padding: 12, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', borderTopWidth: 0 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' }}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        const current = parseInt(newItem.quantity) || 1
                                                        if (current > 1) setNewItem({ ...newItem, quantity: (current - 1).toString() })
                                                    }}
                                                    style={{ padding: 8 }}
                                                >
                                                    <Ionicons name="remove" size={18} color="#374151" />
                                                </TouchableOpacity>
                                                <Text style={{ marginHorizontal: 12, fontSize: 15, fontWeight: '600', color: '#111827', minWidth: 20, textAlign: 'center', fontFamily: 'System' }}>
                                                    {newItem.quantity}
                                                </Text>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        const current = parseInt(newItem.quantity) || 0
                                                        setNewItem({ ...newItem, quantity: (current + 1).toString() })
                                                    }}
                                                    style={{ padding: 8 }}
                                                >
                                                    <Ionicons name="add" size={18} color="#374151" />
                                                </TouchableOpacity>
                                            </View>

                                            <TouchableOpacity
                                                style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                                                onPress={handleAddToCart}
                                            >
                                                <Text style={{ color: '#2563EB', fontWeight: '600', fontSize: 14, fontFamily: 'System' }}>Agregar carga</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : null}

                                {restockCart.length > 0 ? (
                                    <View style={{ marginBottom: 24, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 20 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 12, fontFamily: 'System' }}>Items a ingresar</Text>
                                        <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' }}>
                                            {restockCart.map((item) => (
                                                <View key={item.productId} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={{ fontWeight: '600', color: '#111827', fontSize: 14, fontFamily: 'System' }}>{item.productName}</Text>
                                                        <Text style={{ fontSize: 12, color: '#6B7280', fontFamily: 'System' }}>+{item.quantity} unidades</Text>
                                                    </View>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                        <TouchableOpacity onPress={() => onRemoveFromCart(item.productId)}>
                                                            <Ionicons name="trash-outline" size={18} color="#9CA3AF" />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                ) : null}

                                {restockCart.length > 0 && (
                                    <TouchableOpacity
                                        style={{ backgroundColor: '#2563EB', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8, flexDirection: 'row', justifyContent: 'center' }}
                                        onPress={handleCompleteRestock}
                                        disabled={processing}
                                    >
                                        {processing && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />}
                                        <Text style={{ color: 'white', fontWeight: '600', fontSize: 16, fontFamily: 'System' }}>
                                            Confirmar Ingreso
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        ) : (
                            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                                <View style={{ width: 72, height: 72, backgroundColor: '#DCFCE7', borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                    <Ionicons name="checkmark" size={40} color="#16A34A" />
                                </View>
                                <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8, fontFamily: 'System' }}>¡Restock Exitoso!</Text>
                                <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, textAlign: 'center', fontFamily: 'System' }}>
                                    El stock de los productos ha sido actualizado correctamente.
                                </Text>
                                <View style={{ width: '100%', gap: 10 }}>
                                    <TouchableOpacity
                                        style={{ backgroundColor: '#2563EB', padding: 14, borderRadius: 12, alignItems: 'center' }}
                                        onPress={startNewRestock}
                                    >
                                        <Text style={{ color: 'white', fontWeight: '600', fontSize: 15, fontFamily: 'System' }}>Nuevo Restock</Text>
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
                </View>
            </View>
        </Modal>
    )
}
