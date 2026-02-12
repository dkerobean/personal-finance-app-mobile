import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '@/constants/design';
import type { Transaction } from '@/types/models';
import TransactionItem from './TransactionItem';

interface NotableTransactionsProps {
  transactions: Transaction[];
  onTransactionPress: (transactionId: string) => void;
}

export default function NotableTransactions({
  transactions,
  onTransactionPress,
}: NotableTransactionsProps): React.ReactElement | null {
  if (transactions.length === 0) {
    return null;
  }

  // Find notable transactions (highest income and expense)
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const expenseTransactions = transactions.filter(t => t.type === 'expense');

  const highestIncome = incomeTransactions.reduce((max, t) => 
    t.amount > max.amount ? t : max, incomeTransactions[0]);
  
  const highestExpense = expenseTransactions.reduce((max, t) => 
    t.amount > max.amount ? t : max, expenseTransactions[0]);

  const notableTransactions = [
    ...(highestIncome ? [highestIncome] : []),
    ...(highestExpense ? [highestExpense] : [])
  ].filter((transaction, index, array) => 
    // Remove duplicates if the same transaction is both highest income and expense
    array.findIndex(t => t.id === transaction.id) === index
  );

  if (notableTransactions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionCard}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Notable Transactions</Text>
          <Text style={styles.sectionBadge}>Largest movements</Text>
        </View>

        {notableTransactions.map((transaction, index) => (
          <TransactionItem
            key={`notable-${transaction.id}`}
            transaction={transaction}
            onPress={onTransactionPress}
            showSeparator={index < notableTransactions.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.lg,
  },
  sectionCard: {
    borderRadius: 24,
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.lg,
    ...SHADOWS.md,
  },
  headerRow: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  sectionBadge: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 99,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
});
