
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!username || !password) {
            setError('Por favor completa todos los campos');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const result = await login(username, password);
            if (!result.success) {
                setError(result.message);
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 20 }}>
            <View style={{ width: '100%', maxWidth: 400, backgroundColor: 'white', padding: 30, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 }}>
                <View style={{ alignItems: 'center', marginBottom: 30 }}>
                    <View style={{ width: 80, height: 80, backgroundColor: '#EFF6FF', borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                        <Ionicons name="person" size={40} color="#2563EB" />
                    </View>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>Kioskito</Text>
                    <Text style={{ color: '#6B7280', marginTop: 4 }}>Inicia sesión para continuar</Text>
                </View>

                {error ? (
                    <View style={{ backgroundColor: '#FEE2E2', padding: 12, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: '#FECACA' }}>
                        <Text style={{ color: '#B91C1C', textAlign: 'center' }}>{error}</Text>
                    </View>
                ) : null}

                <View style={{ gap: 16 }}>
                    <View>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Usuario</Text>
                        <TextInput
                            style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, color: '#111827' }}
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            placeholder="Ingresa tu usuario"
                        />
                    </View>

                    <View>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Contraseña</Text>
                        <TextInput
                            style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, color: '#111827' }}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            placeholder="Ingresa tu contraseña"
                        />
                    </View>

                    <TouchableOpacity
                        style={{ backgroundColor: '#2563EB', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 }}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Ingresar</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
