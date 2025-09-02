import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/constants/design';
import { formatCurrency } from '@/lib/formatters';
import type { HistoricalDataPoint, TimePeriodConfig } from '../../../app/(app)/networth/history';

interface TrendInsightsProps {
  data: HistoricalDataPoint[];
  timePeriod: TimePeriodConfig;
  isLoading?: boolean;
}

interface TrendAnalysis {
  totalGrowth: number;
  totalGrowthPercentage: number;
  averageMonthlyGrowth: number;
  bestMonth: {
    date: string;
    growth: number;
  } | null;
  worstMonth: {
    date: string;
    decline: number;
  } | null;
  consistency: 'high' | 'medium' | 'low';
  trend: 'strongly-positive' | 'positive' | 'neutral' | 'negative' | 'strongly-negative';
}

export default function TrendInsights({
  data,
  timePeriod,
  isLoading = false,
}: TrendInsightsProps): React.ReactElement {

  const calculateTrendAnalysis = (): TrendAnalysis | null => {
    if (data.length < 2) return null;

    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstValue = sortedData[0].netWorth;
    const lastValue = sortedData[sortedData.length - 1].netWorth;
    
    // Total growth
    const totalGrowth = lastValue - firstValue;
    const totalGrowthPercentage = firstValue !== 0 ? (totalGrowth / firstValue) * 100 : 0;
    
    // Monthly changes
    const monthlyChanges = [];
    for (let i = 1; i < sortedData.length; i++) {
      const currentValue = sortedData[i].netWorth;
      const previousValue = sortedData[i - 1].netWorth;
      const change = currentValue - previousValue;
      monthlyChanges.push({
        date: sortedData[i].date,
        growth: change,
        percentage: previousValue !== 0 ? (change / previousValue) * 100 : 0,
      });
    }
    
    // Average monthly growth
    const totalMonthlyGrowth = monthlyChanges.reduce((sum, change) => sum + change.growth, 0);
    const averageMonthlyGrowth = monthlyChanges.length > 0 ? totalMonthlyGrowth / monthlyChanges.length : 0;
    
    // Best and worst months
    const bestMonth = monthlyChanges.length > 0 
      ? monthlyChanges.reduce((best, current) => current.growth > best.growth ? current : best)
      : null;
    
    const worstMonth = monthlyChanges.length > 0
      ? monthlyChanges.reduce((worst, current) => current.growth < worst.growth ? current : worst)
      : null;
    
    // Consistency calculation (variance in monthly changes)
    const avgChange = averageMonthlyGrowth;
    const variance = monthlyChanges.length > 0 
      ? monthlyChanges.reduce((sum, change) => sum + Math.pow(change.growth - avgChange, 2), 0) / monthlyChanges.length
      : 0;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = avgChange !== 0 ? Math.abs(standardDeviation / avgChange) : 0;
    
    let consistency: 'high' | 'medium' | 'low';
    if (coefficientOfVariation < 0.5) {
      consistency = 'high';
    } else if (coefficientOfVariation < 1.5) {
      consistency = 'medium';
    } else {
      consistency = 'low';
    }
    
    // Trend determination
    let trend: 'strongly-positive' | 'positive' | 'neutral' | 'negative' | 'strongly-negative';
    if (totalGrowthPercentage >= 15) {
      trend = 'strongly-positive';
    } else if (totalGrowthPercentage >= 5) {
      trend = 'positive';
    } else if (totalGrowthPercentage >= -5) {
      trend = 'neutral';
    } else if (totalGrowthPercentage >= -15) {
      trend = 'negative';
    } else {
      trend = 'strongly-negative';
    }
    
    return {
      totalGrowth,
      totalGrowthPercentage,
      averageMonthlyGrowth,
      bestMonth: bestMonth ? {
        date: bestMonth.date,
        growth: bestMonth.growth,
      } : null,
      worstMonth: worstMonth ? {
        date: worstMonth.date,
        decline: worstMonth.growth,
      } : null,
      consistency,
      trend,
    };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'strongly-positive':
        return { name: 'trending-up', color: COLORS.success };
      case 'positive':
        return { name: 'trending-up', color: COLORS.success };
      case 'neutral':
        return { name: 'trending-flat', color: COLORS.textSecondary };
      case 'negative':
        return { name: 'trending-down', color: COLORS.error };
      case 'strongly-negative':
        return { name: 'trending-down', color: COLORS.error };
      default:
        return { name: 'trending-flat', color: COLORS.textSecondary };
    }
  };

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case 'strongly-positive':
        return 'Strongly Positive';
      case 'positive':
        return 'Positive';
      case 'neutral':
        return 'Neutral';
      case 'negative':
        return 'Negative';
      case 'strongly-negative':
        return 'Strongly Negative';
      default:
        return 'Neutral';
    }
  };

  const getConsistencyColor = (consistency: string) => {
    switch (consistency) {
      case 'high':
        return COLORS.success;
      case 'medium':
        return COLORS.warning;
      case 'low':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  const analysis = calculateTrendAnalysis();
  const trendIcon = analysis ? getTrendIcon(analysis.trend) : null;

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Trend Insights</Text>
        </View>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard} />
          <View style={styles.loadingCard} />
          <View style={styles.loadingCard} />
        </View>
      </View>
    );
  }

  // No data state
  if (!analysis) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Trend Insights</Text>
        </View>
        <View style={styles.emptyContainer}>
          <MaterialIcons name="analytics" size={32} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>
            Insufficient data for trend analysis. Add more historical data points.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Trend Insights</Text>
        <Text style={styles.subtitle}>{timePeriod.label} Analysis</Text>
      </View>

      {/* Main Trend Card */}
      <View style={styles.mainTrendCard}>
        <View style={styles.trendHeader}>
          {trendIcon && (
            <MaterialIcons 
              name={trendIcon.name as any} 
              size={24} 
              color={trendIcon.color} 
            />
          )}
          <Text style={styles.trendLabel}>
            {getTrendLabel(analysis.trend)}
          </Text>
        </View>
        
        <View style={styles.trendStats}>
          <View style={styles.trendStat}>
            <Text style={styles.trendStatValue}>
              {formatCurrency(analysis.totalGrowth)}
            </Text>
            <Text style={styles.trendStatLabel}>Total Growth</Text>
          </View>
          <View style={styles.trendStat}>
            <Text style={[
              styles.trendStatValue,
              { color: analysis.totalGrowthPercentage >= 0 ? COLORS.success : COLORS.error }
            ]}>
              {analysis.totalGrowthPercentage >= 0 ? '+' : ''}{analysis.totalGrowthPercentage.toFixed(1)}%
            </Text>
            <Text style={styles.trendStatLabel}>Growth Rate</Text>
          </View>
        </View>
      </View>

      {/* Insights Grid */}
      <View style={styles.insightsGrid}>
        {/* Average Monthly Growth */}
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <MaterialIcons name="show-chart" size={18} color={COLORS.primary} />
            <Text style={styles.insightTitle}>Avg Monthly</Text>
          </View>
          <Text style={[
            styles.insightValue,
            { color: analysis.averageMonthlyGrowth >= 0 ? COLORS.success : COLORS.error }
          ]}>
            {formatCurrency(analysis.averageMonthlyGrowth)}
          </Text>
        </View>

        {/* Consistency */}
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <MaterialIcons name="timeline" size={18} color={getConsistencyColor(analysis.consistency)} />
            <Text style={styles.insightTitle}>Consistency</Text>
          </View>
          <Text style={[
            styles.insightValue,
            { color: getConsistencyColor(analysis.consistency) }
          ]}>
            {analysis.consistency.charAt(0).toUpperCase() + analysis.consistency.slice(1)}
          </Text>
        </View>

        {/* Best Month */}
        {analysis.bestMonth && analysis.bestMonth.growth > 0 && (
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <MaterialIcons name="keyboard-arrow-up" size={18} color={COLORS.success} />
              <Text style={styles.insightTitle}>Best Month</Text>
            </View>
            <Text style={[styles.insightValue, { color: COLORS.success }]}>
              +{formatCurrency(analysis.bestMonth.growth)}
            </Text>
            <Text style={styles.insightSubtext}>
              {formatDate(analysis.bestMonth.date)}
            </Text>
          </View>
        )}

        {/* Worst Month */}
        {analysis.worstMonth && analysis.worstMonth.decline < 0 && (
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <MaterialIcons name="keyboard-arrow-down" size={18} color={COLORS.error} />
              <Text style={styles.insightTitle}>Worst Month</Text>
            </View>
            <Text style={[styles.insightValue, { color: COLORS.error }]}>
              {formatCurrency(analysis.worstMonth.decline)}
            </Text>
            <Text style={styles.insightSubtext}>
              {formatDate(analysis.worstMonth.date)}
            </Text>
          </View>
        )}
      </View>
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
    marginBottom: SPACING.lg,
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
  
  // Main trend card
  mainTrendCard: {
    backgroundColor: COLORS.backgroundContent,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  trendLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  trendStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trendStat: {
    alignItems: 'center',
  },
  trendStatValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  trendStatLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  
  // Insights grid
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  insightCard: {
    backgroundColor: COLORS.backgroundContent,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    flex: 1,
    minWidth: '45%',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  insightTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
  },
  insightValue: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  insightSubtext: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },
  
  // Loading states
  loadingContainer: {
    gap: SPACING.md,
  },
  loadingCard: {
    height: 60,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
  },
  
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: TYPOGRAPHY.sizes.md * 1.4,
  },
});