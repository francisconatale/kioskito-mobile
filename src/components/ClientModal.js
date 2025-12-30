import React, { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator, ScrollView } from "react-native"
import { Ionicons } from '@expo/vector-icons'

export const ClientModal = ({ visible, onClose, onAddClient, onUpdateClient, initialClient }) => {
    const [client, setClient] = useState({
        nombre: "",
        telefono: "",
        email: ""
    })
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        if (initialClient) {
            setClient({
                nombre: initialClient.nombre || "",
                telefono: initialClient.telefono || "",
                email: initialClient.email || ""
            })
        } else {
            setClient({
                nombre: "",
                telefono: "",
                email: ""
            })
        }
    }, [initialClient, visible])

    const handleSave = async () => {
        if (!client.nombre.trim()) return

        setProcessing(true)
        try {
            let result
            if (initialClient?.id) {
                result = await onUpdateClient(initialClient.id, client)
            } else {
                result = await onAddClient(client)
            }

            if (result.success) {
                onClose()
            }
        } finally {
            setProcessing(false)
        }
    }

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 450, maxHeight: '80%', borderWidth: 1, borderColor: '#E5E7EB' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', fontFamily: 'System' }}>
                            {initialClient?.id ? 'Editar Cliente' : 'Nuevo Cliente'}
                        </Text>
                        <TouchableOpacity onPress={onClose} disabled={processing}>
                            <Ionicons name="close" size={22} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={{ marginBottom: 20 }}>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, fontFamily: 'System' }}>Nombre Completo *</Text>
                            <TextInput
                                style={{ backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827', fontFamily: 'System' }}
                                placeholder="Ej: Juan Perez"
                                value={client.nombre}
                                onChangeText={(text) => setClient({ ...client, nombre: text })}
                            />
                        </View>

                        <View style={{ marginBottom: 20 }}>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, fontFamily: 'System' }}>Teléfono / WhatsApp</Text>
                            <TextInput
                                style={{ backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827', fontFamily: 'System' }}
                                placeholder="Ej: 1123456789"
                                keyboardType="phone-pad"
                                value={client.telefono}
                                onChangeText={(text) => setClient({ ...client, telefono: text })}
                            />
                        </View>

                        <View style={{ marginBottom: 32 }}>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, fontFamily: 'System' }}>Email (Opcional)</Text>
                            <TextInput
                                style={{ backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827', fontFamily: 'System' }}
                                placeholder="Ej: juan@email.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={client.email}
                                onChangeText={(text) => setClient({ ...client, email: text })}
                            />
                        </View>

                        <TouchableOpacity
                            style={{
                                backgroundColor: client.nombre.trim() ? '#2563EB' : '#93C5FD',
                                padding: 16,
                                borderRadius: 12,
                                alignItems: 'center',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                gap: 8
                            }}
                            onPress={handleSave}
                            disabled={!client.nombre.trim() || processing}
                        >
                            {processing ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <>
                                    <Ionicons name="save-outline" size={20} color="white" />
                                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 16, fontFamily: 'System' }}>
                                        {initialClient?.id ? 'Guardar Cambios' : 'Registrar Cliente'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ padding: 16, marginTop: 8, alignItems: 'center' }}
                            onPress={onClose}
                            disabled={processing}
                        >
                            <Text style={{ color: '#6B7280', fontWeight: '500', fontFamily: 'System' }}>Cancelar</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    )
}
