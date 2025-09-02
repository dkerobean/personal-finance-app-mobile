import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet,
  SafeAreaView,
  Modal,
  RefreshControl 
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
import GradientHeader from '@/components/budgets/GradientHeader';
import type { Transaction, TransactionWithAccount } from '@/types/models';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, BUDGET } from '@/constants/design';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/ui/CustomAlert';

export default function TransactionsScreen() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const { alert, alertProps } = useCustomAlert();
  
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
      alert(
        'Cannot Delete Synced Transaction',
        `This transaction was automatically synced from your ${platformName} account and cannot be deleted. You can only change its category.`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    alert(
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
      alert('Error', error);
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

  const handleRefresh = async (): Promise<void> => {
    await loadTransactions();
  };

  const handleGoBack = (): void => {
    router.back();
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
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Gradient Header Section */}
        <GradientHeader
          title="Transactions"
          onBackPress={handleGoBack}
          onCalendarPress={() => {
            setShowMonthSelector(true);
          }}
          onNotificationPress={() => {
            // Handle notification press
          }}
        />

        {/* Content Card */}
        <View style={styles.contentCard}>
          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={20} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={clearError} style={styles.errorRetryButton}>
                <Text style={styles.errorRetryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Total Balance Card */}
          <TotalBalanceCard totalBalance={summaryData.totalBalance} />

          {/* Summary Cards */}
          <TransactionSummaryCards 
            totalIncome={summaryData.totalIncome}
            totalExpense={summaryData.totalExpense}
          />

          {/* Month Header with Calendar Icon */}
          <View style={styles.monthHeaderContainer}>
            <Text style={styles.monthHeaderText}>
              {selectedMonth || 'All Transactions'}
            </Text>
            <TouchableOpacity 
              style={styles.calendarIconButton}
              onPress={() => setShowMonthSelector(true)}
            >
              <MaterialIcons name="event" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* Transactions List */}
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

          {/* Notable Transactions */}
          <NotableTransactions 
            transactions={summaryData.filteredTransactions}
            onTransactionPress={handleTransactionPress}
          />

          {/* Average Transactions */}
          <View style={styles.bottomSection}>
            <AverageTransactions 
              transactions={summaryData.filteredTransactions}
              selectedMonth={selectedMonth}
            />
          </View>

          {/* Bottom spacing for navigation */}
          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleCreatePress}>
        <MaterialIcons name="add" size={24} color={COLORS.white} />
      </TouchableOpacity>

      {/* Month Selection Modal */}
      <Modal
        visible={showMonthSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMonthSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Month</Text>
              <TouchableOpacity onPress={() => setShowMonthSelector(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.monthList}>
              {/* All Transactions Option */}
              <TouchableOpacity
                style={[
                  styles.monthItem,
                  !selectedMonth && styles.monthItemSelected
                ]}
                onPress={() => {
                  setSelectedMonth('');
                  setShowMonthSelector(false);
                }}
              >
                <Text style={[
                  styles.monthText,
                  !selectedMonth && styles.monthTextSelected
                ]}>
                  All Transactions
                </Text>
                {!selectedMonth && (
                  <MaterialIcons name="check" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
              
              {/* Available Months */}
              {availableMonths.map((month) => (
                <TouchableOpacity
                  key={month}
                  style={[
                    styles.monthItem,
                    selectedMonth === month && styles.monthItemSelected
                  ]}
                  onPress={() => {
                    setSelectedMonth(month);
                    setShowMonthSelector(false);
                  }}
                >
                  <Text style={[
                    styles.monthText,
                    selectedMonth === month && styles.monthTextSelected
                  ]}>
                    {month}
                  </Text>
                  {selectedMonth === month && (
                    <MaterialIcons name="check" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      <CustomAlert {...alertProps} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BUDGET.gradientColors.start,
  },
  mainScrollView: {
    flex: 1,
  },
  contentCard: {
    backgroundColor: COLORS.backgroundContent,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -20,
    paddingTop: 20,
    flex: 1,
  },
  errorContainer: {
    backgroundColor: COLORS.backgroundCard,
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    ...SHADOWS.sm,
  },
  errorText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
    marginRight: SPACING.md,
  },
  errorRetryButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  errorRetryText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  monthHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.md,
  },
  monthHeaderText: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  calendarIconButton: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
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
    marginBottom: SPACING.md,
  },
  bottomSpacing: {
    height: 150, // Account for bottom navigation
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.backgroundCard,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  monthList: {
    maxHeight: 300,
  },
  monthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  monthItemSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  monthText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
  },
  monthTextSelected: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});