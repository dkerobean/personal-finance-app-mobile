import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowDownRight, ArrowUpRight, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/design';

interface IncomeExpenseSummaryProps {
  monthlyIncome: number;
  monthlyExpense: number;
}

const formatCurrency = (amount: number): string => {
  return `GH¢${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function IncomeExpenseSummary({
  monthlyIncome,
  monthlyExpense,
}: IncomeExpenseSummaryProps) {
  const router = useRouter();

  const netCashflow = monthlyIncome - monthlyExpense;
  const expenseRatio = monthlyIncome > 0 ? (monthlyExpense / monthlyIncome) * 100 : 0;
  const spentPercentage = Math.max(0, Math.min(100, Math.round(expenseRatio)));
  const savingsPotential = Math.max(netCashflow, 0);

  const getSpendingSignal = () => {
    if (expenseRatio < 40) return 'Excellent control';
    if (expenseRatio < 70) return 'Healthy pace';
    if (expenseRatio < 90) return 'Watch spending';
    return 'Review budget now';
  };

  const signal = getSpendingSignal();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#033327', COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={styles.snapshotLabel}>Monthly Snapshot</Text>
            <Text style={styles.snapshotSubLabel}>Income vs spending</Text>
          </View>

          <View style={styles.netChip}>
            <Text style={styles.netChipLabel}>Net</Text>
            <Text style={styles.netChipAmount}>
              {netCashflow >= 0 ? '+' : '-'}
              {formatCurrency(Math.abs(netCashflow))}
            </Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={styles.metricIconWrap}>
              <ArrowDownRight size={16} color="#D1FAE5" />
            </View>
            <Text style={styles.metricLabel}>Income</Text>
            <Text style={styles.metricValue}>{formatCurrency(monthlyIncome)}</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, styles.metricIconWrapExpense]}>
              <ArrowUpRight size={16} color="#FECACA" />
            </View>
            <Text style={styles.metricLabel}>Expense</Text>
            <Text style={styles.metricValue}>-{formatCurrency(monthlyExpense)}</Text>
          </View>
        </View>

        <View style={styles.progressBlock}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${spentPercentage}%` }]} />
          </View>
          <View style={styles.progressMeta}>
            <Text style={styles.progressText}>Spent {spentPercentage}% of monthly income</Text>
            <Text style={styles.signalText}>{signal}</Text>
          </View>
        </View>

        <View style={styles.saveRow}>
          <Text style={styles.saveLabel}>Available to save</Text>
          <Text style={styles.saveValue}>{formatCurrency(savingsPotential)}</Text>
        </View>
      </LinearGradient>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.incomeButton]}
          onPress={() => router.push('/transactions/create?type=income')}
          activeOpacity={0.85}
        >
          <Plus size={16} color={COLORS.white} />
          <Text style={styles.actionButtonText}>Add Income</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.expenseButton]}
          onPress={() => router.push('/transactions/create?type=expense')}
          activeOpacity={0.85}
        >
          <Plus size={16} color={COLORS.white} />
          <Text style={styles.actionButtonText}>Add Expense</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  card: {
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.lg,
    ...SHADOWS.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  snapshotLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.white,
    fontWeight: '600',
  },
  snapshotSubLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#FFFFFF',
    marginTop: 2,
  },
  netChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(2, 44, 34, 0.45)',
    alignItems: 'flex-end',
  },
  netChipLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  netChipAmount: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  metricCard: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  metricIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2, 44, 34, 0.35)',
    marginBottom: SPACING.sm,
  },
  metricIconWrapExpense: {
    backgroundColor: 'rgba(127, 29, 29, 0.35)',
  },
  metricLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
  },
  metricValue: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressBlock: {
    marginTop: SPACING.lg,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#CCFBF1',
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  progressText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.xs,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  signalText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  saveRow: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  saveLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  saveValue: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
    ...SHADOWS.sm,
  },
  incomeButton: {
    backgroundColor: COLORS.primaryDark,
  },
  expenseButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '700',
    color: COLORS.white,
  },
});
