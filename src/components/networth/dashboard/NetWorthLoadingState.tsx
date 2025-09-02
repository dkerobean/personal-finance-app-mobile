import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/constants/design';

interface NetWorthLoadingStateProps {
  showTrendChart?: boolean;
}

export default function NetWorthLoadingState({
  showTrendChart = true,
}: NetWorthLoadingStateProps): React.ReactElement {
  const pulseAnimation = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    
    pulse.start();

    return () => pulse.stop();
  }, [pulseAnimation]);

  const opacityStyle = {
    opacity: pulseAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    }),
  };

  return (
    <View style={styles.container}>
      {/* Net Worth Summary Card Loading */}
      <View style={styles.summaryCard}>
        <View style={styles.cardHeader}>
          <Animated.View style={[styles.titleSkeleton, opacityStyle]} />
          <Animated.View style={[styles.iconSkeleton, opacityStyle]} />
        </View>
        
        <View style={styles.netWorthSection}>
          <Animated.View style={[styles.netWorthValueSkeleton, opacityStyle]} />
          <Animated.View style={[styles.changeBadgeSkeleton, opacityStyle]} />
        </View>

        <View style={styles.breakdownSection}>
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownHeader}>
              <Animated.View style={[styles.iconSmallSkeleton, opacityStyle]} />
              <Animated.View style={[styles.labelSkeleton, opacityStyle]} />
            </View>
            <Animated.View style={[styles.amountSkeleton, opacityStyle]} />
          </View>

          <View style={styles.breakdownDivider} />

          <View style={styles.breakdownItem}>
            <View style={styles.breakdownHeader}>
              <Animated.View style={[styles.iconSmallSkeleton, opacityStyle]} />
              <Animated.View style={[styles.labelSkeleton, opacityStyle]} />
            </View>
            <Animated.View style={[styles.amountSkeleton, opacityStyle]} />
          </View>
        </View>
      </View>

      {/* Breakdown Chart Loading */}
      <View style={styles.breakdownCard}>
        <View style={styles.cardHeaderWithButton}>
          <Animated.View style={[styles.titleSkeleton, opacityStyle]} />
          <Animated.View style={[styles.buttonSkeleton, opacityStyle]} />
        </View>
        
        <View style={styles.chartSection}>
          <View style={styles.chartRow}>
            <Animated.View style={[styles.chartBarSkeleton, opacityStyle]} />
            <Animated.View style={[styles.chartLabelSkeleton, opacityStyle]} />
          </View>
          <View style={styles.chartRow}>
            <Animated.View style={[styles.chartBarSkeleton, opacityStyle]} />
            <Animated.View style={[styles.chartLabelSkeleton, opacityStyle]} />
          </View>
        </View>

        <View style={styles.categoryBreakdown}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.categoryItem}>
              <Animated.View style={[styles.categoryIconSkeleton, opacityStyle]} />
              <View style={styles.categoryInfo}>
                <Animated.View style={[styles.categoryNameSkeleton, opacityStyle]} />
                <Animated.View style={[styles.categoryAmountSkeleton, opacityStyle]} />
              </View>
              <Animated.View style={[styles.categoryPercentageSkeleton, opacityStyle]} />
            </View>
          ))}
        </View>
      </View>

      {/* Quick Actions Loading */}
      <View style={styles.quickActionsCard}>
        <Animated.View style={[styles.titleSkeleton, opacityStyle]} />
        
        <View style={styles.actionsGrid}>
          {[1, 2, 3, 4].map((item) => (
            <View key={item} style={styles.actionButton}>
              <Animated.View style={[styles.actionIconSkeleton, opacityStyle]} />
              <Animated.View style={[styles.actionLabelSkeleton, opacityStyle]} />
            </View>
          ))}
        </View>
        
        <View style={styles.fullWidthAction}>
          <Animated.View style={[styles.fullWidthActionSkeleton, opacityStyle]} />
        </View>
      </View>

      {/* Trend Chart Loading */}
      {showTrendChart && (
        <View style={styles.trendCard}>
          <View style={styles.cardHeaderWithButton}>
            <View style={styles.trendHeader}>
              <Animated.View style={[styles.titleSkeleton, opacityStyle]} />
              <Animated.View style={[styles.changeBadgeSmallSkeleton, opacityStyle]} />
            </View>
            <Animated.View style={[styles.buttonSkeleton, opacityStyle]} />
          </View>
          
          <View style={styles.chartContainer}>
            <Animated.View style={[styles.trendChartSkeleton, opacityStyle]} />
          </View>

          <View style={styles.monthLabels}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Animated.View 
                key={item} 
                style={[styles.monthLabelSkeleton, opacityStyle]} 
              />
            ))}
          </View>
        </View>
      )}

      {/* Financial Health Score Loading */}
      <View style={styles.healthScoreCard}>
        <Animated.View style={[styles.titleSkeleton, opacityStyle]} />
        <View style={styles.scoreSection}>
          <Animated.View style={[styles.scoreCircleSkeleton, opacityStyle]} />
          <View style={styles.scoreDetails}>
            <Animated.View style={[styles.scoreValueSkeleton, opacityStyle]} />
            <Animated.View style={[styles.scoreDescriptionSkeleton, opacityStyle]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundContent,
  },
  
  // Card containers
  summaryCard: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.lg,
  },
  breakdownCard: {
    backgroundColor: COLORS.backgroundCard,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  quickActionsCard: {
    backgroundColor: COLORS.backgroundCard,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  trendCard: {
    backgroundColor: COLORS.backgroundCard,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  healthScoreCard: {
    backgroundColor: COLORS.backgroundCard,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },

  // Common skeletons
  titleSkeleton: {
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BORDER_RADIUS.sm,
    width: 120,
  },
  iconSkeleton: {
    width: 20,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
  },
  iconSmallSkeleton: {
    width: 16,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
  },
  buttonSkeleton: {
    height: 24,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    width: 60,
  },

  // Header layouts
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  cardHeaderWithButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  trendHeader: {
    flex: 1,
  },

  // Net Worth Summary specific
  netWorthSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  netWorthValueSkeleton: {
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BORDER_RADIUS.md,
    width: 200,
    marginBottom: SPACING.sm,
  },
  changeBadgeSkeleton: {
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BORDER_RADIUS.lg,
    width: 150,
  },
  changeBadgeSmallSkeleton: {
    height: 16,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    width: 100,
    marginTop: SPACING.xs,
  },
  breakdownSection: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  breakdownDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: SPACING.md,
  },
  labelSkeleton: {
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BORDER_RADIUS.sm,
    width: 80,
    marginLeft: SPACING.xs,
  },
  amountSkeleton: {
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BORDER_RADIUS.sm,
    width: 100,
  },

  // Chart section
  chartSection: {
    marginBottom: SPACING.lg,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  chartBarSkeleton: {
    height: 20,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    flex: 1,
    marginRight: SPACING.md,
  },
  chartLabelSkeleton: {
    height: 16,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    width: 60,
  },

  // Category breakdown
  categoryBreakdown: {
    marginTop: SPACING.md,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  categoryIconSkeleton: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.border,
    borderRadius: 16,
    marginRight: SPACING.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryNameSkeleton: {
    height: 16,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    width: 80,
    marginBottom: SPACING.xs,
  },
  categoryAmountSkeleton: {
    height: 14,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    width: 60,
  },
  categoryPercentageSkeleton: {
    height: 20,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    width: 40,
  },

  // Quick Actions
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  actionButton: {
    width: '48%',
    marginBottom: SPACING.md,
    marginRight: '2%',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
  },
  actionIconSkeleton: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.backgroundContent,
    borderRadius: 16,
    marginBottom: SPACING.sm,
  },
  actionLabelSkeleton: {
    height: 14,
    backgroundColor: COLORS.backgroundContent,
    borderRadius: BORDER_RADIUS.sm,
    width: 80,
  },
  fullWidthAction: {
    marginTop: SPACING.sm,
  },
  fullWidthActionSkeleton: {
    height: 44,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    width: '100%',
  },

  // Trend Chart
  chartContainer: {
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  trendChartSkeleton: {
    width: '100%',
    height: 150,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
  },
  monthLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xs,
  },
  monthLabelSkeleton: {
    height: 12,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    width: 20,
  },

  // Financial Health Score
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  scoreCircleSkeleton: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.border,
    borderRadius: 40,
    marginRight: SPACING.lg,
  },
  scoreDetails: {
    flex: 1,
  },
  scoreValueSkeleton: {
    height: 32,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    width: 60,
    marginBottom: SPACING.sm,
  },
  scoreDescriptionSkeleton: {
    height: 16,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    width: 120,
  },
});