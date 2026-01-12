
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const SuccessScreen = ({
    title,
    message,
    primaryButtonText,
    onPrimaryAction,
    secondaryButtonText,
    onSecondaryAction,
    icon = "checkmark",
    iconColor = "#16A34A",
    iconBgColor = "#DCFCE7"
}) => {
    return (
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <View style={{
                width: 72,
                height: 72,
                backgroundColor: iconBgColor,
                borderRadius: 36,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
                borderWidth: iconBgColor === '#F0FDF4' ? 4 : 0, // Match the style from ProductModal slightly or unify?
                // Let's unify to the cleaner one from RestockModal which is just bg
            }}>
                <Ionicons name={icon} size={40} color={iconColor} />
            </View>

            <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8, textAlign: 'center', fontFamily: 'System' }}>
                {title}
            </Text>

            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, textAlign: 'center', fontFamily: 'System', lineHeight: 20 }}>
                {message}
            </Text>

            <View style={{ width: '100%', gap: 12 }}>
                {onPrimaryAction && (
                    <TouchableOpacity
                        style={{
                            backgroundColor: '#2563EB',
                            padding: 14,
                            borderRadius: 12,
                            alignItems: 'center',
                            flexDirection: 'row',
                            justifyContent: 'center'
                        }}
                        onPress={onPrimaryAction}
                    >
                        {/* If the button text suggests an icon, we might want to pass it, but simpler is better for now */}
                        <Text style={{ color: 'white', fontWeight: '600', fontSize: 16, fontFamily: 'System' }}>
                            {primaryButtonText || 'Aceptar'}
                        </Text>
                    </TouchableOpacity>
                )}

                {onSecondaryAction && (
                    <TouchableOpacity
                        style={{
                            backgroundColor: 'white',
                            borderWidth: 1,
                            borderColor: '#E5E7EB',
                            padding: 14,
                            borderRadius: 12,
                            alignItems: 'center'
                        }}
                        onPress={onSecondaryAction}
                    >
                        <Text style={{ color: '#4B5563', fontWeight: '600', fontSize: 16, fontFamily: 'System' }}>
                            {secondaryButtonText || 'Cerrar'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};
