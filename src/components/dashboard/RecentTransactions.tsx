import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
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
    router.push(`/transactions/${transactionId}`);
  };

  const handleViewAllPress = () => {
    router.push('/transactions');
  };

  // Get the 5 most recent transactions
  const recentTransactions = transactions
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

      <ScrollView style={styles.transactionsList} showsVerticalScrollIndicator={false}>
        {recentTransactions.map((transaction) => (
          <TouchableOpacity
            key={transaction.id}
            style={styles.transactionItem}
            onPress={() => handleTransactionPress(transaction.id)}
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
                  <Text style={styles.categoryName}>
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
                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
              </Text>
              <MaterialIcons name="chevron-right" size={20} color={COLORS.textTertiary} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    ...SHADOWS.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  viewAllButton: {
    fontSize: TYPOGRAPHY.sizes.sm,
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
    color: COLORS.textTertiary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
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
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
  },
  transactionsList: {
    maxHeight: 320,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
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
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  categoryName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  transactionDate: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
  },
  transactionDescription: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  transactionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionAmount: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    marginRight: SPACING.xs,
  },
  incomeAmount: {
    color: COLORS.success,
  },
  expenseAmount: {
    color: COLORS.error,
  },
});