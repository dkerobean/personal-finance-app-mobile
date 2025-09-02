import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryChart, VictoryLine, VictoryArea, VictoryAxis, VictoryTooltip, VictoryScatter } from 'victory-native';
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

  const chartWidth = screenWidth - (SPACING.xl * 2) - (SPACING.lg * 2);
  const chartHeight = height - 60; // Account for header space

  // Transform data for Victory charts
  const chartData = data.map((point, index) => ({
    x: index,
    y: point.netWorth,
    date: point.date,
    assets: point.totalAssets,
    liabilities: point.totalLiabilities,
    original: point,
  }));

  const assetsData = data.map((point, index) => ({
    x: index,
    y: point.totalAssets,
  }));

  const liabilitiesData = data.map((point, index) => ({
    x: index,
    y: point.totalLiabilities,
  }));

  // Calculate chart domain
  const getYDomain = () => {
    if (chartData.length === 0) return [0, 100000];
    
    const allValues = [
      ...chartData.map(d => d.y),
      ...(showBreakdown ? [...assetsData.map(d => d.y), ...liabilitiesData.map(d => d.y)] : []),
    ];
    
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.1; // 10% padding
    
    return [Math.max(0, min - padding), max + padding];
  };

  // Format date for x-axis
  const formatXAxisLabel = (tickValue: number) => {
    const dataPoint = chartData[Math.floor(tickValue)];
    if (!dataPoint) return '';
    
    const date = new Date(dataPoint.date);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: timePeriod.months > 12 ? '2-digit' : undefined 
    });
  };

  // Handle data point selection
  const handlePointPress = (evt: any, datum: any) => {
    if (!interactive) return;
    
    const point = datum.original as HistoricalDataPoint;
    setSelectedPoint(point);
    onDataPointSelect?.(point);
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
  if (chartData.length === 0) {
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
        <VictoryChart
          width={chartWidth}
          height={chartHeight}
          padding={{ left: 60, top: 20, right: 20, bottom: 50 }}
          domain={{ y: getYDomain() }}
        >
          {/* Background gradient area for net worth */}
          <VictoryArea
            data={chartData}
            x="x"
            y="y"
            style={{
              data: {
                fill: `${COLORS.primary}20`,
                fillOpacity: 0.3,
              },
            }}
            animate={{
              duration: 1000,
              onLoad: { duration: 500 },
            }}
          />

          {/* Assets line (if breakdown is enabled) */}
          {showBreakdown && (
            <VictoryLine
              data={assetsData}
              x="x"
              y="y"
              style={{
                data: {
                  stroke: COLORS.success,
                  strokeWidth: 2,
                  strokeOpacity: 0.7,
                },
              }}
              animate={{
                duration: 1000,
                onLoad: { duration: 500 },
              }}
            />
          )}

          {/* Liabilities line (if breakdown is enabled) */}
          {showBreakdown && (
            <VictoryLine
              data={liabilitiesData}
              x="x"
              y="y"
              style={{
                data: {
                  stroke: COLORS.error,
                  strokeWidth: 2,
                  strokeOpacity: 0.7,
                },
              }}
              animate={{
                duration: 1000,
                onLoad: { duration: 500 },
              }}
            />
          )}

          {/* Main net worth line */}
          <VictoryLine
            data={chartData}
            x="x"
            y="y"
            style={{
              data: {
                stroke: COLORS.primary,
                strokeWidth: 3,
              },
            }}
            animate={{
              duration: 1000,
              onLoad: { duration: 500 },
            }}
          />

          {/* Interactive scatter points */}
          {interactive && (
            <VictoryScatter
              data={chartData}
              x="x"
              y="y"
              size={4}
              style={{
                data: {
                  fill: COLORS.primary,
                  stroke: COLORS.white,
                  strokeWidth: 2,
                },
              }}
              events={[{
                target: 'data',
                eventHandlers: {
                  onPress: (evt, datum) => handlePointPress(evt, datum),
                },
              }]}
              labelComponent={
                <VictoryTooltip
                  style={{
                    fill: COLORS.white,
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                  flyoutStyle={{
                    fill: COLORS.backgroundCard,
                    stroke: COLORS.border,
                    strokeWidth: 1,
                  }}
                  renderInPortal={false}
                />
              }
              labels={({ datum }) => `${formatCurrency(datum.y)}\n${new Date(datum.date).toLocaleDateString()}`}
            />
          )}

          {/* Y-axis */}
          <VictoryAxis
            dependentAxis
            tickFormat={(value) => formatCurrency(value, { compact: true })}
            style={{
              axis: { stroke: COLORS.border },
              grid: { stroke: COLORS.border, strokeOpacity: 0.3 },
              tickLabels: {
                fontSize: 12,
                fill: COLORS.textSecondary,
                fontFamily: 'System',
              },
            }}
          />

          {/* X-axis */}
          <VictoryAxis
            tickFormat={formatXAxisLabel}
            tickCount={Math.min(6, chartData.length)}
            style={{
              axis: { stroke: COLORS.border },
              tickLabels: {
                fontSize: 12,
                fill: COLORS.textSecondary,
                fontFamily: 'System',
                angle: chartData.length > 12 ? -45 : 0,
              },
            }}
          />
        </VictoryChart>
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