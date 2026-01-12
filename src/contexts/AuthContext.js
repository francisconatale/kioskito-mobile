
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        try {
            const storedUser = await AsyncStorage.getItem('user_session');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (e) {
            console.error('Error checking session:', e);
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        try {
            const response = await apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            const userData = response.user || response;

            await AsyncStorage.setItem('user_session', JSON.stringify(userData));
            if (response.token) {
                await AsyncStorage.setItem('auth_token', response.token);
            }

            setUser(userData);
            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: error.message || 'Error al iniciar sesión' };
        }
    };

    const register = async (userData) => {
        try {
            await apiRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            return { success: true, message: 'Usuario registrado correctamente' };
        } catch (error) {
            return { success: false, message: error.message || 'Error al registrar usuario' };
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('user_session');
            await AsyncStorage.removeItem('auth_token');
            setUser(null);
        } catch (e) {
            console.error('Logout error:', e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, register, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
