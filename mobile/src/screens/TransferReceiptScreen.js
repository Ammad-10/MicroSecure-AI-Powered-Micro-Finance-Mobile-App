import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Animated,
    Dimensions,
    ScrollView,
    SafeAreaView,
    Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TransferReceiptScreen = ({ navigation, route }) => {
    const { transaction, recipientPhone, recipientName } = route.params;

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Transfer Receipt\nAmount: Rs. ${transaction.amount}\nTo: ${recipientName} (${recipientPhone})\nRef: ${transaction.id}\nDate: ${new Date(transaction.created_at).toLocaleString()}`,
            });
        } catch (error) {
            console.error('Error sharing receipt:', error);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-PK', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#28282B" />
            <LinearGradient colors={['#28282B', '#28282B']} style={styles.background}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <Animated.View style={[styles.receiptCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        {/* Success Icon */}
                        <View style={styles.iconContainer}>
                            <LinearGradient colors={['#48A14D', '#2D7A32']} style={styles.iconGradient}>
                                <Icon name="check" size={40} color="#fff" />
                            </LinearGradient>
                        </View>

                        <Text style={styles.successTitle}>Transfer Successful</Text>
                        <Text style={styles.amountText}>Rs. {transaction.amount.toLocaleString()}</Text>

                        <View style={styles.divider} />

                        <View style={styles.detailsContainer}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Recipient</Text>
                                <Text style={styles.detailValue}>{recipientName || 'User'}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Phone Number</Text>
                                <Text style={styles.detailValue}>{recipientPhone}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Date & Time</Text>
                                <Text style={styles.detailValue}>{formatDate(transaction.created_at)}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Reference ID</Text>
                                <Text style={styles.detailValue}>#{transaction.id}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Status</Text>
                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusText}>Completed</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* AI Emotion Analysis Section */}
                        <View style={styles.emotionSection}>
                            <View style={styles.sectionHeader}>
                                <Icon name="brain" size={20} color="#48A14D" />
                                <Text style={styles.sectionTitle}>AI Emotion Analysis</Text>
                            </View>

                            {route.params.emotionScores ? (
                                Object.entries(route.params.emotionScores)
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 3) // Show top 3 emotions
                                    .map(([emotion, score]) => (
                                        <View key={emotion} style={styles.emotionRow}>
                                            <View style={styles.emotionInfo}>
                                                <Text style={styles.emotionLabel}>{emotion.charAt(0).toUpperCase() + emotion.slice(1)}</Text>
                                                <Text style={styles.emotionPercent}>{score.toFixed(1)}%</Text>
                                            </View>
                                            <View style={styles.progressBarBg}>
                                                <View style={[styles.progressBarFill, { width: `${score}%`, backgroundColor: getEmotionColor(emotion) }]} />
                                            </View>
                                        </View>
                                    ))
                            ) : (
                                <Text style={styles.noData}>Analysis data unavailable</Text>
                            )}
                        </View>

                        <View style={styles.divider} />
                    </Animated.View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                            <Icon name="share-variant" size={24} color="#fff" />
                            <Text style={styles.buttonText}>Share Receipt</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.doneButton}
                            onPress={() => navigation.replace('Dashboard')}
                        >
                            <Text style={styles.doneButtonText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#28282B' },
    background: { flex: 1 },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 40,
    },
    receiptCard: {
        backgroundColor: '#3A3A3D',
        borderRadius: 24,
        padding: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    iconContainer: {
        marginTop: -55,
        marginBottom: 15,
    },
    iconGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#3A3A3D',
    },
    successTitle: {
        fontSize: 18,
        color: '#A0A0A5',
        fontWeight: '600',
        marginBottom: 5,
    },
    amountText: {
        fontSize: 36,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 25,
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#4A4A4D',
        marginVertical: 20,
    },
    detailsContainer: {
        width: '100%',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    detailLabel: {
        fontSize: 14,
        color: '#A0A0A5',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    statusBadge: {
        backgroundColor: 'rgba(72,161,77,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 12,
    },
    statusText: {
        color: '#48A14D',
        fontSize: 12,
        fontWeight: '700',
    },
    footerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    footerText: {
        fontSize: 12,
        color: '#606065',
    },
    emotionSection: {
        width: '100%',
        paddingHorizontal: 5,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    emotionRow: {
        marginBottom: 12,
    },
    emotionInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    emotionLabel: {
        fontSize: 13,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    emotionPercent: {
        fontSize: 12,
        color: '#A0A0A5',
        fontWeight: '700',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#4A4A4D',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    noData: {
        fontSize: 12,
        color: '#606065',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    buttonContainer: {
        marginTop: 30,
        gap: 15,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingVertical: 15,
        borderRadius: 13,
        gap: 10,
        borderWidth: 1,
        borderColor: '#4A4A4D',
    },
    doneButton: {
        backgroundColor: '#48A14D',
        paddingVertical: 15,
        borderRadius: 13,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    doneButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});

const getEmotionColor = (emotion) => {
    switch (emotion.toLowerCase()) {
        case 'happy': return '#48A14D';
        case 'neutral': return '#48A14D';
        case 'surprise': return '#FFA726';
        case 'sad': return '#42A5F5';
        case 'angry': return '#E53935';
        case 'fear': return '#AB47BC';
        default: return '#606065';
    }
};

export default TransferReceiptScreen;
