import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator } from "react-native"
import { Ionicons } from '@expo/vector-icons'
import { productosAPI } from '../services/api'

export const ProductModal = ({ visible, onClose, onAddProduct, onUpdateProduct, onShowBarcodeScanner, initialProduct }) => {
    const [newProduct, setNewProduct] = useState({ nombre: "", precio: "", descripcion: "", codigoBarras: "", marca: "" })
    const [error, setError] = useState("")
    const [loadingBarcode, setLoadingBarcode] = useState(false)
    const [barcodeInfo, setBarcodeInfo] = useState("")

    useEffect(() => {
        if (initialProduct) {
            setNewProduct({
                nombre: initialProduct.nombre || "",
                precio: initialProduct.precio?.toString() || "",
                descripcion: initialProduct.descripcion || "",
                codigoBarras: initialProduct.codigoBarras || "",
                marca: initialProduct.marca || "",
                id: initialProduct.id
            })
        } else {
            setNewProduct({ nombre: "", precio: "", descripcion: "", codigoBarras: "", marca: "" })
        }
    }, [initialProduct, visible])

    // Debounced barcode lookup
    useEffect(() => {
        const lookupBarcode = async () => {
            const barcode = newProduct.codigoBarras?.trim()

            // Only lookup if it's a new product (no id) and barcode has at least 8 digits
            if (initialProduct?.id || !barcode || barcode.length < 8) {
                setBarcodeInfo("")
                return
            }

            setLoadingBarcode(true)
            setBarcodeInfo("")

            try {
                // Try local database first
                try {
                    const localProduct = await productosAPI.getByBarcode(barcode)
                    if (localProduct) {
                        setBarcodeInfo("✓ Producto encontrado en base de datos local")
                        // Don't auto-fill from local DB to avoid conflicts
                        setLoadingBarcode(false)
                        return
                    }
                } catch (err) {
                    // Local product not found, continue to OpenFoodFacts
                }

                // Try OpenFoodFacts API
                const foodData = await productosAPI.lookupBarcode(barcode)
                if (foodData && foodData.name) {
                    // Auto-fill fields from OpenFoodFacts
                    setNewProduct(prev => ({
                        ...prev,
                        nombre: prev.nombre || foodData.name,
                        marca: prev.marca || foodData.brand || "",
                        descripcion: prev.descripcion || foodData.description || "",
                    }))
                    setBarcodeInfo(`✓ Datos cargados: ${foodData.brand || foodData.name}`)
                } else {
                    setBarcodeInfo("⚠ Código de barras no encontrado")
                }
            } catch (err) {
                console.error("Error al buscar código de barras:", err)
                setBarcodeInfo("⚠ No se pudo buscar el código de barras")
            } finally {
                setLoadingBarcode(false)
            }
        }

        // Debounce the lookup by 800ms
        const timeoutId = setTimeout(lookupBarcode, 800)
        return () => clearTimeout(timeoutId)
    }, [newProduct.codigoBarras])

    const handleSave = async () => {
        setError("")
        let result
        if (newProduct.id) {
            result = await onUpdateProduct(newProduct.id, newProduct)
        } else {
            result = await onAddProduct(newProduct)
        }

        if (result.success) {
            setNewProduct({ nombre: "", precio: "", descripcion: "", codigoBarras: "", marca: "" })
            onClose()
        } else {
            setError(result.message)
        }
    }

    const handleClose = () => {
        setError("")
        setBarcodeInfo("")
        setLoadingBarcode(false)
        setNewProduct({ nombre: "", precio: "", descripcion: "", codigoBarras: "", marca: "" })
        onClose()
    }

    return (
        <Modal visible={visible} animationType="fade" transparent={true}>
            <View style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20
            }}>
                <View style={{
                    backgroundColor: 'white',
                    borderRadius: 20,
                    padding: 24,
                    width: '100%',
                    maxWidth: 500,
                    maxHeight: '90%',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', fontFamily: 'System' }}>
                            {initialProduct?.id ? 'Editar Producto' : 'Nuevo Producto'}
                        </Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={22} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    {error && (
                        <View style={{
                            backgroundColor: '#FEE2E2',
                            padding: 12,
                            borderRadius: 10,
                            marginBottom: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: '#FECACA'
                        }}>
                            <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 8 }} />
                            <Text style={{ color: '#991B1B', flex: 1, fontSize: 13, fontFamily: 'System' }}>
                                {error}
                            </Text>
                        </View>
                    )}

                    {loadingBarcode && (
                        <View style={{
                            backgroundColor: '#DBEAFE',
                            padding: 12,
                            borderRadius: 10,
                            marginBottom: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: '#BFDBFE'
                        }}>
                            <ActivityIndicator size="small" color="#2563EB" style={{ marginRight: 8 }} />
                            <Text style={{ color: '#1E40AF', flex: 1, fontSize: 13, fontFamily: 'System' }}>
                                Buscando producto...
                            </Text>
                        </View>
                    )}

                    {!loadingBarcode && barcodeInfo && barcodeInfo.includes("no encontrado") && (
                        <View style={{
                            backgroundColor: '#FEF3C7',
                            padding: 12,
                            borderRadius: 10,
                            marginBottom: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: '#FDE68A'
                        }}>
                            <Ionicons name="alert-outline" size={18} color="#D97706" style={{ marginRight: 8 }} />
                            <Text style={{ color: '#92400E', flex: 1, fontSize: 13, fontFamily: 'System' }}>
                                Producto no encontrado, debe ingresarlo a mano
                            </Text>
                        </View>
                    )}

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, fontFamily: 'System' }}>Nombre del producto *</Text>
                            <TextInput
                                style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 10, color: '#111827', fontSize: 14, fontFamily: 'System' }}
                                value={newProduct.nombre}
                                onChangeText={(text) => setNewProduct({ ...newProduct, nombre: text })}
                            />
                        </View>

                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, fontFamily: 'System' }}>Marca</Text>
                            <TextInput
                                style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 10, color: '#111827', fontSize: 14, fontFamily: 'System' }}
                                value={newProduct.marca}
                                onChangeText={(text) => setNewProduct({ ...newProduct, marca: text })}
                            />
                        </View>

                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, fontFamily: 'System' }}>Descripción</Text>
                            <TextInput
                                style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 10, color: '#111827', fontSize: 14, fontFamily: 'System' }}
                                value={newProduct.descripcion}
                                onChangeText={(text) => setNewProduct({ ...newProduct, descripcion: text })}
                                multiline
                                numberOfLines={2}
                            />
                        </View>

                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, fontFamily: 'System' }}>Código de barras</Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <View style={{ flex: 1 }}>
                                    <TextInput
                                        style={{
                                            backgroundColor: initialProduct?.id ? '#F3F4F6' : '#F9FAFB',
                                            borderWidth: 1,
                                            borderColor: '#E5E7EB',
                                            borderRadius: 10,
                                            padding: 10,
                                            color: initialProduct?.id ? '#9CA3AF' : '#111827',
                                            fontSize: 14,
                                            fontFamily: 'System'
                                        }}
                                        placeholder="Escanear o ingresar"
                                        value={newProduct.codigoBarras}
                                        onChangeText={(text) => setNewProduct({ ...newProduct, codigoBarras: text })}
                                        keyboardType="numeric"
                                        editable={!initialProduct?.id}
                                    />
                                </View>
                                {!initialProduct?.id && (
                                    <TouchableOpacity
                                        style={{ backgroundColor: '#F3F4F6', padding: 10, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' }}
                                        onPress={() => onShowBarcodeScanner('product', (code) => setNewProduct({ ...newProduct, codigoBarras: code }))}
                                    >
                                        <Ionicons name="barcode-outline" size={20} color="#2563EB" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, fontFamily: 'System' }}>Precio *</Text>
                            <TextInput
                                style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 10, color: '#111827', fontSize: 14, fontFamily: 'System' }}
                                keyboardType="numeric"
                                value={newProduct.precio}
                                onChangeText={(text) => setNewProduct({ ...newProduct, precio: text })}
                            />
                        </View>


                        <TouchableOpacity style={{ backgroundColor: '#2563EB', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 16 }} onPress={handleSave}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="save-outline" size={18} color="#fff" />
                                <Text style={{ color: 'white', fontWeight: '600', marginLeft: 8, fontSize: 15, fontFamily: 'System' }}>
                                    {initialProduct ? 'Actualizar Producto' : 'Guardar Producto'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    )
}

const styles = {
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 500,
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    }
}
