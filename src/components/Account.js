import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest, authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmDialog } from './ConfirmDialog';
import { SuccessScreen } from './SuccessScreen';

export const Account = ({ onLogout, onBack }) => {
    const { user, loading, setUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [nombre, setNombre] = useState(user?.nombre || '');
    const [email, setEmail] = useState(user?.email || '');
    const [saveLoading, setSaveLoading] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const [subscription, setSubscription] = useState(null);
    const [loadingSub, setLoadingSub] = useState(true);


    const [resultModal, setResultModal] = useState({ visible: false, title: '', message: '', type: 'success' }); // type: success | error
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    React.useEffect(() => {
        if (user?.username) {
            fetchSubscription();
        }
    }, [user]);

    const fetchSubscription = async () => {
        try {
            setLoadingSub(true);
            const data = await authAPI.getSubscriptionStatus(user.username);
            setSubscription(data);
        } catch (error) {
            console.error("Error fetching subscription:", error);
        } finally {
            setLoadingSub(false);
        }
    };



    // ... (keep handleSave and others)

    const getPlanColor = (plan) => {
        switch (plan?.toUpperCase()) {
            case "NEGOCIO":
                return "#A855F7"; // purple-500
            case "EMPRENDEDOR":
                return "#3B82F6"; // blue-500
            default:
                return "#22C55E"; // green-500
        }
    };

    const getPlanBgColor = (plan) => {
        switch (plan?.toUpperCase()) {
            case "NEGOCIO":
                return "#F3E8FF"; // purple-100
            case "EMPRENDEDOR":
                return "#DBEAFE"; // blue-100
            default:
                return "#DCFCE7"; // green-100
        }
    };

    // ...

    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} style={{ padding: 8, marginLeft: -8 }}>
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Mi Cuenta</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Subscription Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Mi Suscripción</Text>

                    {loadingSub ? (
                        <ActivityIndicator color="#2563EB" />
                    ) : (
                        <View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <View>
                                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Plan Actual</Text>
                                    <View style={{
                                        backgroundColor: getPlanBgColor(subscription?.plan),
                                        paddingHorizontal: 8,
                                        paddingVertical: 2,
                                        borderRadius: 4,
                                        alignSelf: 'flex-start',
                                        marginTop: 4
                                    }}>
                                        <Text style={{
                                            color: getPlanColor(subscription?.plan),
                                            fontWeight: 'bold',
                                            fontSize: 14
                                        }}>
                                            {subscription?.plan || 'Free'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Días Restantes</Text>
                                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>
                                        {subscription?.diasRestantes ?? "-"}
                                    </Text>
                                </View>
                            </View>

                            {subscription?.fechaFin && (
                                <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>
                                    Vence el: {new Date(subscription.fechaFin).toLocaleDateString('es-AR')}
                                </Text>
                            )}


                        </View>
                    )}
                </View>

                {/* Profile Card */}
                <View style={[styles.card, { marginTop: 16 }]}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
                            </Text>
                        </View>
                        <View style={{ marginLeft: 16 }}>
                            <Text style={styles.userNameHeader}>{user?.nombre || 'Usuario'}</Text>
                            <Text style={styles.userRoleHeader}>{user?.rol || 'Vendedor'}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Usuario</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: '#F3F4F6', color: '#9CA3AF' }]}
                                value={user?.username}
                                editable={false}
                            />
                            <Text style={styles.helperText}>El nombre de usuario no se puede cambiar.</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nombre Completo</Text>
                            <TextInput
                                style={[styles.input, isEditing ? styles.inputEditable : {}]}
                                value={nombre}
                                onChangeText={setNombre}
                                editable={isEditing}
                                placeholder="Tu nombre"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={[styles.input, isEditing ? styles.inputEditable : {}]}
                                value={email}
                                onChangeText={setEmail}
                                editable={isEditing}
                                keyboardType="email-address"
                                placeholder="correo@ejemplo.com"
                            />
                        </View>

                        {isEditing ? (
                            <View style={styles.actions}>
                                <TouchableOpacity
                                    style={[styles.button, styles.cancelButton]}
                                    onPress={() => {
                                        setIsEditing(false);
                                        setNombre(user?.nombre || '');
                                        setEmail(user?.email || '');
                                    }}
                                >
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, styles.saveButton]}
                                    onPress={handleSave}
                                    disabled={saveLoading}
                                >
                                    {saveLoading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => setIsEditing(true)}
                            >
                                <Text style={styles.editButtonText}>Editar Perfil</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Security Card */}
                <View style={[styles.card, { marginTop: 16 }]}>
                    <Text style={styles.cardTitle}>Seguridad</Text>
                    <TouchableOpacity style={styles.optionRow} onPress={() => setShowPasswordModal(true)}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="key-outline" size={20} color="#4B5563" />
                            <Text style={{ marginLeft: 12, color: '#374151', fontSize: 16 }}>Cambiar Contraseña</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.button, styles.logoutFullButton]}
                    onPress={() => setShowLogoutConfirm(true)}
                >
                    <Text style={styles.logoutFullButtonText}>Cerrar Sesión</Text>
                </TouchableOpacity>

            </ScrollView>

            {showPasswordModal && (
                <View style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 100
                }}>
                    <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Cambiar Contraseña</Text>

                        <View style={{ marginBottom: 16 }}>
                            <Text style={styles.label}>Contraseña Actual</Text>
                            <TextInput
                                style={styles.input}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry
                                placeholder="Ingresa tu contraseña actual"
                            />
                        </View>

                        <View style={{ marginBottom: 24 }}>
                            <Text style={styles.label}>Nueva Contraseña</Text>
                            <TextInput
                                style={styles.input}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                                placeholder="Ingresa la nueva contraseña"
                            />
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={() => {
                                    setShowPasswordModal(false);
                                    setCurrentPassword('');
                                    setNewPassword('');
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.saveButton]}
                                onPress={handleUpdatePassword}
                                disabled={passwordLoading}
                            >
                                {passwordLoading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Actualizar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            <ConfirmDialog
                visible={showLogoutConfirm}
                title="Cerrar Sesión"
                message="¿Estás seguro que deseas salir?"
                confirmText="Salir"
                onConfirm={onLogout}
                onCancel={() => setShowLogoutConfirm(false)}
            />

            {/* Generic Result Modal */}
            <Modal
                visible={resultModal.visible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setResultModal({ ...resultModal, visible: false })}
            >
                <View style={{
                    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center', alignItems: 'center', padding: 20
                }}>
                    <View style={{
                        backgroundColor: 'white', borderRadius: 20, padding: 24,
                        width: '100%', maxWidth: 400
                    }}>
                        <SuccessScreen
                            title={resultModal.title}
                            message={resultModal.message}
                            primaryButtonText="Aceptar"
                            onPrimaryAction={() => setResultModal({ ...resultModal, visible: false })}
                            icon={resultModal.type === 'success' ? 'checkmark' : 'alert-circle'}
                            iconColor={resultModal.type === 'success' ? '#16A34A' : '#DC2626'} // Green or Red
                            iconBgColor={resultModal.type === 'success' ? '#DCFCE7' : '#FEE2E2'} // Light Green or Light Red
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        padding: 16
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827'
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 16
    },
    avatarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#BFDBFE'
    },
    avatarText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2563EB'
    },
    userNameHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827'
    },
    userRoleHeader: {
        fontSize: 14,
        color: '#6B7280'
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginBottom: 20
    },
    inputGroup: {
        marginBottom: 16
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 6
    },
    input: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        color: '#111827',
        fontSize: 16
    },
    inputEditable: {
        borderColor: '#2563EB',
        backgroundColor: '#EFF6FF'
    },
    helperText: {
        marginTop: 4,
        fontSize: 12,
        color: '#6B7280'
    },
    actions: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 12
    },
    button: {
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1
    },
    editButton: {
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        marginTop: 8
    },
    editButtonText: {
        color: '#374151',
        fontWeight: '600',
        fontSize: 16
    },
    saveButton: {
        backgroundColor: '#2563EB'
    },
    saveButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16
    },
    cancelButton: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#D1D5DB'
    },
    cancelButtonText: {
        color: '#374151',
        fontWeight: '600'
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    logoutFullButton: {
        marginTop: 24,
        marginBottom: 40,
        backgroundColor: '#FEE2E2',
        borderWidth: 1,
        borderColor: '#FECACA'
    },
    logoutFullButtonText: {
        color: '#DC2626',
        fontWeight: '600',
        fontSize: 16
    }
});
