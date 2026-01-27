import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '@/constants/design';
import type { Transaction } from '@/types/models';

interface AverageTransactionsProps {
  transactions: Transaction[];
  selectedMonth?: string;
}

export default function AverageTransactions({
  transactions,
  selectedMonth,
}: AverageTransactionsProps): React.ReactElement | null {
  if (transactions.length === 0) {
    return null;
  }

  // Calculate averages by category
  const categoryAverages = transactions.reduce((acc, transaction) => {
    const categoryName = transaction.category?.name || 'Unknown';
    if (!acc[categoryName]) {
      acc[categoryName] = {
        total: 0,
        count: 0,
        type: transaction.type,
        icon: transaction.category?.icon_name || 'category',
      };
    }
    acc[categoryName].total += transaction.amount;
    acc[categoryName].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number; type: 'income' | 'expense'; icon: string }>);

  // Convert to array and calculate averages
  const averagesArray = Object.entries(categoryAverages)
    .map(([category, data]) => ({
      category,
      average: data.total / data.count,
      type: data.type,
      icon: data.icon,
      transactionCount: data.count,
    }))
    .sort((a, b) => b.average - a.average)
    .slice(0, 5); // Top 5 categories by average

  if (averagesArray.length === 0) {
    return null;
  }

  const formatAmount = (amount: number, type: 'income' | 'expense'): string => {
    const sign = type === 'income' ? '' : '';
    return `₵${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        Average Spending by Category{selectedMonth ? ` - ${selectedMonth}` : ''}
      </Text>
      
      <View style={styles.averagesList}>
        {averagesArray.map((item, index) => (
          <View key={`${item.category}-${index}`} style={styles.averageItem}>
            <View style={styles.averageInfo}>
              <View style={[styles.iconContainer, { 
                backgroundColor: item.type === 'income' ? COLORS.success : COLORS.accent 
              }]}>
                <MaterialIcons
                  name={item.icon as any}
                  size={20}
                  color={COLORS.white}
                />
              </View>
              <View style={styles.averageDetails}>
                <Text style={styles.categoryName}>{item.category}</Text>
                <Text style={styles.transactionCount}>
                  {item.transactionCount} transaction{item.transactionCount > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            
            <View style={styles.averageAmount}>
              <Text style={[styles.amount, { 
                color: item.type === 'income' ? COLORS.success : COLORS.accent 
              }]}>
                {formatAmount(item.average, item.type)}
              </Text>
              <Text style={styles.averageLabel}>avg</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.xl,
    paddingHorizontal: 37,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
    marginBottom: SPACING.md,
  },
  averagesList: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
  },
  averageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 208, 158, 0.1)',
  },
  averageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  averageDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
  },
  transactionCount: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  averageAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontFamily: 'Poppins',
  },
  averageLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    fontFamily: 'Poppins',
    marginTop: 2,
  },
});