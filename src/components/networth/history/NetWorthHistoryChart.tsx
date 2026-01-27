import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/constants/design';
import { formatCurrency } from '@/lib/formatters';
import type { HistoricalDataPoint, TimePeriodConfig } from '../../../app/(app)/networth/history';

const { width: screenWidth } = Dimensions.get('window');

interface NetWorthHistoryChartProps {
  data: HistoricalDataPoint[];
  timePeriod: TimePeriodConfig;
  height?: number;
  showBreakdown?: boolean;
  interactive?: boolean;
  isLoading?: boolean;
  onDataPointSelect?: (point: HistoricalDataPoint) => void;
}

export default function NetWorthHistoryChart({
  data,
  timePeriod,
  height = 300,
  showBreakdown = true,
  interactive = true,
  isLoading = false,
  onDataPointSelect,
}: NetWorthHistoryChartProps): React.ReactElement {
  const [selectedPoint, setSelectedPoint] = useState<HistoricalDataPoint | null>(null);

  const chartWidth = screenWidth - (SPACING.xl * 2);
  const chartHeight = height - 60; // Account for header space

  // Transform data for react-native-chart-kit
  const chartData = {
    labels: data.map((point, index) => {
      const date = new Date(point.date);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        year: timePeriod.months > 12 ? '2-digit' : undefined 
      });
    }),
    datasets: [
      {
        data: data.map(point => point.netWorth),
        color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
        strokeWidth: 3
      },
      ...(showBreakdown ? [
        {
          data: data.map(point => point.totalAssets),
          color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
          strokeWidth: 2
        },
        {
          data: data.map(point => point.totalLiabilities),
          color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
          strokeWidth: 2
        }
      ] : [])
    ]
  };

  // Chart configuration
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
    labelColor: () => '#6B7280',
    style: {
      borderRadius: BORDER_RADIUS.md
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#ffffff'
    },
    formatYLabel: (value) => formatCurrency(parseFloat(value), { compact: true })
  };

  // Handle data point selection
  const handlePointPress = (data: any, index: number) => {
    if (!interactive || !data || data.length === 0) return;
    
    const point = data[index];
    if (point) {
      setSelectedPoint(point);
      onDataPointSelect?.(point);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Net Worth History</Text>
        </View>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingChart} />
          <View style={styles.loadingLabels}>
            {[1, 2, 3, 4, 5].map((item) => (
              <View key={item} style={styles.loadingLabel} />
            ))}
          </View>
        </View>
      </View>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Net Worth History</Text>
        </View>
        <View style={styles.emptyContainer}>
          <MaterialIcons name="show-chart" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>No Historical Data</Text>
          <Text style={styles.emptyText}>
            Start tracking your net worth to see your financial progress over time.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Net Worth History</Text>
        <Text style={styles.subtitle}>{timePeriod.label} View</Text>
      </View>

      {/* Chart Container */}
      <View style={styles.chartContainer}>
        <ScrollView horizontal={data.length > 6} showsHorizontalScrollIndicator={false}>
          <LineChart
            data={chartData}
            width={Math.max(chartWidth, data.length * 60)}
            height={chartHeight}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            onDataPointClick={interactive ? handlePointPress : undefined}
            withDots={interactive}
            withShadow={false}
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={true}
            segments={4}
          />
        </ScrollView>
      </View>

      {/* Legend (if breakdown is shown) */}
      {showBreakdown && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
            <Text style={styles.legendText}>Net Worth</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
            <Text style={styles.legendText}>Assets</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.error }]} />
            <Text style={styles.legendText}>Liabilities</Text>
          </View>
        </View>
      )}

      {/* Selected Point Details */}
      {selectedPoint && (
        <View style={styles.selectedPointContainer}>
          <Text style={styles.selectedPointDate}>
            {new Date(selectedPoint.date).toLocaleDateString('en-US', { 
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
          <View style={styles.selectedPointStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Net Worth</Text>
              <Text style={styles.statValue}>{formatCurrency(selectedPoint.netWorth)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Assets</Text>
              <Text style={styles.statValue}>{formatCurrency(selectedPoint.totalAssets)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Liabilities</Text>
              <Text style={styles.statValue}>{formatCurrency(selectedPoint.totalLiabilities)}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  header: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  chart: {
    borderRadius: BORDER_RADIUS.md,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  selectedPointContainer: {
    backgroundColor: COLORS.backgroundContent,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  selectedPointDate: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  selectedPointStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  
  // Loading states
  loadingContainer: {
    height: 300,
  },
  loadingChart: {
    height: 250,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  loadingLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  loadingLabel: {
    width: 30,
    height: 12,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
  },
  
  // Empty state
  emptyContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.md * 1.4,
  },
});