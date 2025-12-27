import { useState } from "react"
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal } from "react-native"
import { Ionicons } from '@expo/vector-icons'

export const ProductModal = ({ visible, onClose, onAddProduct }) => {
    const [newProduct, setNewProduct] = useState({ nombre: "", precio: "", stock: "", descripcion: "" })

    const handleSave = async () => {
        const success = await onAddProduct(newProduct)
        if (success) {
            setNewProduct({ nombre: "", precio: "", stock: "", descripcion: "" })
            onClose()
        }
    }

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>Nuevo Producto</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

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
