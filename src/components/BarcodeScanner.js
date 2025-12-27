import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, TextInput, Modal, Alert, StyleSheet } from "react-native"
import { Ionicons } from '@expo/vector-icons'
import { CameraView, useCameraPermissions } from 'expo-camera'

export const BarcodeScanner = ({ visible, onClose, mode, onScan }) => {
    const [barcodeInput, setBarcodeInput] = useState("")
    const [scanned, setScanned] = useState(false)
    const [permission, requestPermission] = useCameraPermissions()

    useEffect(() => {
        if (visible && (!permission || !permission.granted)) {
            requestPermission()
        }
    }, [visible, permission])

    useEffect(() => {
        if (visible) {
            setScanned(false)
            setBarcodeInput("")
        }
    }, [visible])

    const handleBarcodeScanned = ({ data }) => {
        if (scanned) return
        setScanned(true)
        onScan(data)
        onClose()
    }

    const handleManualConfirm = () => {
        if (barcodeInput.trim()) {
            onScan(barcodeInput.trim())
            setBarcodeInput("")
            onClose()
        } else {
            Alert.alert("Error", "Ingresa un código de barras")
        }
    }

    if (!permission) {
        return <View />
    }

    if (!permission.granted) {
        return (
            <Modal visible={visible} animationType="slide" transparent={true}>
                <View style={styles.container}>
                    <View style={styles.modalContent}>
                        <Ionicons name="camera-reverse-outline" size={48} color="#ef4444" />
                        <Text style={styles.title}>Permiso de cámara</Text>
                        <Text style={styles.message}>Necesitamos acceso a la cámara para escanear códigos de barras.</Text>
                        <TouchableOpacity style={styles.button} onPress={requestPermission}>
                            <Text style={styles.buttonText}>Habilitar Cámara</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                            <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        )
    }

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.container}>
                <View style={[styles.modalContent, { padding: 0, overflow: 'hidden', height: '80%' }]}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>
                            {mode === "product" ? "Escanear código" : "Escanear producto"}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.cameraWrapper}>
                        <CameraView
                            style={StyleSheet.absoluteFill}
                            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                            barcodeScannerSettings={{
                                barcodeTypes: ["qr", "ean13", "ean8", "code128", "upc_a", "upc_e"],
                            }}
                        >
                            <View style={styles.overlay}>
                                <View style={styles.scannerLayout}>
                                    <View style={styles.scanTarget} />
                                </View>
                            </View>
                        </CameraView>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Encuentra el código de barras</Text>
                        <View style={styles.manualInputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Ingresar manualmente"
                                keyboardType="numeric"
                                value={barcodeInput}
                                onChangeText={setBarcodeInput}
                            />
                            <TouchableOpacity style={styles.confirmBtn} onPress={handleManualConfirm}>
                                <Ionicons name="checkmark" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center'
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 16,
        color: '#111827'
    },
    message: {
        textAlign: 'center',
        marginTop: 8,
        color: '#6b7280',
        marginBottom: 24
    },
    button: {
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        marginBottom: 8
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16
    },
    cancelButton: {
        backgroundColor: '#f3f4f6'
    },
    cancelButtonText: {
        color: '#374151'
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827'
    },
    cameraWrapper: {
        flex: 1,
        width: '100%',
        backgroundColor: 'black'
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    scannerLayout: {
        width: 250,
        height: 150,
        borderWidth: 2,
        borderColor: '#3b82f6',
        borderRadius: 16,
        backgroundColor: 'transparent'
    },
    scanTarget: {
        flex: 1,
        margin: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        borderRadius: 8
    },
    footer: {
        width: '100%',
        padding: 20,
        backgroundColor: 'white'
    },
    footerText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 12
    },
    manualInputWrapper: {
        flexDirection: 'row',
        gap: 8
    },
    input: {
        flex: 1,
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 12,
        color: '#111827'
    },
    confirmBtn: {
        backgroundColor: '#3b82f6',
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center'
    }
})
