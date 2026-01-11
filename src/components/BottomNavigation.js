import { View, Text, TouchableOpacity, Platform } from "react-native"
import { Ionicons, Feather } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const BottomNavigation = ({ activeTab, onTabChange }) => {
    const insets = useSafeAreaInsets()
    const tabs = [
        { id: "dashboard", label: "Inicio", icon: "trending-up" },
        { id: "sales", label: "Ventas", icon: "cart-outline" },
        { id: "inventory", label: "Inventario", icon: "package", iconSet: "feather" },
        { id: "menu", label: "Más", icon: "grid-outline" },
    ]

    return (
        <View style={{
            flexDirection: 'row',
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
            padding: 8,
            paddingBottom: Math.max(insets.bottom, 12) + 8 // Dynamic safe area + visual padding
        }}>
            {tabs.map((tab) => (
                <TouchableOpacity
                    key={tab.id}
                    style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}
                    onPress={() => onTabChange(tab.id)}
                >
                    <View style={{ backgroundColor: (activeTab === tab.id || (tab.id === 'menu' && ['debtors', 'analytics'].includes(activeTab))) ? '#eff6ff' : 'transparent', padding: 8, borderRadius: 8 }}>
                        {tab.iconSet === "feather" ? (
                            <Feather name={tab.icon} size={24} color={(activeTab === tab.id || (tab.id === 'menu' && ['debtors', 'analytics'].includes(activeTab))) ? "#3b82f6" : "#9ca3af"} />
                        ) : (
                            <Ionicons name={tab.icon} size={24} color={(activeTab === tab.id || (tab.id === 'menu' && ['debtors', 'analytics'].includes(activeTab))) ? "#3b82f6" : "#9ca3af"} />
                        )}
                    </View>
                    <Text style={{ fontSize: 12, marginTop: 4, color: (activeTab === tab.id || (tab.id === 'menu' && ['debtors', 'analytics'].includes(activeTab))) ? "#3b82f6" : "#6b7280", fontWeight: (activeTab === tab.id || (tab.id === 'menu' && ['debtors', 'analytics'].includes(activeTab))) ? '600' : '400' }}>
                        {tab.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    )
}
