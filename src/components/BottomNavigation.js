import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native"
import { Ionicons, Feather } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const BottomNavigation = ({ activeTab, onTabChange }) => {
    const insets = useSafeAreaInsets()
    const tabs = [
        { id: "dashboard", label: "Inicio", icon: "home", iconSet: "feather" },
        { id: "sales", label: "Ventas", icon: "shopping-bag", iconSet: "feather" },
        { id: "inventory", label: "Inventario", icon: "package", iconSet: "feather" },
        { id: "menu", label: "Menú", icon: "grid", iconSet: "feather" },
    ]

    const isTabActive = (tabId) => {
        if (activeTab === tabId) return true
        if (tabId === 'menu' && ['debtors', 'analytics'].includes(activeTab)) return true
        return false
    }

    return (
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={styles.navBar}>
                {tabs.map((tab) => {
                    const active = isTabActive(tab.id)
                    return (
                        <TouchableOpacity
                            key={tab.id}
                            style={styles.tabItem}
                            onPress={() => onTabChange(tab.id)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconWrapper, active && styles.activeIconWrapper]}>
                                {tab.iconSet === "feather" ? (
                                    <Feather name={tab.icon} size={22} color={active ? "#4F46E5" : "#9CA3AF"} />
                                ) : (
                                    <Ionicons name={tab.icon} size={22} color={active ? "#4F46E5" : "#9CA3AF"} />
                                )}
                                {active && <View style={styles.activeDot} />}
                            </View>
                            <Text style={[styles.tabLabel, active && styles.activeTabLabel]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    )
                })}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F9FAFB',
    },
    navBar: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 8,
        paddingHorizontal: 8,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    iconWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 6,
        borderRadius: 16,
        position: 'relative',
    },
    activeIconWrapper: {
        backgroundColor: '#EEF2FF',
    },
    activeDot: {
        position: 'absolute',
        bottom: -2,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#4F46E5',
    },
    tabLabel: {
        fontSize: 11,
        marginTop: 4,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    activeTabLabel: {
        color: '#4F46E5',
        fontWeight: '700',
    },
})
