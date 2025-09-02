import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/constants/design';

interface HealthMetric {
  label: string;
  score: number;
  weight: number;
  icon: string;
  description: string;
}

interface FinancialHealthScoreProps {
  totalAssets: number;
  totalLiabilities: number;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  savingsRate?: number;
  isLoading?: boolean;
  onViewDetails?: () => void;
}

const CIRCLE_SIZE = 120;
const CIRCLE_RADIUS = 50;
const STROKE_WIDTH = 8;

export default function FinancialHealthScore({
  totalAssets,
  totalLiabilities,
  monthlyIncome = 0,
  monthlyExpenses = 0,
  savingsRate = 0,
  isLoading = false,
  onViewDetails,
}: FinancialHealthScoreProps): React.ReactElement {
  const [animatedValue] = useState(new Animated.Value(0));
  const [displayScore, setDisplayScore] = useState(0);

  // Calculate financial health metrics
  const calculateHealthScore = (): { score: number; metrics: HealthMetric[] } => {
    const netWorth = totalAssets - totalLiabilities;
    const debtToAssetRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
    const netWorthPositive = netWorth > 0 ? 100 : Math.max(0, 50 + (netWorth / 10000) * 50);
    const liquidityScore = monthlyIncome > 0 ? Math.min(100, (monthlyIncome / monthlyExpenses) * 20) : 50;
    const debtScore = Math.max(0, 100 - debtToAssetRatio);
    const savingsScore = Math.min(100, savingsRate * 5);

    const metrics: HealthMetric[] = [
      {
        label: 'Net Worth Position',
        score: netWorthPositive,
        weight: 0.3,
        icon: 'account-balance-wallet',
        description: netWorth > 0 ? 'Positive net worth' : 'Work on increasing assets',
      },
      {
        label: 'Debt Management',
        score: debtScore,
        weight: 0.25,
        icon: 'trending-down',
        description: debtToAssetRatio < 30 ? 'Good debt ratio' : 'Consider reducing debt',
      },
      {
        label: 'Liquidity Ratio',
        score: liquidityScore,
        weight: 0.25,
        icon: 'water-drop',
        description: liquidityScore > 80 ? 'Strong cash flow' : 'Monitor cash flow',
      },
      {
        label: 'Savings Rate',
        score: savingsScore,
        weight: 0.2,
        icon: 'savings',
        description: savingsRate > 10 ? 'Great savings habit' : 'Increase savings rate',
      },
    ];

    const weightedScore = metrics.reduce((total, metric) => total + (metric.score * metric.weight), 0);
    return { score: Math.round(weightedScore), metrics };
  };

  const { score, metrics } = calculateHealthScore();

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: score,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    const listener = animatedValue.addListener(({ value }) => {
      setDisplayScore(Math.round(value));
    });

    return () => animatedValue.removeListener(listener);
  }, [score]);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return COLORS.success;
    if (score >= 60) return COLORS.warning;
    return COLORS.error;
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const circumference = 2 * Math.PI * CIRCLE_RADIUS;

  const renderProgressRing = () => {
    return (
      <View style={styles.ringContainer}>
        <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
          {/* Background circle */}
          <Circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={CIRCLE_RADIUS}
            stroke={COLORS.backgroundInput}
            strokeWidth={STROKE_WIDTH}
            fill="transparent"
          />
          
          {/* Progress circle */}
          <Animated.View>
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={CIRCLE_RADIUS}
              stroke={getScoreColor(score)}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={animatedValue.interpolate({
                inputRange: [0, 100],
                outputRange: [circumference, 0],
              })}
              strokeLinecap="round"
            />
          </Animated.View>
          
          {/* Center text */}
          <SvgText
            x={CIRCLE_SIZE / 2}
            y={CIRCLE_SIZE / 2 - 8}
            textAnchor="middle"
            fontSize={24}
            fontWeight="bold"
            fill={getScoreColor(score)}
          >
            {displayScore}
          </SvgText>
          <SvgText
            x={CIRCLE_SIZE / 2}
            y={CIRCLE_SIZE / 2 + 12}
            textAnchor="middle"
            fontSize={12}
            fill={COLORS.textSecondary}
          >
            /100
          </SvgText>
        </Svg>
        
        <View style={styles.scoreInfo}>
          <Text style={[styles.scoreLabel, { color: getScoreColor(score) }]}>
            {getScoreLabel(score)}
          </Text>
          <Text style={styles.scoreDescription}>
            Your financial health score
          </Text>
        </View>
      </View>
    );
  };

  const renderMetrics = () => (
    <View style={styles.metricsContainer}>
      {metrics.map((metric, index) => (
        <View key={index} style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <MaterialIcons
              name={metric.icon as any}
              size={20}
              color={getScoreColor(metric.score)}
            />
            <Text style={styles.metricLabel}>{metric.label}</Text>
            <Text style={[styles.metricScore, { color: getScoreColor(metric.score) }]}>
              {Math.round(metric.score)}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${metric.score}%`,
                  backgroundColor: getScoreColor(metric.score),
                }
              ]}
            />
          </View>
          <Text style={styles.metricDescription}>{metric.description}</Text>
        </View>
      ))}
    </View>
  );

  const renderInsights = () => {
    const insights: string[] = [];
    
    if (score >= 80) {
      insights.push("You're doing great! Keep up the excellent financial habits.");
    } else if (score >= 60) {
      insights.push("Good progress! Focus on the areas that need improvement.");
    } else {
      insights.push("Consider creating a budget and debt reduction plan.");
    }

    if (totalAssets < totalLiabilities) {
      insights.push("Work on building assets and reducing liabilities.");
    }

    if (savingsRate < 10) {
      insights.push("Try to save at least 10-20% of your income.");
    }

    return (
      <View style={styles.insightsContainer}>
        <Text style={styles.insightsTitle}>💡 Insights & Tips</Text>
        {insights.map((insight, index) => (
          <View key={index} style={styles.insightItem}>
            <View style={styles.insightBullet} />
            <Text style={styles.insightText}>{insight}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.loadingTitle} />
          <View style={styles.loadingIcon} />
        </View>
        <View style={styles.loadingContent}>
          <View style={styles.loadingRing} />
          <View style={styles.loadingMetrics}>
            <View style={styles.loadingMetricItem} />
            <View style={styles.loadingMetricItem} />
            <View style={styles.loadingMetricItem} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Financial Health Score</Text>
        <TouchableOpacity onPress={onViewDetails}>
          <MaterialIcons name="info-outline" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {renderProgressRing()}
      {renderMetrics()}
      {renderInsights()}

      <TouchableOpacity style={styles.actionButton} onPress={onViewDetails}>
        <Text style={styles.actionButtonText}>View Detailed Analysis</Text>
        <MaterialIcons name="arrow-forward" size={20} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundCard,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  ringContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  scoreInfo: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  scoreLabel: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  scoreDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  metricsContainer: {
    marginBottom: SPACING.lg,
  },
  metricItem: {
    marginBottom: SPACING.lg,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  metricLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    flex: 1,
    marginLeft: SPACING.sm,
  },
  metricScore: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: 3,
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  metricDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  insightsContainer: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  insightsTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  insightBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 6,
    marginRight: SPACING.sm,
  },
  insightText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textPrimary,
    flex: 1,
    lineHeight: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.primary,
    marginRight: SPACING.sm,
  },
  // Loading states
  loadingTitle: {
    width: 180,
    height: 20,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: BORDER_RADIUS.sm,
  },
  loadingIcon: {
    width: 24,
    height: 24,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: 12,
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingRing: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: CIRCLE_SIZE / 2,
    marginBottom: SPACING.xl,
  },
  loadingMetrics: {
    width: '100%',
  },
  loadingMetricItem: {
    height: 60,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
});