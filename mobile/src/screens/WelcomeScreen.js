import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#28282B" />

            <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <LinearGradient
                        colors={['#48A14D', '#2D7A32']}
                        style={styles.logoBox}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Icon name="wallet" size={44} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.appName}>OmniSafe</Text>
                    <Text style={styles.tagline}>Smart. Safe. Simple.</Text>
                </View>

                {/* Features */}
                <View style={styles.featuresContainer}>
                    <View style={styles.feature}>
                        <Text style={styles.featureEmoji}>🛡️</Text>
                        <View style={styles.featureTextContainer}>
                            <Text style={styles.featureTitle}>AI-Powered Security</Text>
                            <Text style={styles.featureSubtitle}>Advanced threat detection</Text>
                        </View>
                        <View style={styles.greenDot} />
                    </View>
                    <View style={styles.feature}>
                        <Text style={styles.featureEmoji}>👤</Text>
                        <View style={styles.featureTextContainer}>
                            <Text style={styles.featureTitle}>Facial Recognition</Text>
                            <Text style={styles.featureSubtitle}>Biometric authentication</Text>
                        </View>
                        <View style={styles.greenDot} />
                    </View>
                    <View style={styles.feature}>
                        <Text style={styles.featureEmoji}>⚡</Text>
                        <View style={styles.featureTextContainer}>
                            <Text style={styles.featureTitle}>Instant Transfers</Text>
                            <Text style={styles.featureSubtitle}>Send money in seconds</Text>
                        </View>
                        <View style={styles.greenDot} />
                    </View>
                </View>

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => navigation.navigate('Login')}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#48A14D', '#2D7A32']}
                            style={styles.loginGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.loginButtonText}>Login</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.signupButton}
                        onPress={() => navigation.navigate('Signup')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.signupButtonText}>Create Account</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#28282B',
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 60,
        paddingHorizontal: 24,
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    logoBox: {
        width: 88,
        height: 88,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#48A14D',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 12,
    },
    appName: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: 20,
        letterSpacing: -0.5,
    },
    tagline: {
        fontSize: 14,
        color: '#A0A0A5',
        marginTop: 8,
        letterSpacing: 0.5,
    },
    featuresContainer: {
        marginTop: 32,
        gap: 12,
    },
    feature: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3A3A3D',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#4A4A4D',
    },
    featureEmoji: {
        fontSize: 24,
        width: 36,
    },
    featureTextContainer: {
        flex: 1,
        marginLeft: 8,
    },
    featureTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    featureSubtitle: {
        fontSize: 12,
        color: '#A0A0A5',
        marginTop: 2,
    },
    greenDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#48A14D',
        shadowColor: '#48A14D',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
        elevation: 4,
    },
    buttonContainer: {
        marginTop: 32,
        gap: 12,
    },
    loginButton: {
        borderRadius: 13,
        overflow: 'hidden',
        shadowColor: '#48A14D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    loginGradient: {
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    signupButton: {
        height: 52,
        borderRadius: 13,
        borderWidth: 1.5,
        borderColor: '#48A14D',
        justifyContent: 'center',
        alignItems: 'center',
    },
    signupButtonText: {
        color: '#48A14D',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default WelcomeScreen;
