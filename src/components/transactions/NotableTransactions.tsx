import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/design';
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
      <Text style={styles.sectionTitle}>Notable Transactions</Text>
      <View style={styles.transactionsList}>
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
    marginTop: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
    paddingHorizontal: 37,
    marginBottom: SPACING.md,
  },
  transactionsList: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    marginHorizontal: 20,
  },
});