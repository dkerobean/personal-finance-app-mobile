import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { isSyncedTransaction } from '@/services/api/transactions';
import SyncedTransactionBadge from '@/components/SyncedTransactionBadge';
import type { Transaction } from '@/types/models';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/design';
import { mapIconName } from '@/utils/iconMapping';

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export default function RecentTransactions({ transactions, isLoading }: RecentTransactionsProps) {
  const router = useRouter();
  const getTransactionId = (transaction: Transaction): string =>
    transaction.id || (transaction as any)._id || '';

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  const handleTransactionPress = (transactionId: string) => {
    if (!transactionId) return;
    router.push(`/transactions/${transactionId}`);
  };

  const handleViewAllPress = () => {
    router.push('/transactions');
  };

  // Get the 5 most recent transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Recent Transactions</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </View>
    );
  }

  if (recentTransactions.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Recent Transactions</Text>
        </View>
        <View style={styles.emptyContainer}>
          <MaterialIcons name="receipt-long" size={48} color={COLORS.textTertiary} />
          <Text style={styles.emptyTitle}>No Transactions Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start by adding your first transaction to track your finances
          </Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/transactions/create')}
          >
            <MaterialIcons name="add" size={20} color={COLORS.white} />
            <Text style={styles.addButtonText}>Add Transaction</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Transactions</Text>
        <TouchableOpacity onPress={handleViewAllPress}>
          <Text style={styles.viewAllButton}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.transactionsList}>
        {recentTransactions.map((transaction, index) => (
          <TouchableOpacity
            key={getTransactionId(transaction) || `recent-${index}`}
            style={[
              styles.transactionItem,
              index === recentTransactions.length - 1 && styles.lastTransactionItem,
            ]}
            onPress={() => handleTransactionPress(getTransactionId(transaction))}
            activeOpacity={0.75}
          >
            <View style={styles.transactionLeft}>
              <View style={[
                styles.iconContainer,
                transaction.type === 'income' ? styles.incomeIcon : styles.expenseIcon
              ]}>
                <Ionicons
                  name={mapIconName(transaction.category?.icon_name, transaction.category?.name) as any}
                  size={20}
                  color={COLORS.white}
                />
              </View>
              
              <View style={styles.transactionDetails}>
                <View style={styles.categoryRow}>
                  <Text style={styles.categoryName} numberOfLines={1}>
                    {transaction.category?.name || 'Unknown Category'}
                  </Text>
                  {isSyncedTransaction(transaction) && (
                    <SyncedTransactionBadge size="small" />
                  )}
                </View>
                <Text style={styles.transactionDate}>
                  {formatDate(transaction.transaction_date)}
                </Text>
                {transaction.description && (
                  <Text style={styles.transactionDescription} numberOfLines={1}>
                    {transaction.description}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.transactionRight}>
              <Text style={[
                styles.transactionAmount,
                transaction.type === 'income' ? styles.incomeAmount : styles.expenseAmount
              ]}>
                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount).replace('GH₵', 'GH¢')}
              </Text>
              <MaterialIcons name="chevron-right" size={20} color={COLORS.textTertiary} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 22,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    lineHeight: 26,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  viewAllButton: {
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: 18,
    color: COLORS.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    lineHeight: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xs,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '600',
  },
  transactionsList: {},
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  lastTransactionItem: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  incomeIcon: {
    backgroundColor: COLORS.success,
  },
  expenseIcon: {
    backgroundColor: COLORS.error,
  },
  transactionDetails: {
    flex: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 2,
  },
  categoryName: {
    flexShrink: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  transactionDate: {
    fontSize: TYPOGRAPHY.sizes.xs,
    lineHeight: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  transactionDescription: {
    fontSize: TYPOGRAPHY.sizes.xs,
    lineHeight: 16,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  transactionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  transactionAmount: {
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: 18,
    fontWeight: '700',
    marginRight: 6,
    letterSpacing: -0.3,
  },
  incomeAmount: {
    color: COLORS.success,
  },
  expenseAmount: {
    color: COLORS.error,
  },
});
