import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/design';

interface IncomeExpenseSummaryProps {
  monthlyIncome: number;
  monthlyExpense: number;
}

export default function IncomeExpenseSummary({ monthlyIncome, monthlyExpense }: IncomeExpenseSummaryProps) {
  const router = useRouter();
  
  const formatCurrency = (amount: number): string => {
    return `₵${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculate expense ratio (what % of income is spent)
  const expenseRatio = monthlyIncome > 0 ? (monthlyExpense / monthlyIncome) * 100 : 0;
  const expensePercentage = Math.min(Math.round(expenseRatio), 100);
  
  // Determine status message
  const getStatusMessage = () => {
    if (expenseRatio < 30) return { text: `${expensePercentage}% of your income spent. Excellent!`, color: COLORS.success };
    if (expenseRatio < 60) return { text: `${expensePercentage}% of your income spent. Looks good.`, color: COLORS.primary };
    if (expenseRatio < 90) return { text: `${expensePercentage}% of your income spent. Be mindful.`, color: COLORS.warning };
    return { text: `${expensePercentage}% of your income spent. Review budget!`, color: COLORS.error };
  };

  const status = getStatusMessage();

  return (
    <View style={styles.container}>
      {/* Stats Card */}
      <View style={styles.card}>
        {/* Income and Expense Row */}
        <View style={styles.statsRow}>
          {/* Total Income */}
          <View style={styles.statColumn}>
            <View style={styles.statHeader}>
              <MaterialIcons name="south-west" size={16} color={COLORS.white} />
              <Text style={styles.statLabel}>Total Income</Text>
            </View>
            <Text style={styles.incomeAmount}>{formatCurrency(monthlyIncome)}</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Total Expense */}
          <View style={styles.statColumn}>
            <View style={styles.statHeader}>
              <MaterialIcons name="north-east" size={16} color={COLORS.white} />
              <Text style={styles.statLabel}>Total Expense</Text>
            </View>
            <Text style={styles.expenseAmount}>-{formatCurrency(monthlyExpense)}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressFill, { width: `${Math.min(expensePercentage, 100)}%` }]} />
            <View style={styles.progressLabels}>
              <Text style={styles.progressPercent}>{expensePercentage}%</Text>
              <Text style={styles.progressTotal}>{formatCurrency(monthlyIncome)}</Text>
            </View>
          </View>
        </View>

        {/* Status Message */}
        <View style={styles.statusContainer}>
          <MaterialIcons name="check-circle" size={18} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.incomeButton]} 
          onPress={() => router.push('/transactions/create?type=income')}
          activeOpacity={0.8}
        >
          <TrendingUp size={20} color={COLORS.white} style={{ marginRight: 8 }} />
          <Text style={styles.actionButtonText}>Add Income</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.expenseButton]} 
          onPress={() => router.push('/transactions/create?type=expense')}
          activeOpacity={0.8}
        >
          <TrendingDown size={20} color={COLORS.white} style={{ marginRight: 8 }} />
          <Text style={styles.actionButtonText}>Add Expense</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xl,
    ...SHADOWS.lg,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xl,
  },
  statColumn: {
    flex: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.white,
    opacity: 0.9,
  },
  divider: {
    width: 1,
    backgroundColor: COLORS.white,
    opacity: 0.3,
    marginHorizontal: SPACING.md,
  },
  incomeAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
  },
  expenseAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
  },
  progressSection: {
    marginBottom: SPACING.lg,
  },
  progressBarContainer: {
    position: 'relative',
    height: 44,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.primaryDark,
    borderRadius: BORDER_RADIUS.xl,
  },
  progressLabels: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  },
  progressPercent: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '700',
    color: COLORS.white,
  },
  progressTotal: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statusText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  incomeButton: {
    backgroundColor: COLORS.success,
  },
  expenseButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.white,
  },
});
