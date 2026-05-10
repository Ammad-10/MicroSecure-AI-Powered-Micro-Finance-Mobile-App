import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login, getCurrentUser } from '../services/api';
import { validateRequired, validatePassword } from '../utils/validation';

const LoginScreen = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
    }, []);

    const validateForm = () => {
        const newErrors = {};

        const usernameError = validateRequired(username, 'Username');
        if (usernameError) newErrors.username = usernameError;

        const passwordError = validateRequired(password, 'Password');
        if (passwordError) newErrors.password = passwordError;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const result = await login(username, password);
            if (result.success) {
                const userResult = await getCurrentUser();
                if (userResult.success) {
                    navigation.replace('Dashboard');
                } else {
                    navigation.replace('Dashboard');
                }
            } else {
                Alert.alert('Login Failed', result.error);
            }
        } catch (error) {
            console.error('Login error:', error);
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBiometricLogin = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            if (!hasHardware) {
                Alert.alert('Not Available', 'Biometric authentication is not available on this device.');
                return;
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Verify your identity',
            });

            if (result.success) {
                const token = await AsyncStorage.getItem('access_token');
                if (token) {
                    setLoading(true);
                    const userResult = await getCurrentUser();
                    setLoading(false);
                    if (userResult.success) {
                        navigation.replace('Dashboard');
                    } else {
                        Alert.alert('Session Expired', 'Please login with password first.');
                    }
                } else {
                    Alert.alert('No Session', 'Please login with password first.');
                }
            }
        } catch (error) {
            console.error('Biometric error:', error);
            Alert.alert('Error', 'Biometric authentication failed.');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#28282B" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                style={styles.backButton}
                            >
                                <Icon name="chevron-left" size={28} color="#FFFFFF" />
                            </TouchableOpacity>
                            <Text style={styles.title}>Welcome Back</Text>
                            <Text style={styles.subtitle}>Login to your account</Text>
                        </View>

                        {/* Form */}
                        <View style={styles.formContainer}>
                            {/* Username */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Username</Text>
                                <View style={[styles.inputWrapper, errors.username && styles.inputError]}>
                                    <Icon name="account" size={20} color="#606065" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your username"
                                        placeholderTextColor="#606065"
                                        value={username}
                                        onChangeText={setUsername}
                                        autoCapitalize="none"
                                    />
                                </View>
                                {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
                            </View>

                            {/* Password */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                                    <Icon name="lock" size={20} color="#606065" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your password"
                                        placeholderTextColor="#606065"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                                        <Icon
                                            name={showPassword ? 'eye-off' : 'eye'}
                                            size={20}
                                            color="#606065"
                                        />
                                    </TouchableOpacity>
                                </View>
                                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                            </View>

                            {/* Login Button */}
                            <TouchableOpacity
                                style={[styles.loginButton, loading && styles.disabledButton]}
                                onPress={handleLogin}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={loading ? ['#3A3A3D', '#3A3A3D'] : ['#48A14D', '#2D7A32']}
                                    style={styles.loginGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#606065" />
                                    ) : (
                                        <Text style={styles.loginButtonText}>Login</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Biometric Login */}
                            <TouchableOpacity
                                style={styles.biometricButton}
                                onPress={handleBiometricLogin}
                                activeOpacity={0.8}
                            >
                                <Icon name="fingerprint" size={24} color="#48A14D" />
                                <Text style={styles.biometricText}>Login with Biometrics</Text>
                            </TouchableOpacity>

                            {/* Signup Link */}
                            <View style={styles.signupContainer}>
                                <Text style={styles.signupText}>Don't have an account? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                                    <Text style={styles.signupLink}>Sign Up</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#28282B',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 32,
    },
    header: {
        marginBottom: 32,
    },
    backButton: {
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#A0A0A5',
    },
    formContainer: {
        backgroundColor: '#3A3A3D',
        borderRadius: 18,
        padding: 20,
        borderWidth: 1,
        borderColor: '#4A4A4D',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        fontWeight: '500',
        color: '#A0A0A5',
        marginBottom: 6,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3A3A3D',
        borderRadius: 11,
        paddingHorizontal: 14,
        borderWidth: 1.5,
        borderColor: '#4A4A4D',
        height: 52,
    },
    inputError: {
        borderColor: '#E53935',
    },
    inputIcon: {
        marginRight: 10,
    },
    eyeButton: {
        paddingRight: 0,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#FFFFFF',
    },
    errorText: {
        color: '#E53935',
        fontSize: 11,
        marginTop: 4,
    },
    loginButton: {
        marginTop: 8,
        borderRadius: 13,
        overflow: 'hidden',
        shadowColor: '#48A14D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    disabledButton: {
        shadowOpacity: 0,
        elevation: 0,
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
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        height: 52,
        borderRadius: 13,
        borderWidth: 1.5,
        borderColor: '#48A14D',
        gap: 8,
    },
    biometricText: {
        color: '#48A14D',
        fontSize: 15,
        fontWeight: '600',
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    signupText: {
        color: '#A0A0A5',
        fontSize: 14,
    },
    signupLink: {
        color: '#48A14D',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default LoginScreen;
