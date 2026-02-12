import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS } from '@/constants/design';
import type { CategorySpending } from '@/types/models';

const screenWidth = Dimensions.get('window').width;

interface ReportPieChartProps {
  data: CategorySpending[];
  totalExpense: number;
}

export default function ReportPieChart({ data, totalExpense }: ReportPieChartProps) {
  if (!data || data.length === 0 || totalExpense === 0) {
    return null;
  }

  // Colors for chart segments - Premium Palette
  const chartColors = [
    '#006D4F', // Primary Emerald
    '#10B981', // Secondary
    '#34D399', // Light Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
  ];

  const chartData = data
    .filter(item => item.totalAmount > 0 && item.type === 'expense')
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5) // Top 5
    .map((item, index) => ({
      name: item.categoryName,
      population: item.totalAmount,
      color: chartColors[index % chartColors.length],
      legendFontColor: COLORS.textSecondary,
      legendFontSize: 12,
    }));

  // Add "Other" if there are more categories
  const top5Total = chartData.reduce((sum, item) => sum + item.population, 0);
  const otherTotal = totalExpense - top5Total;
  
  if (otherTotal > 0) {
    chartData.push({
      name: 'Other',
      population: otherTotal,
      color: '#9CA3AF', // Gray
      legendFontColor: COLORS.textSecondary,
      legendFontSize: 12,
    });
  }

  const chartConfig = {
    backgroundGradientFrom: COLORS.white,
    backgroundGradientTo: COLORS.white,
    color: (opacity = 1) => `rgba(0, 109, 79, ${opacity})`,
  };

  return (
    <View style={styles.container}>
      <Text style={styles.chartTitle}>Expense Breakdown</Text>
      
      <View style={styles.chartWrapper}>
        <PieChart
          data={chartData}
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
        {/* Donut Hole Overlay */}
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
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  chartTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    alignSelf: 'flex-start',
    paddingLeft: SPACING.sm,
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutHole: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.backgroundCard,
    left: '27%', // Adjusted for 220 width
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...SHADOWS.sm,
  },
  centerText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
  },
  centerAmount: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
});
