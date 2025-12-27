import { Modal, View, Text, TouchableOpacity } from "react-native"

export const ConfirmDialog = ({ visible, title, message, onConfirm, onCancel }) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={{
                flex: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 16
            }}>
                <View style={{
                    backgroundColor: 'white',
                    borderRadius: 12,
                    padding: 24,
                    width: '100%',
                    maxWidth: 400,
                    shadowColor: '#000',
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 5
                }}>
                    <Text style={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: '#111827',
                        marginBottom: 12
                    }}>
                        {title}
                    </Text>
                    <Text style={{
                        fontSize: 16,
                        color: '#6b7280',
                        marginBottom: 24
                    }}>
                        {message}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity
                            style={{
                                flex: 1,
                                backgroundColor: '#f3f4f6',
                                padding: 12,
                                borderRadius: 8,
                                alignItems: 'center'
                            }}
                            onPress={onCancel}
                        >
                            <Text style={{
                                color: '#374151',
                                fontWeight: '600',
                                fontSize: 16
                            }}>
                                Cancelar
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                flex: 1,
                                backgroundColor: '#ef4444',
                                padding: 12,
                                borderRadius: 8,
                                alignItems: 'center'
                            }}
                            onPress={onConfirm}
                        >
                            <Text style={{
                                color: 'white',
                                fontWeight: '600',
                                fontSize: 16
                            }}>
                                Eliminar
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    )
}
