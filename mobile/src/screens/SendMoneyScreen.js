import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    StatusBar,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    SafeAreaView,
    Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { sendMoney, verifyTransaction, getCurrentUser } from '../services/api';

const SendMoneyScreen = ({ navigation }) => {
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);

    // Camera State
    const [showCamera, setShowCamera] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef(null);

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        const result = await getCurrentUser();
        if (result.success) {
            setUser(result.data);
        } else {
            Alert.alert('Error', 'Failed to fetch user details');
            navigation.goBack();
        }
    };

    const handleTransfer = async () => {
        if (!recipient || recipient.trim().length !== 11) {
            Alert.alert('Error', 'Please enter a valid 11-digit recipient phone number.');
            return;
        }

        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            Alert.alert('Error', 'Please enter a valid amount.');
            return;
        }

        // Start Face Verification Flow
        if (!permission?.granted) {
            const { status } = await requestPermission();
            if (status !== 'granted') {
                Alert.alert('Permission required', 'Camera permission is needed for verification.');
                return;
            }
        }
        setShowCamera(true);
    };

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.7,
                    base64: false,
                });
                setShowCamera(false);
                verifyAndProcess(photo.uri);
            } catch (error) {
                Alert.alert('Error', 'Failed to capture image.');
                setShowCamera(false);
            }
        }
    };

    const verifyAndProcess = async (imageUri) => {
        setLoading(true);
        try {
            // 1. Convert to base64
            const base64Image = await FileSystem.readAsStringAsync(imageUri, {
                encoding: 'base64',
            });

            // 2. Delete local temporary image immediately for security
            try {
                await FileSystem.deleteAsync(imageUri, { idempotent: true });
            } catch (err) {
                console.warn('Failed to delete temp image:', err);
            }

            // 3. Verify Identity
            const verifyResult = await verifyTransaction(user.cnic, base64Image);

            if (!verifyResult.success || !verifyResult.data.verified) {
                const emotion = verifyResult.data?.emotion;
                const scores = verifyResult.data?.scores;

                if (emotion && ['fear', 'angry', 'sad'].includes(emotion.toLowerCase())) {
                    navigation.navigate('DuressAlert', {
                        emotion,
                        scores,
                    });
                } else {
                    Alert.alert('Verification Failed', 'Face not recognized. Transaction blocked.');
                }
                return;
            }

            // 4. Process Transfer (if verified)
            const transferResponse = await sendMoney({
                recipient_phone: recipient.trim(),
                amount: parseFloat(amount)
            });

            if (transferResponse.success) {
                navigation.replace('TransferReceipt', {
                    transaction: transferResponse.data,
                    recipientPhone: recipient.trim(),
                    recipientName: transferResponse.data.description?.split('(')[1]?.replace(')', '') || 'Recipient',
                    emotionScores: verifyResult.data.scores // Pass the scores from verification
                });
            } else {
                // Show specific backend error (e.g., Insufficient balance)
                Alert.alert('Transfer Failed', transferResponse.error || 'Transfer could not be processed.');
            }

        } catch (error) {
            console.error('Transfer Process Error:', error);
            // Show more detail in the alert if available
            const errorMsg = error.message || 'An unexpected error occurred during processing.';
            Alert.alert('Error', errorMsg);
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
                    <Text style={styles.cameraInstruction}>Verify Identity for Transfer</Text>
                    <View style={styles.cameraButtons}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setShowCamera(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
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
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#28282B" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Icon name="arrow-left" size={28} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Send Money</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <View style={styles.illustrationContent}>
                        <View style={styles.iconCircle}>
                            <Icon name="account-check" size={80} color="#48A14D" />
                        </View>
                        <Text style={styles.title}>Secure Transfer</Text>
                        <Text style={styles.subtitle}>Face verification required for security</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Recipient Phone Number</Text>
                            <View style={styles.inputContainer}>
                                <Icon name="phone" size={22} color="#606065" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter 11-digit phone number"
                                    autoCapitalize="none"
                                    keyboardType="phone-pad"
                                    maxLength={11}
                                    value={recipient}
                                    onChangeText={setRecipient}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Amount (Rs.)</Text>
                            <View style={styles.inputContainer}>
                                <Icon name="cash-multiple" size={22} color="#606065" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="0.00"
                                    keyboardType="numeric"
                                    value={amount}
                                    onChangeText={setAmount}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.sendButton}
                            onPress={handleTransfer}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#48A14D', '#2D7A32']}
                                style={styles.gradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <View style={styles.btnContent}>
                                        <Text style={styles.sendButtonText}>Verify & Send</Text>
                                        <Icon name="face-recognition" size={24} color="#fff" />
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.quickNote}>
                        <Text style={styles.noteTitle}>Security Note:</Text>
                        <Text style={styles.noteContent}>
                            • You will be asked to verify your identity.{"\n"}
                            • Ensure you are in a well-lit environment.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#28282B',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    illustrationContent: {
        alignItems: 'center',
        marginTop: 20,
    },
    iconCircle: {
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: 'rgba(72,161,77,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    subtitle: {
        fontSize: 14,
        color: '#A0A0A5',
        marginTop: 5,
    },
    form: {
        marginTop: 40,
        paddingHorizontal: 25,
    },
    inputGroup: {
        marginBottom: 25,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#A0A0A5',
        marginBottom: 10,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1.5,
        borderBottomColor: '#4A4A4D',
        paddingBottom: 10,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 18,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    sendButton: {
        marginTop: 10,
        borderRadius: 13,
        overflow: 'hidden',
    },
    gradient: {
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    quickNote: {
        backgroundColor: '#3A3A3D',
        margin: 25,
        padding: 20,
        borderRadius: 18,
    },
    noteTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 10,
    },
    noteContent: {
        fontSize: 13,
        color: '#A0A0A5',
        lineHeight: 20,
    },
    cameraContainer: {
        flex: 1,
        backgroundColor: 'black',
    },
    cameraOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'space-between',
        paddingVertical: 60,
    },
    cameraInstruction: {
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 15,
        marginTop: 40,
    },
    cameraButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 30,
        marginBottom: 40,
    },
    cancelButton: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#fff',
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

export default SendMoneyScreen;
