import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { getTransactions } from '../services/api';

const TransactionHistoryScreen = ({ navigation }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');

    const fetchTransactions = useCallback(async () => {
        const response = await getTransactions();
        if (response.success) {
            setTransactions(response.data);
        }
        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTransactions();
    };

    const FILTERS = ['All', 'Sent', 'Received', 'Bills'];

    const filteredTransactions = transactions.filter((item) => {
        if (activeFilter === 'All') return true;
        if (activeFilter === 'Sent') return item.type === 'transfer_sent';
        if (activeFilter === 'Received') return item.type === 'transfer_received';
        if (activeFilter === 'Bills') return item.type === 'bill_payment';
        return true;
    });

    const renderItem = ({ item }) => {
        const isExpense = item.type.includes('sent') || item.type === 'bill_payment';

        let iconName = 'receipt';
        let iconColor = '#FFA726';
        let title = 'Bill Payment';

        if (item.type === 'transfer_sent') {
            iconName = 'arrow-up';
            iconColor = '#E53935';
            title = 'Sent Money';
        } else if (item.type === 'transfer_received') {
            iconName = 'arrow-down';
            iconColor = '#48A14D';
            title = 'Received Money';
        }

        return (
            <View style={styles.transactionItem}>
                <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
                    <Icon name={iconName} size={24} color={iconColor} />
                </View>
                <View style={styles.transactionDetails}>
                    <View style={styles.row}>
                        <Text style={styles.transactionTitle}>{title}</Text>
                        <Text style={[styles.transactionAmount, { color: isExpense ? '#E53935' : '#48A14D' }]}>
                            {isExpense ? '-' : '+'}Rs. {item.amount.toLocaleString()}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.transactionDesc} numberOfLines={1}>{item.description}</Text>
                        <Text style={styles.transactionDate}>
                            {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </Text>
                    </View>
                </View>
            </View>
        );
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
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={28} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Transaction History</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.filterRow}>
                {FILTERS.map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterTab, activeFilter === f && styles.filterTabActive]}
                        onPress={() => setActiveFilter(f)}
                    >
                        <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredTransactions}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#48A14D" />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="history" size={60} color="#606065" />
                        <Text style={styles.emptyText}>No transactions found</Text>
                    </View>
                }
            />
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
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#4A4A4D',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        paddingVertical: 10,
        gap: 8,
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#3A3A3D',
    },
    filterTabActive: {
        backgroundColor: '#48A14D',
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#A0A0A5',
    },
    filterTextActive: {
        color: '#fff',
    },
    listContent: {
        paddingVertical: 10,
    },
    transactionItem: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 15,
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    transactionDetails: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    transactionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '700',
    },
    transactionDesc: {
        fontSize: 13,
        color: '#A0A0A5',
        marginTop: 2,
        flex: 1,
        marginRight: 10,
    },
    transactionDate: {
        fontSize: 12,
        color: '#606065',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 16,
        color: '#606065',
        marginTop: 15,
    },
});

export default TransactionHistoryScreen;
