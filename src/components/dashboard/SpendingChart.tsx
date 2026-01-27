import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS } from '@/constants/design';
import type { Transaction } from '@/types/models';

const screenWidth = Dimensions.get('window').width;

interface SpendingChartProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export default function SpendingChart({ transactions, isLoading }: SpendingChartProps) {
  if (isLoading || transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No spending data available</Text>
      </View>
    );
  }

  // Calculate spending by category
  const categoryTotals = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const category = t.category?.name || 'Uncategorized';
      acc[category] = (acc[category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const totalExpense = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

  // Colors for chart segments
  const chartColors = [
    '#006D4F', // Primary Emerald
    '#10B981', // Secondary
    '#34D399', // Light Emerald
    '#6EE7B7', // Lighter
    '#A7F3D0', // Pale
    '#059669', // Darker success
  ];

  const data = Object.keys(categoryTotals).map((category, index) => ({
    name: category,
    population: categoryTotals[category],
    color: chartColors[index % chartColors.length],
    legendFontColor: COLORS.textSecondary,
    legendFontSize: 12,
  })).sort((a, b) => b.population - a.population).slice(0, 5); // Take top 5

  const chartConfig = {
    backgroundGradientFrom: COLORS.white,
    backgroundGradientTo: COLORS.white,
    color: (opacity = 1) => `rgba(0, 109, 79, ${opacity})`,
    strokeWidth: 2,
  };

  return (
    <View style={styles.container}>
      <Text style={styles.chartTitle}>Spending Breakdown</Text>
      
      <View style={styles.chartWrapper}>
        <PieChart
          data={data}
          width={screenWidth - SPACING.xl * 2}
          height={220}
          chartConfig={chartConfig}
          accessor={"population"}
          backgroundColor={"transparent"}
          paddingLeft={"15"}
          center={[10, 0]}
          absolute
          hasLegend={true}
        />
        {/* Center Text for Donut Effect (Simulated) - requires absolute positioning over a PieChart that has internal radius, 
            but ChartKit PieChart is solid. We'll use a standard PieChart for now as ChartKit's "donut" is finicky.
            The user image has a Donut. ChartKit supports 'hasLegend'.
            ChartKit doesn't easily do a hole.
            I will overlay a white circle to make it a Donut.
        */}
        <View style={styles.donutHole}>
          <Text style={styles.centerText}>Total</Text>
          <Text style={styles.centerAmount}>
             {new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', notation: 'compact' }).format(totalExpense)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  chartTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    alignSelf: 'flex-start',
    paddingLeft: SPACING.md,
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutHole: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    left: '26%', // Approximate centering for chart kit 
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  centerText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
  },
  centerAmount: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textTertiary,
  },
});
