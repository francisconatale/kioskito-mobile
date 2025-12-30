import { View, Text, TouchableOpacity, Platform } from "react-native"
import { Ionicons, Feather } from '@expo/vector-icons'

export const BottomNavigation = ({ activeTab, onTabChange }) => {
    const tabs = [
        { id: "dashboard", label: "Inicio", icon: "trending-up" },
        { id: "inventory", label: "Inventario", icon: "package", iconSet: "feather" },
        { id: "sales", label: "Ventas", icon: "cart-outline" },
        { id: "debtors", label: "Deudores", icon: "people-outline" },
        { id: "analytics", label: "Análisis", icon: "bar-chart-outline" },
    ]

    return (
        <View style={{
            flexDirection: 'row',
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
            padding: 8,
            paddingBottom: Platform.OS === 'android' ? 28 : 12 // Significantly more space for Android buttons
        }}>
            {tabs.map((tab) => (
                <TouchableOpacity
                    key={tab.id}
                    style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}
                    onPress={() => onTabChange(tab.id)}
                >
                    <View style={{ backgroundColor: activeTab === tab.id ? '#eff6ff' : 'transparent', padding: 8, borderRadius: 8 }}>
                        {tab.iconSet === "feather" ? (
                            <Feather name={tab.icon} size={24} color={activeTab === tab.id ? "#3b82f6" : "#9ca3af"} />
                        ) : (
                            <Ionicons name={tab.icon} size={24} color={activeTab === tab.id ? "#3b82f6" : "#9ca3af"} />
                        )}
                    </View>
                    <Text style={{ fontSize: 12, marginTop: 4, color: activeTab === tab.id ? "#3b82f6" : "#6b7280", fontWeight: activeTab === tab.id ? '600' : '400' }}>
                        {tab.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    )
}
