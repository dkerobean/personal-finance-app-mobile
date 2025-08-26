import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  StyleSheet,
  SafeAreaView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTransactionStore } from '@/stores/transactionStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { isSyncedTransaction } from '@/services/api/transactions';
import TransactionSummaryCards from '@/components/transactions/TransactionSummaryCards';
import TotalBalanceCard from '@/components/transactions/TotalBalanceCard';
import TransactionItem from '@/components/transactions/TransactionItem';
import NotableTransactions from '@/components/transactions/NotableTransactions';
import AverageTransactions from '@/components/transactions/AverageTransactions';
import type { Transaction, TransactionWithAccount } from '@/types/models';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/design';

export default function TransactionsScreen() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  
  const {
    transactions,
    isLoading,
    error,
    sortOrder,
    loadTransactions,
    deleteTransaction,
    setSortOrder,
    clearError,
  } = useTransactionStore();

  const { loadCategories } = useCategoryStore();

  useEffect(() => {
    loadTransactions();
    loadCategories();
  }, []);

  // Set default selected month to current month when transactions load
  useEffect(() => {
    if (transactions.length > 0 && !selectedMonth) {
      const currentDate = new Date();
      const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long' });
      setSelectedMonth(currentMonth);
    }
  }, [transactions, selectedMonth]);

  const handleDeletePress = (transaction: Transaction) => {
    if (isSyncedTransaction(transaction)) {
      const platformName = getTransactionPlatformName(transaction);
      Alert.alert(
        'Cannot Delete Synced Transaction',
        `This transaction was automatically synced from your ${platformName} account and cannot be deleted. You can only change its category.`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete this ${transaction.type} of $${transaction.amount.toFixed(2)}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => handleDeleteConfirm(transaction.id)
        }
      ]
    );
  };

  const handleDeleteConfirm = async (transactionId: string) => {
    const success = await deleteTransaction(transactionId);
    if (!success && error) {
      Alert.alert('Error', error);
    }
  };

  const handleTransactionPress = (transactionId: string) => {
    router.push(`/transactions/${transactionId}`);
  };

  const handleCreatePress = () => {
    router.push('/transactions/create');
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  // Calculate summary data and group transactions by month
  const summaryData = useMemo(() => {
    const filteredTransactions = selectedMonth
      ? transactions.filter(t => {
          const transactionMonth = new Date(t.transaction_date).toLocaleDateString('en-US', { month: 'long' });
          return transactionMonth === selectedMonth;
        })
      : transactions;

    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalBalance = totalIncome - totalExpense;

    // Group transactions by month
    const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
      const month = new Date(transaction.transaction_date).toLocaleDateString('en-US', { month: 'long' });
      if (!groups[month]) {
        groups[month] = [];
      }
      groups[month].push(transaction);
      return groups;
    }, {} as Record<string, Transaction[]>);

    // Sort months by most recent first
    const sortedMonths = Object.keys(groupedTransactions).sort((a, b) => {
      const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      return monthOrder.indexOf(b) - monthOrder.indexOf(a);
    });

    return { totalIncome, totalExpense, totalBalance, filteredTransactions, groupedTransactions, sortedMonths };
  }, [transactions, selectedMonth]);

  // Get available months from transactions
  const availableMonths = useMemo(() => {
    const monthsWithDates = transactions.map(t => {
      const date = new Date(t.transaction_date);
      return {
        month: date.toLocaleDateString('en-US', { month: 'long' }),
        year: date.getFullYear(),
        monthIndex: date.getMonth(),
      };
    });

    // Remove duplicates by month-year combination and sort by most recent
    const uniqueMonths = Array.from(
      new Map(
        monthsWithDates.map(item => [`${item.month}-${item.year}`, item])
      ).values()
    );

    return uniqueMonths
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.monthIndex - a.monthIndex;
      })
      .slice(0, 6) // Show max 6 recent months
      .map(item => item.month);
  }, [transactions]);

  // Helper functions for platform-specific information
  const getTransactionPlatformName = (transaction: Transaction): string => {
    if (!isSyncedTransaction(transaction)) return 'Manual';
    
    // Check platform_source first (new field)
    if (transaction.platform_source === 'mono') return 'bank';
    if (transaction.platform_source === 'mtn_momo') return 'MTN MoMo';
    
    // Fallback to checking identifiers
    if (transaction.mono_transaction_id) return 'bank';
    if (transaction.mtn_reference_id || transaction.momo_external_id) return 'MTN MoMo';
    
    return 'synced account';
  };

  const getTransactionAccountType = (transaction: Transaction): 'bank' | 'mobile_money' | 'manual' => {
    if (!isSyncedTransaction(transaction)) return 'manual';
    
    // Check platform_source first (new field)
    if (transaction.platform_source === 'mono') return 'bank';
    if (transaction.platform_source === 'mtn_momo') return 'mobile_money';
    
    // Fallback to checking identifiers
    if (transaction.mono_transaction_id) return 'bank';
    if (transaction.mtn_reference_id || transaction.momo_external_id) return 'mobile_money';
    
    return 'manual';
  };

  const getInstitutionDisplayName = (transaction: Transaction): string => {
    if (!isSyncedTransaction(transaction)) return 'Manual Entry';
    return transaction.institution_name || 'Unknown Institution';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatAmount = (amount: number, type: 'income' | 'expense') => {
    const sign = type === 'income' ? '+' : '-';
    return `${sign}$${amount.toFixed(2)}`;
  };

  if (isLoading && transactions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back-ios" size={19} color={COLORS.primaryLight} />
        </TouchableOpacity>
        <Text style={styles.title}>Transaction</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <MaterialIcons name="notifications-none" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError} style={styles.errorCloseButton}>
              <MaterialIcons name="close" size={20} color="#dc3545" />
            </TouchableOpacity>
          </View>
        )}

        {/* Summary Cards */}
        <TransactionSummaryCards 
          totalIncome={summaryData.totalIncome}
          totalExpense={summaryData.totalExpense}
        />

        {/* Total Balance Card */}
        <TotalBalanceCard totalBalance={summaryData.totalBalance} />

        {/* Month Filter - Hidden for now, calendar icon handles selection */}

        {/* Light Background Container */}
        <View style={styles.transactionsContainer}>
          {/* Calendar Icon - Top Right */}
          <TouchableOpacity 
            style={styles.calendarIconButton}
            onPress={() => {
              const currentIndex = availableMonths.indexOf(selectedMonth);
              const nextIndex = (currentIndex + 1) % availableMonths.length;
              setSelectedMonth(availableMonths[nextIndex] || availableMonths[0]);
            }}
          >
            <MaterialIcons name="event" size={24} color={COLORS.white} />
          </TouchableOpacity>

          {/* All Transactions List - Moved to top */}
          <View style={styles.transactionsList}>
            {summaryData.filteredTransactions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="receipt-long" size={64} color={COLORS.textTertiary} />
                <Text style={styles.emptyText}>
                  {selectedMonth ? `No transactions in ${selectedMonth}` : 'No transactions yet.'}{'\n'}
                  {!selectedMonth && 'Add your first transaction to get started.'}
                </Text>
              </View>
            ) : (
              <>
                {summaryData.sortedMonths.map((month) => (
                  <View key={month} style={styles.monthGroup}>
                    <Text style={styles.monthHeader}>{month}</Text>
                    {summaryData.groupedTransactions[month].map((transaction, index) => (
                      <TransactionItem
                        key={transaction.id}
                        transaction={transaction}
                        onPress={handleTransactionPress}
                        showSeparator={index < summaryData.groupedTransactions[month].length - 1}
                      />
                    ))}
                  </View>
                ))}
              </>
            )}
          </View>

          {/* Notable Transactions - Moved to bottom */}
          <NotableTransactions 
            transactions={summaryData.filteredTransactions}
            onTransactionPress={handleTransactionPress}
          />

          {/* Average Transactions - Moved to bottom */}
          <View style={styles.bottomSection}>
            <AverageTransactions 
              transactions={summaryData.filteredTransactions}
              selectedMonth={selectedMonth}
            />
          </View>
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleCreatePress}>
        <MaterialIcons name="add" size={24} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundMain,
    paddingTop: 44, // Status bar height
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 37,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
  },
  notificationButton: {
    width: 30,
    height: 30,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 37,
    marginVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#dc3545',
    flex: 1,
  },
  errorCloseButton: {
    padding: 4,
  },
  transactionsContainer: {
    marginTop: 30,
    marginHorizontal: 0,
    backgroundColor: COLORS.primaryLight, // Light mint/cream background
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 30,
    paddingHorizontal: 0,
    minHeight: 400,
    position: 'relative',
  },
  calendarIconButton: {
    position: 'absolute',
    top: 20,
    right: 30,
    width: 40,
    height: 40,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  transactionsList: {
    marginBottom: 20, // Reduced since we have sections below
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
    paddingHorizontal: 37,
    marginBottom: SPACING.md,
  },
  monthGroup: {
    marginBottom: 30,
  },
  monthHeader: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
    paddingHorizontal: 37,
    marginBottom: 20,
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 37,
  },
  emptyText: {
    color: COLORS.textTertiary,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.sizes.lg,
    marginTop: 16,
    fontFamily: 'Poppins',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    fontFamily: 'Poppins',
  },
  bottomSection: {
    marginBottom: 140, // Space for FAB and bottom navigation
  },
  fab: {
    position: 'absolute',
    right: 37,
    bottom: 120, // Above bottom navigation
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});