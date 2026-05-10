import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Linking,
    SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

const DuressAlertScreen = ({ navigation, route }) => {
    const { emotion, scores } = route.params;

    const emotionConfidence = scores?.[emotion]
        ? `${scores[emotion].toFixed(1)}%`
        : 'N/A';

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#28282B" />
            <View style={styles.content}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.title}>We noticed something unusual</Text>
                <Text style={styles.body}>
                    If someone is forcing you to make this transfer, please let us know.
                </Text>

                <View style={styles.emotionCard}>
                    <Text style={styles.emotionLabel}>Detected Emotion</Text>
                    <Text style={styles.emotionValue}>
                        {emotion ? emotion.charAt(0).toUpperCase() + emotion.slice(1) : 'Unknown'}
                    </Text>
                    <Text style={styles.confidenceText}>Confidence: {emotionConfidence}</Text>
                </View>

                <TouchableOpacity
                    style={styles.safeButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#48A14D', '#2D7A32']}
                        style={styles.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.safeButtonText}>I'm Safe — Try Again</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => navigation.replace('Dashboard')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.cancelButtonText}>Cancel Transaction</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.emergencyButton}
                    onPress={() => Linking.openURL('tel:115')}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#E53935', '#C62828']}
                        style={styles.emergencyGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Icon name="phone" size={20} color="#fff" />
                        <Text style={styles.emergencyButtonText}>Call Emergency (115)</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#28282B',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    warningIcon: {
        fontSize: 80,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 12,
    },
    body: {
        fontSize: 15,
        color: '#A0A0A5',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    emotionCard: {
        backgroundColor: '#3A3A3D',
        borderRadius: 18,
        padding: 20,
        alignItems: 'center',
        width: '100%',
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#4A4A4D',
    },
    emotionLabel: {
        fontSize: 13,
        color: '#A0A0A5',
        marginBottom: 6,
    },
    emotionValue: {
        fontSize: 22,
        fontWeight: '700',
        color: '#E53935',
        marginBottom: 4,
    },
    confidenceText: {
        fontSize: 14,
        color: '#606065',
    },
    safeButton: {
        width: '100%',
        borderRadius: 13,
        overflow: 'hidden',
        marginBottom: 12,
    },
    gradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    safeButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    cancelButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: '#4A4A4D',
        alignItems: 'center',
        marginBottom: 12,
    },
    cancelButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    emergencyButton: {
        width: '100%',
        borderRadius: 13,
        overflow: 'hidden',
    },
    emergencyGradient: {
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    emergencyButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
});

export default DuressAlertScreen;
