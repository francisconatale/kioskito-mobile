import { Modal, View, Text, TouchableOpacity, ActivityIndicator } from "react-native"

export const ConfirmDialog = ({ visible, title, message, onConfirm, onCancel, loading }) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={loading ? null : onCancel}
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
                                alignItems: 'center',
                                opacity: loading ? 0.5 : 1
                            }}
                            onPress={onCancel}
                            disabled={loading}
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
                                backgroundColor: loading ? '#fca5a5' : '#ef4444',
                                padding: 12,
                                borderRadius: 8,
                                alignItems: 'center',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                opacity: loading ? 0.8 : 1
                            }}
                            onPress={onConfirm}
                            disabled={loading}
                        >
                            {loading && (
                                <View style={{ marginRight: 8 }}>
                                    <ActivityIndicator size="small" color="#fff" />
                                </View>
                            )}
                            <Text style={{
                                color: 'white',
                                fontWeight: '600',
                                fontSize: 16
                            }}>
                                {loading ? 'Eliminando...' : 'Eliminar'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    )
}
