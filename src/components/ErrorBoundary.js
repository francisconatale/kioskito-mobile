
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={{ flex: 1, backgroundColor: '#FEF2F2', padding: 20, justifyContent: 'center' }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#991B1B', marginBottom: 10 }}>
                        Algo salió mal :(
                    </Text>
                    <ScrollView style={{ maxHeight: 300, backgroundColor: 'white', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#FECACA' }}>
                        <Text style={{ color: '#DC2626', fontWeight: '600' }}>
                            {this.state.error && this.state.error.toString()}
                        </Text>
                        {this.state.errorInfo && (
                            <Text style={{ color: '#7F1D1D', fontSize: 12, marginTop: 10 }}>
                                {this.state.errorInfo.componentStack}
                            </Text>
                        )}
                    </ScrollView>
                    <TouchableOpacity
                        style={{ marginTop: 20, backgroundColor: '#DC2626', padding: 12, borderRadius: 8, alignItems: 'center' }}
                        onPress={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                    >
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Intentar de nuevo</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}
