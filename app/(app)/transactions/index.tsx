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
  RefreshControl,
  LayoutAnimation,
  UIManager,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { AlertCircle, ArrowDownLeft, ArrowUpRight, Calendar, Receipt, Plus, X, Check } from 'lucide-react-native';
import { useTransactionStore } from '@/stores/transactionStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useUser } from '@clerk/clerk-expo';
import TransactionItem from '@/components/transactions/TransactionItem';
import NotableTransactions from '@/components/transactions/NotableTransactions';
import AverageTransactions from '@/components/transactions/AverageTransactions';
import FilterPills from '@/components/common/FilterPills';
import GradientHeader from '@/components/budgets/GradientHeader';
import type { Transaction } from '@/types/models';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, BUDGET } from '@/constants/design';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/ui/CustomAlert';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TransactionsScreen() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'income' | 'expense'>('all');
  const { alertProps } = useCustomAlert();
  
  const {
    transactions,
    isLoading,
    error,
    loadTransactions,
    clearError,
  } = useTransactionStore();

  const { loadCategories } = useCategoryStore();
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      loadTransactions(user.id);
      loadCategories(user.id);
    }
  }, [user]);

  // Set default selected month to current month when transactions load
  useEffect(() => {
    if (transactions.length > 0 && !selectedMonth) {
      const currentDate = new Date();
      const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long' });
      setSelectedMonth(currentMonth);
    }
  }, [transactions, selectedMonth]);

  const handleTransactionPress = (transactionId: string) => {
    router.push(`/transactions/${transactionId}`);
  };

  const handleCreatePress = () => {
    router.push('/transactions/create');
  };

  const handleRefresh = async (): Promise<void> => {
    if (user) {
      await loadTransactions(user.id);
    }
  };

  const handleGoBack = (): void => {
    router.back();
  };

  // Calculate summary data and group transactions by month
  const summaryData = useMemo(() => {
    // First apply month filter
    let monthFilteredTransactions = selectedMonth
      ? transactions.filter(t => {
          const transactionMonth = new Date(t.transaction_date).toLocaleDateString('en-US', { month: 'long' });
          return transactionMonth === selectedMonth;
        })
      : transactions;

    const totalIncome = monthFilteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = monthFilteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Apply type filter (income/expense/all) only to list rendering
    const visibleTransactions = selectedFilter === 'all'
      ? monthFilteredTransactions
      : monthFilteredTransactions.filter(t => t.type === selectedFilter);

    const totalBalance = totalIncome - totalExpense;
    const expenseRatio = totalIncome > 0 ? Math.min((totalExpense / totalIncome) * 100, 100) : 0;

    // Group transactions by month
    const groupedTransactions = visibleTransactions.reduce((groups, transaction) => {
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

    return {
      totalIncome,
      totalExpense,
      totalBalance,
      expenseRatio,
      filteredTransactions: visibleTransactions,
      groupedTransactions,
      sortedMonths,
    };
  }, [transactions, selectedMonth, selectedFilter]);

  // Handle filter change with animation
  const handleFilterChange = (filter: 'all' | 'income' | 'expense') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedFilter(filter);
  };

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

  const formatCurrency = (amount: number, includeSign = false): string => {
    const prefix = includeSign ? (amount >= 0 ? '+' : '-') : '';
    const value = Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${prefix}GH¢${value}`;
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
          subtitle="Track every cedi in one place"
          onBackPress={handleGoBack}
          onCalendarPress={() => {
            setShowMonthSelector(true);
          }}
          onNotificationPress={() => router.push('/notifications')}
          showCalendar={false}
        />

        {/* Content Card */}
        <View style={styles.contentCard}>
          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={20} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={clearError} style={styles.errorRetryButton}>
                <Text style={styles.errorRetryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.snapshotContainer}>
            <LinearGradient
              colors={['#004B36', COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.snapshotCard}
            >
              <View style={styles.snapshotHeader}>
                <View>
                  <Text style={styles.snapshotLabel}>Monthly Snapshot</Text>
                  <Text style={styles.snapshotMonth}>{selectedMonth || 'All Transactions'}</Text>
                </View>
                <View style={styles.netPill}>
                  <Text style={styles.netPillTitle}>Net</Text>
                  <Text style={styles.netPillValue}>{formatCurrency(summaryData.totalBalance, true)}</Text>
                </View>
              </View>

              <View style={styles.summaryCardsRow}>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryCardIcon}>
                    <ArrowDownLeft size={16} color={COLORS.white} />
                  </View>
                  <Text style={styles.summaryCardLabel}>Income</Text>
                  <Text style={styles.summaryCardAmount}>{formatCurrency(summaryData.totalIncome)}</Text>
                </View>
                <View style={styles.summaryCard}>
                  <View style={[styles.summaryCardIcon, styles.summaryCardIconExpense]}>
                    <ArrowUpRight size={16} color={COLORS.white} />
                  </View>
                  <Text style={styles.summaryCardLabel}>Expense</Text>
                  <Text style={styles.summaryCardAmount}>{formatCurrency(summaryData.totalExpense)}</Text>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.max(summaryData.expenseRatio, 4)}%` }]} />
              </View>

              <View style={styles.progressMeta}>
                <Text style={styles.progressText}>
                  Spent {summaryData.expenseRatio.toFixed(0)}% of monthly income
                </Text>
                <Text style={styles.progressTextStrong}>
                  {summaryData.totalBalance >= 0 ? 'Positive cash flow' : 'Needs review'}
                </Text>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.transactionsCard}>
            <View style={styles.transactionsCardHeader}>
              <View>
                <Text style={styles.transactionsTitle}>Transactions</Text>
                <Text style={styles.transactionsSubtitle}>
                  {summaryData.filteredTransactions.length} entries
                </Text>
              </View>
              <TouchableOpacity
                style={styles.calendarChip}
                onPress={() => setShowMonthSelector(true)}
                activeOpacity={0.85}
              >
                <Calendar size={16} color={COLORS.primary} />
                <Text style={styles.calendarChipText}>{selectedMonth || 'All Months'}</Text>
              </TouchableOpacity>
            </View>

            <FilterPills 
              activeFilter={selectedFilter}
              onFilterChange={handleFilterChange}
            />

            <View style={styles.transactionsList}>
              {summaryData.filteredTransactions.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Receipt size={56} color={COLORS.textTertiary} />
                  <Text style={styles.emptyText}>
                    {selectedMonth ? `No transactions in ${selectedMonth}` : 'No transactions yet.'}
                  </Text>
                </View>
              ) : (
                <>
                  {summaryData.sortedMonths.map((month) => (
                    <View key={month} style={styles.monthGroup}>
                      {!selectedMonth && (
                        <Text style={styles.monthLabel}>{month}</Text>
                      )}
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
        <Plus size={24} color={COLORS.white} />
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
                <X size={24} color="#666" />
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
                  <Check size={20} color={COLORS.primary} />
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
                    <Check size={20} color={COLORS.primary} />
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
    paddingTop: SPACING.md,
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
  snapshotContainer: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  snapshotCard: {
    borderRadius: 28,
    padding: SPACING.lg,
    ...SHADOWS.lg,
  },
  snapshotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  snapshotLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  snapshotMonth: {
    marginTop: 4,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  netPill: {
    backgroundColor: 'rgba(4, 45, 34, 0.5)',
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minWidth: 132,
  },
  netPillTitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: 'rgba(255,255,255,0.78)',
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  netPillValue: {
    marginTop: 2,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  summaryCardsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  summaryCardIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(22, 163, 74, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  summaryCardIconExpense: {
    backgroundColor: 'rgba(239, 68, 68, 0.4)',
  },
  summaryCardLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: 'rgba(255,255,255,0.88)',
    marginBottom: 4,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  summaryCardAmount: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  progressTrack: {
    height: 10,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.24)',
    marginTop: SPACING.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  progressMeta: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  progressText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  progressTextStrong: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  transactionsCard: {
    marginHorizontal: SPACING.lg,
    borderRadius: 28,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    ...SHADOWS.md,
    marginBottom: SPACING.lg,
  },
  transactionsCardHeader: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.md,
  },
  transactionsTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  transactionsSubtitle: {
    marginTop: 2,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  calendarChip: {
    borderRadius: 99,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 109, 79, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primaryLight,
  },
  calendarChipText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  transactionsList: {
    marginBottom: SPACING.xs,
  },
  monthGroup: {
    marginBottom: SPACING.sm,
  },
  monthLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    color: COLORS.textTertiary,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.sizes.md,
    marginTop: SPACING.md,
    fontWeight: TYPOGRAPHY.weights.medium,
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
