import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChevronRight, PieChart } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  FadeInDown
} from 'react-native-reanimated';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/design';
import { mapIconName } from '@/utils/iconMapping';

interface CategoryData {
  categoryName: string;
  categoryIcon?: string;
  totalAmount: number;
  transactionCount: number;
}

interface CategoryBreakdownCardProps {
  categories: CategoryData[];
  totalExpenses: number;
  onViewAll?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Gradient colors for category items
const categoryColors = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
];

export default function CategoryBreakdownCard({
  categories,
  totalExpenses,
  onViewAll
}: CategoryBreakdownCardProps) {
  const topCategories = categories.slice(0, 5);

  const formatCurrency = (amount: number): string => {
    return `₵${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const getPercentage = (amount: number): number => {
    if (totalExpenses === 0) return 0;
    return Math.round((amount / totalExpenses) * 100);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <PieChart size={18} color={COLORS.primary} />
          </View>
          <Text style={styles.headerTitle}>Spending by Category</Text>
        </View>
        {onViewAll && (
          <Pressable style={styles.viewAllButton} onPress={onViewAll}>
            <Text style={styles.viewAllText}>View All</Text>
            <ChevronRight size={16} color={COLORS.primary} />
          </Pressable>
        )}
      </View>

      {/* Category List */}
      {topCategories.length > 0 ? (
        <View style={styles.categoryList}>
          {topCategories.map((category, index) => {
            const percentage = getPercentage(category.totalAmount);
            const color = categoryColors[index % categoryColors.length];
            const iconName = mapIconName(category.categoryIcon, category.categoryName);

            return (
              <Animated.View
                key={category.categoryName}
                entering={FadeInDown.delay(index * 50).springify()}
                style={styles.categoryItem}
              >
                <View style={styles.categoryLeft}>
                  <View style={[styles.categoryIcon, { backgroundColor: color + '20' }]}>
                    <Ionicons name={iconName as any} size={18} color={color} />
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName} numberOfLines={1}>
                      {category.categoryName}
                    </Text>
                    <Text style={styles.categoryCount}>
                      {category.transactionCount} transaction{category.transactionCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>

                <View style={styles.categoryRight}>
                  <Text style={styles.categoryAmount}>{formatCurrency(category.totalAmount)}</Text>
                  <View style={styles.percentageContainer}>
                    <View style={[styles.percentageBadge, { backgroundColor: color + '20' }]}>
                      <Text style={[styles.percentageText, { color }]}>{percentage}%</Text>
                    </View>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.progressContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { width: `${percentage}%`, backgroundColor: color }
                    ]} 
                  />
                </View>
              </Animated.View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <PieChart size={40} color="#d1d5db" />
          <Text style={styles.emptyText}>No spending data yet</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  categoryList: {
    gap: SPACING.md,
  },
  categoryItem: {
    position: 'relative',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xs,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  categoryCount: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  categoryRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  percentageContainer: {
    marginTop: 2,
  },
  percentageBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  percentageText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '600',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 2,
    marginTop: SPACING.sm,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textTertiary,
  },
});
