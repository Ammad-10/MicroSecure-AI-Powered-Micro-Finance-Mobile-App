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
    Image,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { signup } from '../services/api';
import {
    validateEmail,
    validateCNIC,
    validatePassword,
    validateRequired,
    validateAge,
    validateUsername,
    validatePhone,
} from '../utils/validation';

const SignupScreen = ({ navigation }) => {
    const [formData, setFormData] = useState({
        name: '',
        father_name: '',
        date_of_birth: '',
        email: '',
        cnic: '',
        phone_number: '',
        username: '',
        password: '',
    });

    const [faceImage, setFaceImage] = useState(null);
    const [showCamera, setShowCamera] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const cameraRef = useRef(null);
    const [permission, requestPermission] = useCameraPermissions();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
    }, []);

    const updateField = (field, value) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) {
            setErrors({ ...errors, [field]: null });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        const nameError = validateRequired(formData.name, 'Name');
        if (nameError) newErrors.name = nameError;

        const fatherNameError = validateRequired(formData.father_name, 'Father Name');
        if (fatherNameError) newErrors.father_name = fatherNameError;

        const dobError = validateAge(formData.date_of_birth);
        if (dobError) newErrors.date_of_birth = dobError;

        const emailError = validateEmail(formData.email);
        if (emailError) newErrors.email = emailError;

        const cnicError = validateCNIC(formData.cnic);
        if (cnicError) newErrors.cnic = cnicError;

        const phoneError = validatePhone(formData.phone_number);
        if (phoneError) newErrors.phone_number = phoneError;

        const usernameError = validateUsername(formData.username);
        if (usernameError) newErrors.username = usernameError;

        const passwordError = validatePassword(formData.password);
        if (passwordError) newErrors.password = passwordError;

        if (!faceImage) {
            newErrors.face_image = 'Face image is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const requestCameraPermission = async () => {
        const { status } = await requestPermission();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera permission is required to capture your face image.');
            return false;
        }
        return true;
    };

    const handleCaptureFace = async () => {
        const hasPermission = await requestCameraPermission();
        if (hasPermission) {
            setShowCamera(true);
        }
    };

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    base64: false,
                });
                setFaceImage(photo.uri);
                setShowCamera(false);
                if (errors.face_image) {
                    setErrors({ ...errors, face_image: null });
                }
            } catch (error) {
                Alert.alert('Error', 'Failed to capture image. Please try again.');
            }
        }
    };

    const handleSignup = async () => {
        if (!validateForm()) {
            Alert.alert('Validation Error', 'Please fix all errors before submitting.');
            return;
        }

        setLoading(true);

        try {
            let base64Image;
            try {
                base64Image = await FileSystem.readAsStringAsync(faceImage, {
                    encoding: 'base64',
                });
            } catch (fileError) {
                console.error('Failed to read face image file:', fileError);
                Alert.alert('Error', 'Face image file could not be read. Please recapture your face image.');
                setFaceImage(null);
                setLoading(false);
                return;
            }

            const signupData = {
                ...formData,
                date_of_birth: formData.date_of_birth.trim(),
                face_image: base64Image,
            };

            console.log('[Signup] Submitting with date_of_birth:', formData.date_of_birth);

            const result = await signup(signupData);

            if (result.success) {
                Alert.alert(
                    'Success',
                    'Account created successfully! You can now login.',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.navigate('Login'),
                        },
                    ]
                );
            } else {
                Alert.alert('Signup Failed', result.error);
            }
        } catch (error) {
            console.error('Signup error:', error);
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (showCamera) {
        return (
            <View style={styles.cameraContainer}>
                <CameraView
                    ref={cameraRef}
                    style={StyleSheet.absoluteFill}
                    facing="front"
                />
                <View style={styles.cameraOverlay}>
                    <Text style={styles.cameraInstruction}>Position your face in the frame</Text>
                    <View style={styles.cameraButtons}>
                        <TouchableOpacity
                            style={styles.cameraCancelBtn}
                            onPress={() => setShowCamera(false)}
                        >
                            <Text style={styles.cameraCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.captureButton}
                            onPress={takePicture}
                        >
                            <View style={styles.captureButtonInner} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

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
                            <Text style={styles.title}>Create Account</Text>
                            <Text style={styles.subtitle}>Join us today</Text>
                        </View>

                        {/* Form */}
                        <View style={styles.formContainer}>
                            {/* Name */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Full Name</Text>
                                <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
                                    <Icon name="account" size={20} color="#606065" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your full name"
                                        placeholderTextColor="#606065"
                                        value={formData.name}
                                        onChangeText={(value) => updateField('name', value)}
                                    />
                                </View>
                                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                            </View>

                            {/* Father Name */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Father's Name</Text>
                                <View style={[styles.inputWrapper, errors.father_name && styles.inputError]}>
                                    <Icon name="account-supervisor" size={20} color="#606065" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter father's name"
                                        placeholderTextColor="#606065"
                                        value={formData.father_name}
                                        onChangeText={(value) => updateField('father_name', value)}
                                    />
                                </View>
                                {errors.father_name && <Text style={styles.errorText}>{errors.father_name}</Text>}
                            </View>

                            {/* Date of Birth */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Date of Birth (YYYY-MM-DD)</Text>
                                <View style={[styles.inputWrapper, errors.date_of_birth && styles.inputError]}>
                                    <Icon name="calendar" size={20} color="#606065" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="1990-01-01"
                                        placeholderTextColor="#606065"
                                        value={formData.date_of_birth}
                                        onChangeText={(value) => updateField('date_of_birth', value)}
                                    />
                                </View>
                                {errors.date_of_birth && <Text style={styles.errorText}>{errors.date_of_birth}</Text>}
                            </View>

                            {/* Email */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email</Text>
                                <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                                    <Icon name="email" size={20} color="#606065" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="your.email@example.com"
                                        placeholderTextColor="#606065"
                                        value={formData.email}
                                        onChangeText={(value) => updateField('email', value)}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                            </View>

                            {/* CNIC */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>CNIC (13 digits)</Text>
                                <View style={[styles.inputWrapper, errors.cnic && styles.inputError]}>
                                    <Icon name="card-account-details" size={20} color="#606065" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="1234567890123"
                                        placeholderTextColor="#606065"
                                        value={formData.cnic}
                                        onChangeText={(value) => updateField('cnic', value)}
                                        keyboardType="numeric"
                                        maxLength={13}
                                    />
                                </View>
                                {errors.cnic && <Text style={styles.errorText}>{errors.cnic}</Text>}
                            </View>

                            {/* Phone Number */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Phone Number (11 digits)</Text>
                                <View style={[styles.inputWrapper, errors.phone_number && styles.inputError]}>
                                    <Icon name="phone" size={20} color="#606065" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="03XXXXXXXXX"
                                        placeholderTextColor="#606065"
                                        value={formData.phone_number}
                                        onChangeText={(value) => updateField('phone_number', value)}
                                        keyboardType="phone-pad"
                                        maxLength={11}
                                    />
                                </View>
                                {errors.phone_number && <Text style={styles.errorText}>{errors.phone_number}</Text>}
                            </View>

                            {/* Username */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Username</Text>
                                <View style={[styles.inputWrapper, errors.username && styles.inputError]}>
                                    <Icon name="at" size={20} color="#606065" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Choose a username"
                                        placeholderTextColor="#606065"
                                        value={formData.username}
                                        onChangeText={(value) => updateField('username', value)}
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
                                        placeholder="Min 8 chars, letters & digits"
                                        placeholderTextColor="#606065"
                                        value={formData.password}
                                        onChangeText={(value) => updateField('password', value)}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <Icon
                                            name={showPassword ? 'eye-off' : 'eye'}
                                            size={20}
                                            color="#606065"
                                        />
                                    </TouchableOpacity>
                                </View>
                                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                            </View>

                            {/* Face Image */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Face Image</Text>
                                <TouchableOpacity
                                    style={styles.imageButton}
                                    onPress={handleCaptureFace}
                                    activeOpacity={0.8}
                                >
                                    {faceImage ? (
                                        <View style={styles.imagePreview}>
                                            <Image source={{ uri: `file://${faceImage}` }} style={styles.previewImage} />
                                            <Text style={styles.imageButtonText}>Retake Photo</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.imagePlaceholder}>
                                            <Icon name="camera" size={40} color="#48A14D" />
                                            <Text style={styles.imageButtonText}>Capture Face Image</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                {errors.face_image && <Text style={styles.errorText}>{errors.face_image}</Text>}
                            </View>

                            {/* Signup Button */}
                            <TouchableOpacity
                                style={[styles.signupButton, loading && styles.disabledButton]}
                                onPress={handleSignup}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={loading ? ['#3A3A3D', '#3A3A3D'] : ['#48A14D', '#2D7A32']}
                                    style={styles.signupGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#606065" />
                                    ) : (
                                        <Text style={styles.signupButtonText}>Create Account</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Login Link */}
                            <View style={styles.loginContainer}>
                                <Text style={styles.loginText}>Already have an account? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                    <Text style={styles.loginLink}>Login</Text>
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
        marginBottom: 18,
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
    imageButton: {
        borderRadius: 13,
        borderWidth: 1.5,
        borderColor: '#48A14D',
        borderStyle: 'dashed',
        overflow: 'hidden',
    },
    imagePlaceholder: {
        alignItems: 'center',
        paddingVertical: 28,
    },
    imagePreview: {
        alignItems: 'center',
        paddingVertical: 14,
    },
    previewImage: {
        width: 110,
        height: 110,
        borderRadius: 55,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '#48A14D',
    },
    imageButtonText: {
        color: '#48A14D',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8,
    },
    signupButton: {
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
    signupGradient: {
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
    },
    signupButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    loginText: {
        color: '#A0A0A5',
        fontSize: 14,
    },
    loginLink: {
        color: '#48A14D',
        fontSize: 14,
        fontWeight: '600',
    },
    cameraContainer: {
        flex: 1,
    },
    cameraOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'space-between',
        paddingVertical: 60,
    },
    cameraInstruction: {
        color: '#FFFFFF',
        fontSize: 16,
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 14,
    },
    cameraButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    cameraCancelBtn: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: 13,
    },
    cameraCancelText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#48A14D',
    },
});

export default SignupScreen;
