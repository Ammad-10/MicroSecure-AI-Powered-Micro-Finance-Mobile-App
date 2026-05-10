import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    SafeAreaView,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { getCurrentUser, getTransactions, logout } from '../services/api';

const DashboardScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    const fetchData = useCallback(async () => {
        const userRes = await getCurrentUser();
        const transRes = await getTransactions();

        if (userRes.success) {
            setUser(userRes.data);
        }

        if (transRes.success) {
            setTransactions(transRes.data.slice(0, 5)); // Only show top 5
        }

        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        fetchData();
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleLogout = async () => {
        await logout();
        navigation.replace('Welcome');
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#48A14D" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#28282B" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.welcomeText}>Hello,</Text>
                    <Text style={styles.userName}>{user?.name || 'User'}</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Icon name="logout" size={24} color="#E53935" />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#48A14D" />
                }
            >
              <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                {/* Balance Card */}
                <View style={styles.balanceCardWrapper}>
                <LinearGradient
                    colors={['#48A14D', '#2D7A32']}
                    style={styles.balanceCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.decorCircle1} />
                    <View style={styles.decorCircle2} />
                    <View style={styles.balanceInfo}>
                        <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
                        <Text style={styles.balanceAmount}>Rs. {user?.balance?.toLocaleString() || '0'}</Text>
                    </View>
                    <View style={styles.cardInfo}>
                        <Text style={styles.cardHolder}>{user?.username}</Text>
                        <Icon name="chip" size={30} color="rgba(255,255,255,0.7)" />
                    </View>
                </LinearGradient>
                </View>

                {/* Quick Actions */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionsGrid}>
                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => navigation.navigate('SendMoney')}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: 'rgba(72,161,77,0.15)' }]}>
                                <Icon name="send-outline" size={28} color="#48A14D" />
                            </View>
                            <Text style={styles.actionLabel}>Send Money</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => navigation.navigate('BillPayment')}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,167,38,0.15)' }]}>
                                <Icon name="receipt-outline" size={28} color="#FFA726" />
                            </View>
                            <Text style={styles.actionLabel}>Pay Bills</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => navigation.navigate('TransactionHistory')}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: 'rgba(72,161,77,0.15)' }]}>
                                <Icon name="history" size={28} color="#48A14D" />
                            </View>
                            <Text style={styles.actionLabel}>History</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionItem}>
                            <View style={[styles.iconContainer, { backgroundColor: 'rgba(160,160,165,0.15)' }]}>
                                <Icon name="qrcode-scan" size={28} color="#A0A0A5" />
                            </View>
                            <Text style={styles.actionLabel}>Scan QR</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Recent Transactions */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Transactions</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory')}>
                            <Text style={styles.viewAllText}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    {transactions.length > 0 ? (
                        transactions.map((item) => {
                            const isSent = item.type.includes('sent');
                            const isBill = item.type === 'bill_payment';
                            const isExpense = isSent || isBill;
                            let iconBg = 'rgba(72,161,77,0.15)';
                            let iconColor = '#48A14D';
                            let amountColor = '#48A14D';
                            let iconName = 'arrow-down';
                            let label = 'Money Received';
                            if (isSent) { iconBg = 'rgba(229,57,53,0.15)'; iconColor = '#E53935'; amountColor = '#E53935'; iconName = 'arrow-up'; label = 'Money Sent'; }
                            else if (isBill) { iconBg = 'rgba(255,167,38,0.15)'; iconColor = '#FFA726'; amountColor = '#FFA726'; iconName = 'receipt'; label = 'Bill Payment'; }
                            return (
                                <View key={item.id} style={styles.transactionItem}>
                                    <View style={styles.transactionLeft}>
                                        <View style={[styles.transactionIconIcon, { backgroundColor: iconBg }]}>
                                            <Icon name={iconName} size={20} color={iconColor} />
                                        </View>
                                        <View>
                                            <Text style={styles.transactionTitle}>{label}</Text>
                                            <Text style={styles.transactionDate}>
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.transactionAmount, { color: amountColor }]}>
                                        {isExpense ? '-' : '+'}Rs. {item.amount}
                                    </Text>
                                </View>
                            );
                        })
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Icon name="history" size={40} color="#606065" />
                            <Text style={styles.emptyText}>No recent transactions</Text>
                        </View>
                    )}
                </View>
              </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#28282B',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#28282B',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    welcomeText: {
        fontSize: 14,
        color: '#A0A0A5',
    },
    userName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    logoutButton: {
        padding: 8,
    },
    balanceCardWrapper: {
        marginHorizontal: 20,
        marginBottom: 24,
    },
    balanceCard: {
        padding: 22,
        borderRadius: 22,
        elevation: 8,
        shadowColor: '#48A14D',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        overflow: 'hidden',
    },
    decorCircle1: {
        position: 'absolute',
        top: -30,
        right: -30,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    decorCircle2: {
        position: 'absolute',
        bottom: -20,
        left: -20,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    balanceInfo: {
        marginBottom: 30,
    },
    balanceLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    balanceAmount: {
        color: '#fff',
        fontSize: 30,
        fontWeight: '700',
        marginTop: 6,
    },
    cardInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardHolder: {
        color: '#fff',
        fontSize: 15,
        opacity: 0.9,
    },
    sectionContainer: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    viewAllText: {
        color: '#48A14D',
        fontWeight: '600',
        fontSize: 14,
    },
    actionsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
    },
    actionItem: {
        width: '23%',
        alignItems: 'center',
        backgroundColor: '#3A3A3D',
        borderRadius: 16,
        padding: 16,
    },
    iconContainer: {
        width: 55,
        height: 55,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: 12,
        color: '#FFFFFF',
        textAlign: 'center',
        fontWeight: '600',
    },
    transactionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#4A4A4D',
    },
    transactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    transactionIconIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    transactionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    transactionDate: {
        fontSize: 12,
        color: '#606065',
        marginTop: 2,
    },
    transactionAmount: {
        fontSize: 15,
        fontWeight: '700',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyText: {
        color: '#606065',
        marginTop: 10,
        fontSize: 14,
    },
});

export default DashboardScreen;
