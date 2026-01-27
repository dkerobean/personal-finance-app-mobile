import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { TrendingUp, TrendingDown, Wallet2, ArrowRight } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useReportsStore } from '@/stores/reportsStore';
import GradientHeader from '@/components/budgets/GradientHeader';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS, BUDGET } from '@/constants/design';

export default function CompareReportsScreen() {
  const { comparison } = useReportsStore();
  const params = useLocalSearchParams<{ current: string; previous: string }>();

  // If no comparison data, go back
  useEffect(() => {
    if (!comparison) {
      router.back();
    }
  }, [comparison]);

  if (!comparison) return null;

  const { currentMonth, previousMonth, changeIncome, changeExpenses, changeNet } = comparison;

  const formatCurrency = (amount: number) => {
    return `₵${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const getPercentageColor = (change: number, type: 'income' | 'expense' | 'net') => {
    if (change === 0) return COLORS.textSecondary;
    
    if (type === 'expense') {
      return change > 0 ? COLORS.error : COLORS.success;
    }
    return change > 0 ? COLORS.success : COLORS.error;
  };

  const formatMonth = (monthStr: string) => {
    return new Date(monthStr + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader
        title="Comparison"
        subtitle={`${formatMonth(params.previous)} vs ${formatMonth(params.current)}`}
        onBackPress={() => router.back()}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          {/* Income Comparison */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: COLORS.success + '20' }]}>
                <TrendingUp size={24} color={COLORS.success} />
              </View>
              <Text style={styles.cardTitle}>Total Income</Text>
              <View style={[styles.badge, { backgroundColor: getPercentageColor(changeIncome, 'income') + '20' }]}>
                <Text style={[styles.badgeText, { color: getPercentageColor(changeIncome, 'income') }]}>
                  {changeIncome > 0 ? '+' : ''}{changeIncome.toFixed(1)}%
                </Text>
              </View>
            </View>

            <View style={styles.comparisonRow}>
              <View style={styles.valueColumn}>
                <Text style={styles.periodLabel}>{formatMonth(params.previous)}</Text>
                <Text style={styles.valueText}>{formatCurrency(previousMonth.totalIncome)}</Text>
              </View>
              <ArrowRight size={20} color={COLORS.textTertiary} />
              <View style={styles.valueColumn}>
                <Text style={styles.periodLabel}>{formatMonth(params.current)}</Text>
                <Text style={styles.currentValueText}>{formatCurrency(currentMonth.totalIncome)}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Expenses Comparison */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: COLORS.error + '20' }]}>
                <TrendingDown size={24} color={COLORS.error} />
              </View>
              <Text style={styles.cardTitle}>Total Expenses</Text>
              <View style={[styles.badge, { backgroundColor: getPercentageColor(changeExpenses, 'expense') + '20' }]}>
                <Text style={[styles.badgeText, { color: getPercentageColor(changeExpenses, 'expense') }]}>
                  {changeExpenses > 0 ? '+' : ''}{changeExpenses.toFixed(1)}%
                </Text>
              </View>
            </View>

            <View style={styles.comparisonRow}>
              <View style={styles.valueColumn}>
                <Text style={styles.periodLabel}>{formatMonth(params.previous)}</Text>
                <Text style={styles.valueText}>{formatCurrency(previousMonth.totalExpenses)}</Text>
              </View>
              <ArrowRight size={20} color={COLORS.textTertiary} />
              <View style={styles.valueColumn}>
                <Text style={styles.periodLabel}>{formatMonth(params.current)}</Text>
                <Text style={styles.currentValueText}>{formatCurrency(currentMonth.totalExpenses)}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Net Income Comparison */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: COLORS.primary + '20' }]}>
                <Wallet2 size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.cardTitle}>Net Income</Text>
              <View style={[styles.badge, { backgroundColor: getPercentageColor(changeNet, 'net') + '20' }]}>
                <Text style={[styles.badgeText, { color: getPercentageColor(changeNet, 'net') }]}>
                  {changeNet > 0 ? '+' : ''}{changeNet.toFixed(1)}%
                </Text>
              </View>
            </View>

            <View style={styles.comparisonRow}>
              <View style={styles.valueColumn}>
                <Text style={styles.periodLabel}>{formatMonth(params.previous)}</Text>
                <Text style={[
                  styles.valueText, 
                  { color: previousMonth.netIncome >= 0 ? COLORS.success : COLORS.error }
                ]}>
                  {formatCurrency(previousMonth.netIncome)}
                </Text>
              </View>
              <ArrowRight size={20} color={COLORS.textTertiary} />
              <View style={styles.valueColumn}>
                <Text style={styles.periodLabel}>{formatMonth(params.current)}</Text>
                <Text style={[
                  styles.currentValueText,
                  { color: currentMonth.netIncome >= 0 ? COLORS.success : COLORS.error }
                ]}>
                  {formatCurrency(currentMonth.netIncome)}
                </Text>
              </View>
            </View>
          </Animated.View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BUDGET.gradientColors.start,
  },
  scrollView: {
    marginTop: -20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: COLORS.backgroundContent,
    flex: 1,
  },
  content: {
    padding: SPACING.xl,
    paddingTop: SPACING.xl,
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  iconContainer: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.md,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  valueColumn: {
    flex: 1,
  },
  periodLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    marginBottom: 2,
  },
  valueText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
  },
  currentValueText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
});
