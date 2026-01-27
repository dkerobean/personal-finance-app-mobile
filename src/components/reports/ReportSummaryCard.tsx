import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate
} from 'react-native-reanimated';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/design';

interface ReportSummaryCardProps {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  savingsRate: number;
  transactionCount: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ReportSummaryCard({
  totalIncome,
  totalExpenses,
  netIncome,
  savingsRate,
  transactionCount
}: ReportSummaryCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const formatCurrency = (amount: number): string => {
    return `₵${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculate expense ratio for progress bar
  const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
  const expensePercentage = Math.min(Math.round(expenseRatio), 100);

  // Status based on savings
  const getStatus = () => {
    if (savingsRate >= 30) return { text: 'Excellent savings!', color: '#10b981', icon: '💪' };
    if (savingsRate >= 15) return { text: 'Good progress!', color: COLORS.success, icon: '👍' };
    if (savingsRate >= 0) return { text: 'Room to improve', color: COLORS.warning, icon: '📊' };
    return { text: 'Overspending', color: COLORS.error, icon: '⚠️' };
  };

  const status = getStatus();

  return (
    <AnimatedPressable
      style={[styles.container, animatedStyle]}
      onPressIn={() => { scale.value = withSpring(0.98); }}
      onPressOut={() => { scale.value = withSpring(1); }}
    >
      {/* Main Stats Row */}
      <View style={styles.statsRow}>
        {/* Income */}
        <View style={styles.statColumn}>
          <View style={styles.statHeader}>
            <View style={styles.iconCircle}>
              <ArrowDownRight size={14} color={COLORS.white} />
            </View>
            <Text style={styles.statLabel}>Total Income</Text>
          </View>
          <Text style={styles.incomeAmount}>{formatCurrency(totalIncome)}</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Expenses */}
        <View style={styles.statColumn}>
          <View style={styles.statHeader}>
            <View style={[styles.iconCircle, styles.expenseIcon]}>
              <ArrowUpRight size={14} color={COLORS.white} />
            </View>
            <Text style={styles.statLabel}>Total Expense</Text>
          </View>
          <Text style={styles.expenseAmount}>{formatCurrency(totalExpenses)}</Text>
        </View>
      </View>

      {/* Net Income Banner */}
      <View style={[
        styles.netIncomeBanner,
        { backgroundColor: netIncome >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }
      ]}>
        <View style={styles.netIncomeLeft}>
          <Wallet size={20} color={netIncome >= 0 ? '#10b981' : '#ef4444'} />
          <Text style={styles.netIncomeLabel}>Net Income</Text>
        </View>
        <Text style={[
          styles.netIncomeValue,
          { color: netIncome >= 0 ? '#10b981' : '#ef4444' }
        ]}>
          {netIncome >= 0 ? '+' : '-'}{formatCurrency(netIncome)}
        </Text>
      </View>

      {/* Spending Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Spending Rate</Text>
          <Text style={styles.progressPercent}>{expensePercentage}%</Text>
        </View>
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill, 
              { 
                width: `${expensePercentage}%`,
                backgroundColor: expensePercentage > 80 ? '#ef4444' : expensePercentage > 60 ? '#f59e0b' : '#10b981'
              }
            ]} 
          />
        </View>
      </View>

      {/* Stats Footer */}
      <View style={styles.statsFooter}>
        <View style={styles.footerStat}>
          <Text style={styles.footerStatValue}>{transactionCount}</Text>
          <Text style={styles.footerStatLabel}>Transactions</Text>
        </View>
        <View style={styles.footerDivider} />
        <View style={styles.footerStat}>
          <Text style={[styles.footerStatValue, { color: status.color }]}>
            {savingsRate.toFixed(0)}%
          </Text>
          <Text style={styles.footerStatLabel}>Savings Rate</Text>
        </View>
        <View style={styles.footerDivider} />
        <View style={styles.footerStat}>
          <Text style={styles.footerEmoji}>{status.icon}</Text>
          <Text style={[styles.footerStatLabel, { color: status.color }]}>{status.text}</Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xl,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
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
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.4)',
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.white,
    opacity: 0.9,
  },
  divider: {
    width: 1,
    backgroundColor: COLORS.white,
    opacity: 0.2,
    marginHorizontal: SPACING.md,
  },
  incomeAmount: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  expenseAmount: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  netIncomeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  netIncomeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  netIncomeLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.white,
    fontWeight: '500',
  },
  netIncomeValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '700',
  },
  progressSection: {
    marginBottom: SPACING.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  progressLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.white,
    opacity: 0.8,
  },
  progressPercent: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.white,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  footerStat: {
    flex: 1,
    alignItems: 'center',
  },
  footerDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  footerStatValue: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 2,
  },
  footerStatLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.white,
    opacity: 0.8,
  },
  footerEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
});
