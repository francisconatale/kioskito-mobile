import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const Account = ({ onLogout, onBack }) => {
    const { user, loading, setUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [nombre, setNombre] = useState(user?.nombre || '');
    const [email, setEmail] = useState(user?.email || '');
    const [saveLoading, setSaveLoading] = useState(false);

    // Password Change State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    const handleSave = async () => {
        if (!nombre || !email) {
            Alert.alert("Error", "Nombre y Email son obligatorios");
            return;
        }

        setSaveLoading(true);
        try {
            const response = await apiRequest('/auth/update-profile', {
                method: 'POST',
                body: JSON.stringify({
                    username: user.username,
                    nombre,
                    email
                })
            });

            if (response.success) {
                const updatedUser = response.user;
                setUser(updatedUser);
                await AsyncStorage.setItem('user_session', JSON.stringify(updatedUser)); // Persist locally!

                Alert.alert("Éxito", "Perfil actualizado correctamente");
                setIsEditing(false);
            } else {
                Alert.alert("Error", response.message || "No se pudo actualizar el perfil");
            }
        } catch (e) {
            Alert.alert("Error", e.message || "Error al conectar con el servidor");
        } finally {
            setSaveLoading(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (!currentPassword || !newPassword) {
            Alert.alert("Error", "Debes ingresar ambas contraseñas");
            return;
        }

        setPasswordLoading(true);
        try {
            const response = await apiRequest('/auth/change-password', {
                method: 'POST',
                body: JSON.stringify({
                    username: user.username,
                    currentPassword,
                    newPassword
                })
            });

            if (response.success) {
                Alert.alert("Éxito", "Contraseña actualizada correctamente");
                setShowPasswordModal(false);
                setCurrentPassword('');
                setNewPassword('');
            } else {
                Alert.alert("Error", response.message || "No se pudo actualizar la contraseña");
            }
        } catch (e) {
            Alert.alert("Error", e.message || "Error al conectar con el servidor");
        } finally {
            setPasswordLoading(false);
        }
    };

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

                <View style={styles.card}>
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
                    onPress={() => {
                        Alert.alert("Cerrar Sesión", "¿Estás seguro que deseas salir?", [
                            { text: "Cancelar", style: "cancel" },
                            { text: "Salir", style: "destructive", onPress: onLogout }
                        ]);
                    }}
                >
                    <Text style={styles.logoutFullButtonText}>Cerrar Sesión</Text>
                </TouchableOpacity>

            </ScrollView>

            {/* Password Modal */}
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
