import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Layers, Calendar, Target, TrendingUp } from 'lucide-react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/design';

interface InsightCardsProps {
  topCategory: string | null;
  transactionCount: number;
  avgTransaction: number;
  savingsRate: number;
}

interface Insight Item {
  icon: React.ReactNode;
  title: string;
  value: string;
  gradientColors: [string, string];
}

export default function InsightCards({
  topCategory,
  transactionCount,
  avgTransaction,
  savingsRate
}: InsightCardsProps) {
  const insights: InsightItem[] = [
    {
      icon: <Layers size={20} color={COLORS.white} />,
      title: 'Top Category',
      value: topCategory || '--',
      gradientColors: ['#8b5cf6', '#7c3aed'],
    },
    {
      icon: <Calendar size={20} color={COLORS.white} />,
      title: 'Transactions',
      value: transactionCount.toString(),
      gradientColors: ['#3b82f6', '#2563eb'],
    },
    {
      icon: <Target size={20} color={COLORS.white} />,
      title: 'Avg Amount',
      value: `₵${avgTransaction.toFixed(0)}`,
      gradientColors: ['#10b981', '#059669'],
    },
    {
      icon: <TrendingUp size={20} color={COLORS.white} />,
      title: 'Savings',
      value: `${savingsRate.toFixed(0)}%`,
      gradientColors: ['#f59e0b', '#d97706'],
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Quick Insights</Text>
      <View style={styles.grid}>
        {insights.map((insight, index) => (
          <Animated.View
            key={insight.title}
            entering={FadeInRight.delay(index * 80).springify()}
            style={styles.cardWrapper}
          >
            <LinearGradient
              colors={insight.gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <View style={styles.iconContainer}>
                {insight.icon}
              </View>
              <Text style={styles.cardTitle}>{insight.title}</Text>
              <Text style={styles.cardValue} numberOfLines={1}>
                {insight.value}
              </Text>
              {/* Decorative circle */}
              <View style={styles.decorativeCircle} />
            </LinearGradient>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  grid: {
    flex Direction: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  cardWrapper: {
    width: '48%',
  },
  card: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    paddingVertical: SPACING.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
    minHeight: 110,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 6,
    fontWeight: '500',
  },
  cardValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  decorativeCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    bottom: -20,
    right: -20,
  },
});
