import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator } from "react-native"
import { Ionicons } from '@expo/vector-icons'
import { productosAPI } from '../services/api'

export const ProductModal = ({ visible, onClose, onAddProduct, onShowBarcodeScanner }) => {
    const [newProduct, setNewProduct] = useState({ nombre: "", precio: "", stock: "", descripcion: "", codigoBarras: "" })
    const [error, setError] = useState("")
    const [loadingBarcode, setLoadingBarcode] = useState(false)
    const [barcodeInfo, setBarcodeInfo] = useState("")

    // Debounced barcode lookup
    useEffect(() => {
        const lookupBarcode = async () => {
            const barcode = newProduct.codigoBarras?.trim()

            // Only lookup if barcode has at least 8 digits
            if (!barcode || barcode.length < 8) {
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
                        descripcion: prev.descripcion || [
                            foodData.brand,
                            foodData.description,
                            foodData.category
                        ].filter(Boolean).join(' - '),
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
        setError("") // Clear previous errors
        const result = await onAddProduct(newProduct)
        if (result.success) {
            setNewProduct({ nombre: "", precio: "", stock: "", descripcion: "", codigoBarras: "" })
            onClose()
        } else {
            setError(result.message)
        }
    }

    const handleClose = () => {
        setError("")
        setBarcodeInfo("")
        setLoadingBarcode(false)
        setNewProduct({ nombre: "", precio: "", stock: "", descripcion: "", codigoBarras: "" })
        onClose()
    }

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>Nuevo Producto</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    {error && (
                        <View style={{
                            backgroundColor: '#fee2e2',
                            borderLeftWidth: 4,
                            borderLeftColor: '#ef4444',
                            padding: 12,
                            borderRadius: 8,
                            marginBottom: 16,
                            flexDirection: 'row',
                            alignItems: 'center'
                        }}>
                            <Ionicons name="alert-circle" size={20} color="#ef4444" style={{ marginRight: 8 }} />
                            <Text style={{ color: '#991b1b', flex: 1, fontSize: 14 }}>
                                {error}
                            </Text>
                        </View>
                    )}

                    <ScrollView>
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Nombre del producto *</Text>
                            <TextInput
                                style={{ backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, color: '#111827' }}
                                placeholder="Ej: Coca Cola"
                                value={newProduct.nombre}
                                onChangeText={(text) => setNewProduct({ ...newProduct, nombre: text })}
                            />
                        </View>

                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Descripción</Text>
                            <TextInput
                                style={{ backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, color: '#111827' }}
                                placeholder="Ej: Bebida 500ml"
                                value={newProduct.descripcion}
                                onChangeText={(text) => setNewProduct({ ...newProduct, descripcion: text })}
                                multiline
                                numberOfLines={2}
                            />
                        </View>

                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Código de barras</Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <View style={{ flex: 1 }}>
                                    <TextInput
                                        style={{ backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, color: '#111827' }}
                                        placeholder="Escanea o ingresa manualmente"
                                        value={newProduct.codigoBarras}
                                        onChangeText={(text) => setNewProduct({ ...newProduct, codigoBarras: text })}
                                        keyboardType="numeric"
                                    />
                                    {loadingBarcode && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                                            <ActivityIndicator size="small" color="#3b82f6" />
                                            <Text style={{ fontSize: 12, color: '#6b7280', marginLeft: 6 }}>Buscando...</Text>
                                        </View>
                                    )}
                                    {!loadingBarcode && barcodeInfo && (
                                        <Text style={{
                                            fontSize: 12,
                                            color: barcodeInfo.startsWith('✓') ? '#10b981' : '#f59e0b',
                                            marginTop: 6
                                        }}>
                                            {barcodeInfo}
                                        </Text>
                                    )}
                                </View>
                                <TouchableOpacity
                                    style={{ backgroundColor: '#3b82f6', padding: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center', minWidth: 50 }}
                                    onPress={() => onShowBarcodeScanner('product', (code) => setNewProduct({ ...newProduct, codigoBarras: code }))}
                                >
                                    <Ionicons name="barcode-outline" size={24} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Precio *</Text>
                            <TextInput
                                style={{ backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, color: '#111827' }}
                                placeholder="0.00"
                                keyboardType="numeric"
                                value={newProduct.precio}
                                onChangeText={(text) => setNewProduct({ ...newProduct, precio: text })}
                            />
                        </View>

                        <View style={{ marginBottom: 24 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Stock inicial *</Text>
                            <TextInput
                                style={{ backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, color: '#111827' }}
                                placeholder="0"
                                keyboardType="numeric"
                                value={newProduct.stock}
                                onChangeText={(text) => setNewProduct({ ...newProduct, stock: text })}
                            />
                        </View>

                        <TouchableOpacity style={{ backgroundColor: '#3b82f6', padding: 16, borderRadius: 8, alignItems: 'center' }} onPress={handleSave}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="save-outline" size={20} color="#fff" />
                                <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 8 }}>Guardar Producto</Text>
                            </View>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    )
}
