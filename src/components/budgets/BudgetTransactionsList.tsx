import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TRANSACTIONS, TYPOGRAPHY, SPACING } from '@/constants/design';
import type { Transaction } from '@/types/models';

interface BudgetTransactionsListProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

interface TransactionItemProps {
  transaction: Transaction;
}

const BudgetTransactionItem = ({ transaction }: TransactionItemProps): React.ReactElement => {
  const getCategoryIconColor = (categoryName?: string): string => {
    if (!categoryName) return TRANSACTIONS.categoryColors.food;
    
    const category = categoryName.toLowerCase();
    if (category.includes('salary')) return TRANSACTIONS.categoryColors.salary;
    if (category.includes('groceries')) return TRANSACTIONS.categoryColors.groceries;
    if (category.includes('rent')) return TRANSACTIONS.categoryColors.rent;
    if (category.includes('transport') || category.includes('fuel')) return TRANSACTIONS.categoryColors.transport;
    if (category.includes('food') || category.includes('dinner')) return TRANSACTIONS.categoryColors.food;
    
    return TRANSACTIONS.categoryColors.food; // Default
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: '2-digit',
    });
  };

  const formatAmount = (amount: number, type: 'income' | 'expense'): string => {
    const sign = type === 'income' ? '' : '-';
    return `${sign}₵${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <View style={styles.transactionItem}>
      <View style={styles.content}>
        {/* Category Icon */}
        <View style={[
          styles.iconContainer,
          { backgroundColor: getCategoryIconColor(transaction.category?.name) }
        ]}>
          <MaterialIcons
            name={transaction.category?.icon_name as any || 'category'}
            size={26}
            color={COLORS.primaryLight}
          />
        </View>

        {/* Transaction Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.leftDetails}>
            <Text style={styles.categoryName}>
              {transaction.category?.name || 'Unknown Category'}
            </Text>
            {transaction.description && (
              <Text style={styles.subcategory} numberOfLines={1}>
                {transaction.description}
              </Text>
            )}
            <Text style={styles.dateTime}>
              {formatTime(transaction.transaction_date)} - {formatDate(transaction.transaction_date)}
            </Text>
          </View>

          {/* Amount */}
          <View style={styles.rightDetails}>
            <Text style={[
              styles.amount,
              { color: transaction.type === 'income' ? COLORS.success : COLORS.accent }
            ]}>
              {formatAmount(transaction.amount, transaction.type)}
            </Text>
          </View>
        </View>
      </View>

      {/* Separator Lines */}
      <View style={styles.separatorContainer}>
        <View style={[styles.separator, styles.leftSeparator]} />
        <View style={[styles.separator, styles.rightSeparator]} />
      </View>
    </View>
  );
};

export default function BudgetTransactionsList({
  transactions,
  isLoading = false,
}: BudgetTransactionsListProps): React.ReactElement {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </View>
    );
  }

  if (transactions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <View style={styles.emptyContainer}>
          <MaterialIcons name="receipt-long" size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No transactions found</Text>
          <Text style={styles.emptySubtitle}>
            Transactions for this budget will appear here
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      <View style={styles.transactionsList}>
        {transactions.slice(0, 5).map((transaction, index) => (
          <BudgetTransactionItem
            key={transaction.id}
            transaction={transaction}
          />
        ))}
        {transactions.length > 5 && (
          <Text style={styles.moreText}>
            +{transactions.length - 5} more transactions
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  transactionsList: {
    backgroundColor: 'transparent',
  },
  transactionItem: {
    paddingVertical: TRANSACTIONS.transactionItem.paddingVertical,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: TRANSACTIONS.transactionItem.iconSize,
    height: TRANSACTIONS.transactionItem.iconSize,
    borderRadius: TRANSACTIONS.transactionItem.iconBorderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  detailsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftDetails: {
    flex: 1,
  },
  rightDetails: {
    alignItems: 'flex-end',
  },
  categoryName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  subcategory: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.light,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  dateTime: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.accent,
  },
  amount: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  separatorContainer: {
    flexDirection: 'row',
    marginTop: TRANSACTIONS.transactionItem.paddingVertical,
  },
  separator: {
    height: TRANSACTIONS.transactionItem.separatorWidth,
    backgroundColor: TRANSACTIONS.transactionItem.separatorColor,
  },
  leftSeparator: {
    width: 93,
  },
  rightSeparator: {
    flex: 1,
    marginLeft: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textTertiary,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  moreText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.accent,
    textAlign: 'center',
    marginTop: SPACING.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});