import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Feather } from '@expo/vector-icons';

export default function LoginScreen() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const { login, register } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!username || !password) {
            setError('Por favor completa todos los campos');
            return;
        }
        if (isRegistering && (!nombre || !email)) {
            setError('Por favor completa todos los campos de registro');
            return;
        }

        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            if (isRegistering) {
                const result = await register({ username, password, nombre, email });
                if (result.success) {
                    setSuccessMessage('¡Cuenta creada! Ahora puedes iniciar sesión.');
                    setIsRegistering(false);
                    setPassword('');
                } else {
                    setError(result.message);
                }
            } else {
                const result = await login(username, password);
                if (!result.success) {
                    setError(result.message);
                }
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, backgroundColor: '#F9FAFB' }}
        >
            <StatusBar barStyle="dark-content" />
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
                <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827', textAlign: 'center' }}>
                        {isRegistering ? 'Crea tu cuenta' : '¡Bienvenido!'}
                    </Text>
                    <Text style={{ color: '#6B7280', marginTop: 4, textAlign: 'center' }}>
                        {isRegistering ? 'Completa los datos para empezar' : 'Ingresa tus credenciales'}
                    </Text>
                </View>

                <View style={{
                    backgroundColor: 'white',
                    padding: 30,
                    borderRadius: 24,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.05,
                    shadowRadius: 15,
                    elevation: 5,
                    borderWidth: 1,
                    borderColor: '#F3F4F6'
                }}>
                    {error ? (
                        <View style={{ backgroundColor: '#FEF2F2', padding: 14, borderRadius: 12, marginBottom: 20, flexDirection: 'row', alignItems: 'center' }}>
                            <Feather name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 10 }} />
                            <Text style={{ color: '#B91C1C', fontSize: 14, flex: 1 }}>{error}</Text>
                        </View>
                    ) : null}

                    {successMessage ? (
                        <View style={{ backgroundColor: '#F0FDF4', padding: 14, borderRadius: 12, marginBottom: 20, flexDirection: 'row', alignItems: 'center' }}>
                            <Feather name="check-circle" size={18} color="#10B981" style={{ marginRight: 10 }} />
                            <Text style={{ color: '#064E3B', fontSize: 14, flex: 1 }}>{successMessage}</Text>
                        </View>
                    ) : null}

                    <View style={{ gap: 20 }}>
                        {isRegistering && (
                            <>
                                <View>
                                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginLeft: 4 }}>Nombre Completo</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12 }}>
                                        <Feather name="user" size={18} color="#9CA3AF" />
                                        <TextInput
                                            style={{ flex: 1, padding: 12, color: '#111827', fontSize: 15 }}
                                            value={nombre}
                                            onChangeText={setNombre}
                                            placeholder="Juan Pérez"
                                            placeholderTextColor="#9CA3AF"
                                        />
                                    </View>
                                </View>
                                <View>
                                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginLeft: 4 }}>Correo Electrónico</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12 }}>
                                        <Feather name="mail" size={18} color="#9CA3AF" />
                                        <TextInput
                                            style={{ flex: 1, padding: 12, color: '#111827', fontSize: 15 }}
                                            value={email}
                                            onChangeText={setEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            placeholder="correo@ejemplo.com"
                                            placeholderTextColor="#9CA3AF"
                                        />
                                    </View>
                                </View>
                            </>
                        )}

                        <View>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginLeft: 4 }}>Usuario</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12 }}>
                                <Feather name="at-sign" size={18} color="#9CA3AF" />
                                <TextInput
                                    style={{ flex: 1, padding: 12, color: '#111827', fontSize: 15 }}
                                    value={username}
                                    onChangeText={setUsername}
                                    autoCapitalize="none"
                                    placeholder="tu_usuario"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>

                        <View>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginLeft: 4 }}>Contraseña</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12 }}>
                                <Feather name="lock" size={18} color="#9CA3AF" />
                                <TextInput
                                    style={{ flex: 1, padding: 12, color: '#111827', fontSize: 15 }}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    placeholder="••••••••"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={{
                                backgroundColor: '#4F46E5',
                                padding: 16,
                                borderRadius: 14,
                                alignItems: 'center',
                                marginTop: 10,
                                shadowColor: "#4F46E5",
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.2,
                                shadowRadius: 8,
                                elevation: 4
                            }}
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                                    {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ padding: 10, alignItems: 'center', marginTop: 10 }}
                            onPress={() => {
                                setIsRegistering(!isRegistering);
                                setError('');
                                setSuccessMessage('');
                            }}
                        >
                            <Text style={{ color: '#4F46E5', fontWeight: '600', fontSize: 14 }}>
                                {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate gratis'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
