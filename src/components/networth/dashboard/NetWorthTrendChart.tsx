import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '@/constants/design';
import { formatCurrency } from '@/lib/formatters';

interface NetWorthSnapshot {
  month: string;
  netWorth: number;
  assets: number;
  liabilities: number;
  timestamp: string;
}

interface NetWorthTrendChartProps {
  historicalData: NetWorthSnapshot[];
  isLoading?: boolean;
  onViewHistory?: () => void;
}

export default function NetWorthTrendChart({
  historicalData = [],
  isLoading = false,
  onViewHistory,
}: NetWorthTrendChartProps): React.ReactElement {
  const [containerWidth, setContainerWidth] = useState(0);
  const chartHeight = 150;
  const hasData = historicalData.length > 0;
  const chartWidth = Math.max(containerWidth, 240);
  const safeData = useMemo(() => historicalData.slice(-7), [historicalData]);
  const labelFormatter = useMemo(() => {
    const monthKeys = new Set(
      safeData.map((item) => {
        const date = new Date(item.timestamp);
        return `${date.getFullYear()}-${date.getMonth()}`;
      })
    );

    return (timestamp: string): string => {
      const date = new Date(timestamp);
      if (monthKeys.size === 1) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      return date.toLocaleDateString('en-US', { month: 'short' });
    };
  }, [safeData]);
  
  const getMinMaxValues = () => {
    if (!hasData) return { min: 0, max: 0 };
    
    const values = safeData.map(item => item.netWorth);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  };

  const { min, max } = getMinMaxValues();
  const valueRange = max - min || 1; // Avoid division by zero
  
  const getPointPosition = (index: number, value: number) => {
    const x = (index / Math.max(safeData.length - 1, 1)) * chartWidth;
    const y = chartHeight - ((value - min) / valueRange) * chartHeight;
    return { x, y };
  };

  const generatePath = () => {
    if (!hasData) return '';
    
    let path = '';
    safeData.forEach((item, index) => {
      const { x, y } = getPointPosition(index, item.netWorth);
      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });
    return path;
  };

  const getLatestChange = () => {
    if (safeData.length < 2) return { amount: 0, percentage: 0 };
    
    const latest = safeData[safeData.length - 1];
    const previous = safeData[safeData.length - 2];
    const change = latest.netWorth - previous.netWorth;
    const percentage = previous.netWorth !== 0 ? (change / Math.abs(previous.netWorth)) * 100 : 0;
    
    return { amount: change, percentage };
  };

  const { amount: monthlyChange, percentage: monthlyChangePercentage } = getLatestChange();
  const isPositiveChange = monthlyChange >= 0;

  const renderPlaceholder = () => (
    <View style={styles.placeholderContainer}>
      <Ionicons name="trending-up" size={48} color={COLORS.textSecondary} />
      <Text style={styles.placeholderTitle}>Net Worth History</Text>
      <Text style={styles.placeholderText}>
        Track your progress over time. Add assets and liabilities to start building your history.
      </Text>
      <TouchableOpacity style={styles.learnMoreButton} onPress={onViewHistory}>
        <Text style={styles.learnMoreText}>Learn More</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingHeader}>
        <View style={styles.loadingTitle} />
        <View style={styles.loadingChange} />
      </View>
      <View style={styles.loadingChart} />
      <View style={styles.loadingMonths} />
    </View>
  );

  const renderChart = () => (
    <View
      onLayout={(event) => {
        const nextWidth = event.nativeEvent.layout.width - SPACING.xs * 2;
        if (nextWidth > 0 && Math.abs(nextWidth - containerWidth) > 1) {
          setContainerWidth(nextWidth);
        }
      }}
    >
      {/* Chart Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Net Worth Trend</Text>
          <View style={styles.changeContainer}>
            {isPositiveChange ? (
              <TrendingUp size={16} color={COLORS.success} />
            ) : (
              <TrendingDown size={16} color={COLORS.error} />
            )}
            <Text style={[
              styles.changeText, 
              { color: isPositiveChange ? COLORS.success : COLORS.error }
            ]}>
              {formatCurrency(Math.abs(monthlyChange))} ({Math.abs(monthlyChangePercentage).toFixed(1)}%)
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onViewHistory} style={styles.viewHistoryButton}>
          <Text style={styles.viewHistoryText}>View All</Text>
          <ChevronRight size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Chart Area */}
      <View style={styles.chartContainer}>
        <View style={[styles.chartArea, { width: chartWidth, height: chartHeight }]}>
          {/* Grid Lines */}
          <View style={styles.gridLines}>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
              <View 
                key={index}
                style={[
                  styles.gridLine,
                  { bottom: ratio * chartHeight, width: chartWidth }
                ]}
              />
            ))}
          </View>

          {/* Chart Line */}
          <View style={styles.svg}>
            <Svg width={chartWidth} height={chartHeight}>
              <Path
                d={generatePath()}
                fill="none"
                stroke={COLORS.primary}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Data Points */}
              {safeData.map((item, index) => {
                const { x, y } = getPointPosition(index, item.netWorth);
                return (
                  <Circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="4"
                    fill={COLORS.primary}
                    stroke={COLORS.white}
                    strokeWidth="2"
                  />
                );
              })}
            </Svg>
          </View>
          
          {/* Gradient Fill */}
          <View style={[styles.svg, styles.gradientSvg]}>
            <Svg width={chartWidth} height={chartHeight}>
              <Defs>
                <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={COLORS.primary} stopOpacity="0.3" />
                  <Stop offset="100%" stopColor={COLORS.primary} stopOpacity="0.05" />
                </LinearGradient>
              </Defs>
              <Path
                d={`${generatePath()} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`}
                fill="url(#areaGradient)"
              />
            </Svg>
          </View>
        </View>
      </View>

      {/* Month Labels */}
      <View style={styles.monthLabels}>
        {safeData.map((item, index) => (
          <Text key={index} style={styles.monthLabel}>
            {labelFormatter(item.timestamp)}
          </Text>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {isLoading ? renderLoadingState() : hasData ? renderChart() : renderPlaceholder()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundCard,
    width: '100%',
    marginBottom: SPACING.lg,
    borderRadius: 24,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginLeft: SPACING.xs,
  },
  viewHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  viewHistoryText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginRight: SPACING.xs,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  chartArea: {
    position: 'relative',
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: COLORS.gray100,
    opacity: 0.3,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  gradientSvg: {
    zIndex: -1,
  },
  monthLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xs,
  },
  monthLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    flex: 1,
  },
  
  // Placeholder styles
  placeholderContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  placeholderTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.md * 1.4,
    marginBottom: SPACING.lg,
  },
  learnMoreButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  learnMoreText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  
  // Loading styles
  loadingContainer: {
    paddingVertical: SPACING.md,
  },
  loadingHeader: {
    marginBottom: SPACING.lg,
  },
  loadingTitle: {
    width: 120,
    height: 20,
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  loadingChange: {
    width: 80,
    height: 16,
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.sm,
  },
  loadingChart: {
    width: '100%',
    height: 150,
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  loadingMonths: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
