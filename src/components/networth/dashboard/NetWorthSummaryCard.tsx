import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/constants/design';
import { formatCurrency } from '@/lib/formatters';

interface NetWorthSummaryCardProps {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  monthlyChange?: number;
  monthlyChangePercentage?: number;
  isLoading?: boolean;
  onPress?: () => void;
}

export default function NetWorthSummaryCard({
  netWorth,
  totalAssets,
  totalLiabilities,
  monthlyChange = 0,
  monthlyChangePercentage = 0,
  isLoading = false,
  onPress,
}: NetWorthSummaryCardProps): React.ReactElement {
  const isPositive = netWorth >= 0;
  const isGrowth = monthlyChange > 0;
  
  const getTrendColor = () => {
    if (monthlyChange === 0) return COLORS.textSecondary;
    return isGrowth ? COLORS.success : COLORS.error;
  };

  const getTrendIcon = () => {
    if (monthlyChange === 0) return 'trending-flat';
    return isGrowth ? 'trending-up' : 'trending-down';
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingNetWorth} />
          <View style={styles.loadingTrend} />
          <View style={styles.loadingBreakdown}>
            <View style={styles.loadingBreakdownItem} />
            <View style={styles.loadingBreakdownItem} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Net Worth</Text>
        <MaterialIcons 
          name="info-outline" 
          size={20} 
          color={COLORS.white} 
          style={styles.infoIcon}
        />
      </View>

      {/* Main Net Worth Display */}
      <View style={styles.netWorthContainer}>
        <Text style={[
          styles.netWorthAmount, 
          { color: isPositive ? COLORS.white : COLORS.warning }
        ]}>
          {formatCurrency(Math.abs(netWorth))}
        </Text>
        {!isPositive && (
          <Text style={styles.negativeIndicator}>
            (Negative)
          </Text>
        )}
      </View>

      {/* Monthly Change Indicator */}
      {monthlyChange !== 0 && (
        <View style={styles.trendContainer}>
          <MaterialIcons 
            name={getTrendIcon()} 
            size={18} 
            color={getTrendColor()} 
          />
          <Text style={[styles.trendText, { color: getTrendColor() }]}>
            {formatCurrency(Math.abs(monthlyChange))} 
            ({Math.abs(monthlyChangePercentage).toFixed(1)}%) this month
          </Text>
        </View>
      )}

      {/* Assets vs Liabilities Breakdown */}
      <View style={styles.breakdownContainer}>
        <View style={styles.breakdownItem}>
          <View style={styles.breakdownHeader}>
            <MaterialIcons name="trending-up" size={16} color={COLORS.white} />
            <Text style={styles.breakdownLabel}>Total Assets</Text>
          </View>
          <Text style={styles.breakdownAmount}>
            {formatCurrency(totalAssets)}
          </Text>
        </View>

        <View style={styles.breakdownDivider} />

        <View style={styles.breakdownItem}>
          <View style={styles.breakdownHeader}>
            <MaterialIcons name="trending-down" size={16} color={COLORS.white} />
            <Text style={styles.breakdownLabel}>Total Liabilities</Text>
          </View>
          <Text style={styles.breakdownAmount}>
            {formatCurrency(totalLiabilities)}
          </Text>
        </View>
      </View>

      {/* Bottom Curved Design */}
      <View style={styles.curveContainer}>
        <View style={styles.curve} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    position: 'relative',
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  infoIcon: {
    opacity: 0.8,
  },
  netWorthContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  netWorthAmount: {
    fontSize: 36,
    fontWeight: TYPOGRAPHY.weights.bold,
    textAlign: 'center',
  },
  negativeIndicator: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.warning,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginTop: SPACING.xs,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    alignSelf: 'center',
  },
  trendText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginLeft: SPACING.xs,
  },
  breakdownContainer: {
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
  breakdownLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.white,
    marginLeft: SPACING.xs,
    opacity: 0.9,
  },
  breakdownAmount: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  breakdownDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: SPACING.md,
  },
  curveContainer: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    height: 40,
    overflow: 'hidden',
  },
  curve: {
    position: 'absolute',
    bottom: 0,
    left: -20,
    right: -20,
    height: 60,
    backgroundColor: COLORS.backgroundContent,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  // Loading states
  loadingContainer: {
    opacity: 0.6,
  },
  loadingNetWorth: {
    width: 200,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  loadingTrend: {
    width: 150,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  loadingBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  loadingBreakdownItem: {
    width: 80,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BORDER_RADIUS.sm,
  },
});