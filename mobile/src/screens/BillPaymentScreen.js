import React, { useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { payBill } from '../services/api';

const BillPaymentScreen = ({ navigation }) => {
    const [psid, setPsid] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        if (psid.length !== 13) {
            Alert.alert('Error', 'PSID must be exactly 13 digits.');
            return;
        }

        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            Alert.alert('Error', 'Please enter a valid amount.');
            return;
        }

        setLoading(true);
        try {
            const response = await payBill({
                psid: psid,
                amount: parseFloat(amount)
            });

            if (response.success) {
                Alert.alert(
                    'Success',
                    `Bill payment of Rs. ${amount} for PSID ${psid} was successful.`,
                    [{ text: 'OK', onPress: () => navigation.replace('Dashboard') }]
                );
            } else {
                Alert.alert('Payment Failed', response.error);
            }
        } catch (error) {
            console.error('Payment error:', error);
            Alert.alert('Error', 'An unexpected error occurred during payment.');
        } finally {
            setLoading(false);
        }
    };

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
                        <Text style={styles.headerTitle}>Pay Bill</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <View style={styles.illustrationContent}>
                        <View style={styles.iconCircle}>
                            <Icon name="receipt" size={60} color="#48A14D" />
                        </View>
                        <Text style={styles.title}>Utility Bill Payment</Text>
                        <Text style={styles.subtitle}>Enter your 13-digit PSID number from your bill</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>PSID Number</Text>
                            <View style={styles.inputContainer}>
                                <Icon name="numeric" size={22} color="#606065" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 1000123456789"
                                    keyboardType="numeric"
                                    maxLength={13}
                                    value={psid}
                                    onChangeText={setPsid}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Amount (Rs.)</Text>
                            <View style={styles.inputContainer}>
                                <Icon name="cash" size={22} color="#606065" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter Amount"
                                    keyboardType="numeric"
                                    value={amount}
                                    onChangeText={setAmount}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.payButton}
                            onPress={handlePayment}
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
                                    <Text style={styles.payButtonText}>Proceed to Pay</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.noteContainer}>
                        <Icon name="information-outline" size={20} color="#606065" />
                        <Text style={styles.noteText}>
                            Payments are processed instantly. Please double check the PSID before proceeding.
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
        paddingHorizontal: 40,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(72,161,77,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 15,
        color: '#A0A0A5',
        textAlign: 'center',
        lineHeight: 22,
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
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3A3A3D',
        borderRadius: 11,
        paddingHorizontal: 15,
        height: 52,
        borderWidth: 1,
        borderColor: '#4A4A4D',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#FFFFFF',
    },
    payButton: {
        marginTop: 10,
        borderRadius: 13,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#48A14D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    gradient: {
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
    },
    payButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    noteContainer: {
        flexDirection: 'row',
        marginTop: 30,
        paddingHorizontal: 25,
        alignItems: 'center',
    },
    noteText: {
        fontSize: 13,
        color: '#606065',
        marginLeft: 10,
        flex: 1,
    },
});

export default BillPaymentScreen;
