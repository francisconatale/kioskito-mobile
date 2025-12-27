import { useState } from "react"
import { View, Text, TouchableOpacity, TextInput, Modal, Alert } from "react-native"
import { Ionicons } from '@expo/vector-icons'

export const BarcodeScanner = ({ visible, onClose, mode, onScan }) => {
    const [barcodeInput, setBarcodeInput] = useState("")

    const handleConfirm = () => {
        if (barcodeInput.trim()) {
            onScan(barcodeInput.trim())
            setBarcodeInput("")
            onClose()
        } else {
            Alert.alert("Error", "Ingresa un código de barras")
        }
    }

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>
                            {mode === "product" ? "Escanear código" : "Escanear producto"}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <View style={{ backgroundColor: '#faf5ff', borderWidth: 2, borderColor: '#e9d5ff', borderStyle: 'dashed', borderRadius: 12, padding: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                        <Ionicons name="scan-outline" size={64} color="#9333ea" />
                        <Text style={{ color: '#9333ea', fontWeight: '600', marginTop: 16 }}>Posiciona el código de barras</Text>
                        <Text style={{ color: '#c084fc', fontSize: 14, marginTop: 8, textAlign: 'center' }}>
                            {mode === "product" ? "El código se agregará al producto" : "El producto se agregará al carrito"}
                        </Text>
                    </View>

                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>O ingresa manualmente</Text>
                        <TextInput
                            style={{ backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, color: '#111827' }}
                            placeholder="7501234567890"
                            keyboardType="numeric"
                            value={barcodeInput}
                            onChangeText={setBarcodeInput}
                        />
                    </View>

                    <TouchableOpacity
                        style={{ backgroundColor: '#9333ea', padding: 16, borderRadius: 8, alignItems: 'center' }}
                        onPress={handleConfirm}
                    >
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Confirmar código</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    )
}
