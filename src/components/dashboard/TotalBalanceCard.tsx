import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { Transaction } from '@/types/models';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS } from '@/constants/design';

interface TotalBalanceCardProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export default function TotalBalanceCard({ transactions, isLoading }: TotalBalanceCardProps) {
  const calculateTotalBalance = (): number => {
    return transactions.reduce((total, transaction) => {
      if (transaction.type === 'income') {
        return total + transaction.amount;
      } else {
        return total - transaction.amount;
      }
    }, 0);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const totalBalance = calculateTotalBalance();
  const isPositive = totalBalance >= 0;

  if (isLoading) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <MaterialIcons name="account-balance-wallet" size={24} color={COLORS.textTertiary} />
          <Text style={styles.title}>Total Balance</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MaterialIcons name="account-balance-wallet" size={24} color={COLORS.primary} />
        <Text style={styles.title}>Total Balance</Text>
      </View>
      
      <View style={styles.balanceContainer}>
        <Text style={[
          styles.balanceAmount,
          isPositive ? styles.positiveBalance : styles.negativeBalance
        ]}>
          {formatCurrency(totalBalance)}
        </Text>
        
        <View style={styles.balanceIndicator}>
          <MaterialIcons 
            name={isPositive ? "trending-up" : "trending-down"} 
            size={24} 
            color={isPositive ? COLORS.primary : COLORS.error} 
          />
        </View>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={styles.incomeAmount}>
            {formatCurrency(
              transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0)
            )}
          </Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Expenses</Text>
          <Text style={styles.expenseAmount}>
            {formatCurrency(
              transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0)
            )}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    ...SHADOWS.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textTertiary,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  balanceAmount: {
    fontSize: TYPOGRAPHY.sizes.massive,
    fontWeight: TYPOGRAPHY.weights.bold,
    flex: 1,
    letterSpacing: -1,
  },
  positiveBalance: {
    color: COLORS.primary,
  },
  negativeBalance: {
    color: COLORS.error,
  },
  balanceIndicator: {
    marginLeft: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    padding: 8,
    borderRadius: 12,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    marginBottom: 4,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  incomeAmount: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
  },
  expenseAmount: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.error,
  },
});