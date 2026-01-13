import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Dimensions } from "react-native"
import { Ionicons } from '@expo/vector-icons'
import { productosAPI } from '../services/factory'
import { SuccessScreen } from './SuccessScreen'

const { height } = Dimensions.get('window')

export const ProductModal = ({ visible, onClose, onAddProduct, onUpdateProduct, onShowBarcodeScanner, initialProduct }) => {
    const [newProduct, setNewProduct] = useState({ nombre: "", precio: "", descripcion: "", codigoBarras: "", marca: "", stock: 0 })
    const [error, setError] = useState("")
    const [successMessage, setSuccessMessage] = useState("")
    const [loadingBarcode, setLoadingBarcode] = useState(false)
    const [barcodeInfo, setBarcodeInfo] = useState("")

    const [saving, setSaving] = useState(false)

    // New state for 2-step flow
    const [step, setStep] = useState('form') // 'form' | 'stock'
    const [savedProduct, setSavedProduct] = useState(null)

    useEffect(() => {
        if (initialProduct) {
            setNewProduct({
                nombre: initialProduct.nombre || "",
                precio: initialProduct.precio?.toString() || "",
                descripcion: initialProduct.descripcion || "",
                codigoBarras: initialProduct.codigoBarras || "",
                marca: initialProduct.marca || "",
                stock: initialProduct.stock || 0,
                id: initialProduct.id
            })
            setStep('form')
        } else {
            // Reset for new product
            if (visible && step === 'form') {
                setNewProduct({ nombre: "", precio: "", descripcion: "", codigoBarras: "", marca: "", stock: 0 })
            }
        }
        setError("")
        setSuccessMessage("")
    }, [initialProduct, visible])

    const handleSave = async () => {
        setError("")
        setSuccessMessage("")
        setSaving(true)
        let result
        try {
            if (newProduct.id) {
                result = await onUpdateProduct(newProduct.id, newProduct)
                if (result.success) onClose()
                else setError(result.message)
            } else {
                result = await onAddProduct(newProduct, false)
                if (result.success) {
                    setSavedProduct(result.product)
                    setStep('success')
                } else {
                    setError(result.message)
                }
            }
        } catch (err) {
            setError("Ocurrió un error inesperado.")
        } finally {
            setSaving(false)
        }
    }

    const handleUpdateStock = async () => {
        setError("") // Clear previous errors
        setSaving(true)
        try {
            const stockToSet = parseInt(newProduct.stock) || 0
            const productUpdate = { ...savedProduct, stock: stockToSet }

            // We reuse onUpdateProduct
            const result = await onUpdateProduct(savedProduct.id, productUpdate)

            if (result.success) {
                // Fully done
                handleClose()
            } else {
                setError(result.message)
            }
        } catch (err) {
            setError("Error al actualizar stock: " + err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleClose = () => {
        setError("")
        setSuccessMessage("")
        setBarcodeInfo("")
        setLoadingBarcode(false)
        setSaving(false)
        setStep('form')
        setSavedProduct(null)
        setNewProduct({ nombre: "", precio: "", descripcion: "", codigoBarras: "", marca: "", stock: 0 })
        onClose()
    }

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20
            }}>
                <View style={{
                    backgroundColor: 'white',
                    borderRadius: 24,
                    padding: 24,
                    width: '100%',
                    maxWidth: 500,
                    maxHeight: '90%',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.1,
                    shadowRadius: 20,
                    elevation: 10
                }}>

                    {/* Header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', fontFamily: 'System' }}>
                            {step === 'success' ? '¡Producto Creado!' : step === 'stock' ? 'Ingresar Stock' : (initialProduct?.id ? 'Editar Producto' : 'Nuevo Producto')}
                        </Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={22} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    {/* Common Messages */}
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

                    {step === 'success' ? (
                        <SuccessScreen
                            title={`¡${savedProduct?.nombre} agregado!`}
                            message="El producto se ha registrado correctamente en el sistema."
                            primaryButtonText="Ingresar Stock Inicial"
                            onPrimaryAction={() => setStep('stock')}
                            secondaryButtonText="Cerrar"
                            onSecondaryAction={handleClose}
                        />
                    ) : step === 'stock' ? (
                        <View>
                            <Text style={{ fontSize: 15, color: '#374151', marginBottom: 20, textAlign: 'center', lineHeight: 22 }}>
                                Ingresa la cantidad de unidades disponibles actualmente para <Text style={{ fontWeight: '700' }}>{savedProduct?.nombre}</Text>.
                            </Text>

                            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 32 }}>
                                <View style={{ alignItems: 'center' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderColor: '#2563EB', paddingBottom: 8 }}>
                                        <TextInput
                                            style={{
                                                fontSize: 40,
                                                fontWeight: 'bold',
                                                color: '#111827',
                                                textAlign: 'center',
                                                minWidth: 80
                                            }}
                                            keyboardType="numeric"
                                            value={newProduct.stock ? newProduct.stock.toString() : ""}
                                            onChangeText={(text) => setNewProduct({ ...newProduct, stock: text })}
                                            autoFocus={true}
                                            placeholder="0"
                                            placeholderTextColor="#E5E7EB"
                                        />
                                    </View>
                                    <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 12 }}>Unidades</Text>
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity
                                    style={{
                                        flex: 1,
                                        backgroundColor: 'white',
                                        borderWidth: 1,
                                        borderColor: '#E5E7EB',
                                        padding: 14,
                                        borderRadius: 12,
                                        alignItems: 'center'
                                    }}
                                    onPress={handleClose}
                                >
                                    <Text style={{ color: '#4B5563', fontWeight: '600', fontSize: 15 }}>Omitir</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{
                                        flex: 2,
                                        backgroundColor: '#2563EB',
                                        padding: 14,
                                        borderRadius: 12,
                                        alignItems: 'center'
                                    }}
                                    onPress={handleUpdateStock}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={{ color: 'white', fontWeight: '600', fontSize: 15 }}>Guardar Stock</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {successMessage && (
                                <View style={{
                                    backgroundColor: '#DCFCE7',
                                    padding: 12,
                                    borderRadius: 10,
                                    marginBottom: 16,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: '#86EFAC'
                                }}>
                                    <Ionicons name="checkmark-circle" size={18} color="#16A34A" style={{ marginRight: 8 }} />
                                    <Text style={{ color: '#166534', flex: 1, fontSize: 13, fontFamily: 'System' }}>
                                        {successMessage}
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


                            <TouchableOpacity
                                style={{
                                    backgroundColor: saving ? '#93C5FD' : '#2563EB',
                                    padding: 14,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    marginBottom: 16
                                }}
                                onPress={handleSave}
                                disabled={saving}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    {saving ? (
                                        <>
                                            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                                            <Text style={{ color: 'white', fontWeight: '600', fontSize: 15, fontFamily: 'System' }}>
                                                Guardando...
                                            </Text>
                                        </>
                                    ) : (
                                        <>
                                            <Ionicons name="save-outline" size={18} color="#fff" />
                                            <Text style={{ color: 'white', fontWeight: '600', marginLeft: 8, fontSize: 15, fontFamily: 'System' }}>
                                                {initialProduct ? 'Actualizar Producto' : 'Guardar Producto'}
                                            </Text>
                                        </>
                                    )}
                                </View>
                            </TouchableOpacity>
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal >
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
