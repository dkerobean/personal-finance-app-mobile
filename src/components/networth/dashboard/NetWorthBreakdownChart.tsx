import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/constants/design';
import { formatCurrency } from '@/lib/formatters';
import { AssetCategory, LiabilityCategory } from '@/types/models';

interface BreakdownItem {
  category: AssetCategory | LiabilityCategory;
  amount: number;
  percentage: number;
  color: string;
  type: 'asset' | 'liability';
  isConnected?: boolean; // Whether this comes from connected accounts
  itemCount?: number; // Number of items in this category
}

interface NetWorthBreakdownChartProps {
  totalAssets: number;
  totalLiabilities: number;
  assetsBreakdown: BreakdownItem[];
  liabilitiesBreakdown: BreakdownItem[];
  isLoading?: boolean;
  onViewDetails?: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_SIZE = SCREEN_WIDTH * 0.5;
const CHART_RADIUS = CHART_SIZE / 2 - 20;
const STROKE_WIDTH = 25;

// Category colors for assets
const ASSET_COLORS = {
  property: '#4CAF50',
  investments: '#2196F3',
  cash: '#00BCD4',
  vehicles: '#FF9800',
  personal: '#9C27B0',
  business: '#607D8B',
  other: '#795548',
};

// Category colors for liabilities  
const LIABILITY_COLORS = {
  loans: '#F44336',
  credit_cards: '#E91E63',
  mortgages: '#FF5722',
  business_debt: '#9E9E9E',
  other: '#757575',
};

export default function NetWorthBreakdownChart({
  totalAssets,
  totalLiabilities,
  assetsBreakdown,
  liabilitiesBreakdown,
  isLoading = false,
  onViewDetails,
}: NetWorthBreakdownChartProps): React.ReactElement {
  const [activeView, setActiveView] = useState<'overview' | 'assets' | 'liabilities'>('overview');

  const total = totalAssets + totalLiabilities;
  const assetsPercentage = total > 0 ? (totalAssets / total) * 100 : 0;
  const liabilitiesPercentage = total > 0 ? (totalLiabilities / total) * 100 : 0;

  const circumference = 2 * Math.PI * CHART_RADIUS;
  const assetsStrokeLength = (assetsPercentage / 100) * circumference;
  const liabilitiesStrokeLength = (liabilitiesPercentage / 100) * circumference;

  const getCategoryIcon = (category: AssetCategory | LiabilityCategory, type: 'asset' | 'liability'): string => {
    if (type === 'asset') {
      const assetIconMap: Record<AssetCategory, string> = {
        property: 'home',
        investments: 'trending-up',
        cash: 'account-balance-wallet',
        vehicles: 'directions-car',
        personal: 'person',
        business: 'business',
        other: 'category',
      };
      return assetIconMap[category as AssetCategory];
    } else {
      const liabilityIconMap: Record<LiabilityCategory, string> = {
        loans: 'account-balance',
        credit_cards: 'credit-card',
        mortgages: 'home',
        business_debt: 'business',
        other: 'category',
      };
      return liabilityIconMap[category as LiabilityCategory];
    }
  };

  const renderDonutChart = () => (
    <View style={styles.chartContainer}>
      <Svg width={CHART_SIZE} height={CHART_SIZE}>
        {/* Background circle */}
        <Circle
          cx={CHART_SIZE / 2}
          cy={CHART_SIZE / 2}
          r={CHART_RADIUS}
          stroke={COLORS.backgroundInput}
          strokeWidth={STROKE_WIDTH}
          fill="transparent"
        />
        
        {/* Assets arc */}
        <Circle
          cx={CHART_SIZE / 2}
          cy={CHART_SIZE / 2}
          r={CHART_RADIUS}
          stroke={COLORS.success}
          strokeWidth={STROKE_WIDTH}
          fill="transparent"
          strokeDasharray={`${assetsStrokeLength} ${circumference}`}
          strokeDashoffset={-circumference / 4}
          strokeLinecap="round"
        />
        
        {/* Liabilities arc */}
        <Circle
          cx={CHART_SIZE / 2}
          cy={CHART_SIZE / 2}
          r={CHART_RADIUS}
          stroke={COLORS.error}
          strokeWidth={STROKE_WIDTH}
          fill="transparent"
          strokeDasharray={`${liabilitiesStrokeLength} ${circumference}`}
          strokeDashoffset={-circumference / 4 - assetsStrokeLength}
          strokeLinecap="round"
        />
        
        {/* Center text */}
        <SvgText
          x={CHART_SIZE / 2}
          y={CHART_SIZE / 2 - 10}
          textAnchor="middle"
          fontSize={16}
          fontWeight="bold"
          fill={COLORS.textPrimary}
        >
          Net Worth
        </SvgText>
        <SvgText
          x={CHART_SIZE / 2}
          y={CHART_SIZE / 2 + 15}
          textAnchor="middle"
          fontSize={14}
          fill={COLORS.textSecondary}
        >
          Breakdown
        </SvgText>
      </Svg>
    </View>
  );

  const renderLegend = () => (
    <View style={styles.legendContainer}>
      <TouchableOpacity
        style={[styles.legendItem, activeView === 'assets' && styles.legendItemActive]}
        onPress={() => setActiveView(activeView === 'assets' ? 'overview' : 'assets')}
      >
        <View style={[styles.legendColor, { backgroundColor: COLORS.success }]} />
        <View style={styles.legendTextContainer}>
          <Text style={styles.legendLabel}>Assets</Text>
          <Text style={styles.legendAmount}>{formatCurrency(totalAssets)}</Text>
        </View>
        <Text style={styles.legendPercentage}>{assetsPercentage.toFixed(1)}%</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.legendItem, activeView === 'liabilities' && styles.legendItemActive]}
        onPress={() => setActiveView(activeView === 'liabilities' ? 'overview' : 'liabilities')}
      >
        <View style={[styles.legendColor, { backgroundColor: COLORS.error }]} />
        <View style={styles.legendTextContainer}>
          <Text style={styles.legendLabel}>Liabilities</Text>
          <Text style={styles.legendAmount}>{formatCurrency(totalLiabilities)}</Text>
        </View>
        <Text style={styles.legendPercentage}>{liabilitiesPercentage.toFixed(1)}%</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCategoryBreakdown = () => {
    const items = activeView === 'assets' ? assetsBreakdown : liabilitiesBreakdown;
    const colors = activeView === 'assets' ? ASSET_COLORS : LIABILITY_COLORS;

    if (activeView === 'overview' || items.length === 0) return null;

    return (
      <View style={styles.breakdownContainer}>
        <Text style={styles.breakdownTitle}>
          {activeView === 'assets' ? 'Asset' : 'Liability'} Categories
        </Text>
        {items.slice(0, 4).map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.breakdownItem}
            onPress={() => console.log(`Navigate to ${item.category} details`)}
            activeOpacity={0.7}
          >
            <View style={styles.breakdownLeft}>
              <View style={[
                styles.breakdownColor, 
                { backgroundColor: colors[item.category as keyof typeof colors] || COLORS.textSecondary }
              ]} />
              <MaterialIcons
                name={getCategoryIcon(item.category, item.type)}
                size={20}
                color={COLORS.textSecondary}
                style={styles.breakdownIcon}
              />
              <View style={styles.breakdownInfo}>
                <Text style={styles.breakdownCategory}>
                  {item.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
                {item.itemCount && (
                  <View style={styles.breakdownMeta}>
                    <Text style={styles.breakdownCount}>
                      {item.itemCount} item{item.itemCount !== 1 ? 's' : ''}
                    </Text>
                    {item.isConnected !== undefined && (
                      <>
                        <Text style={styles.breakdownSeparator}>•</Text>
                        <MaterialIcons
                          name={item.isConnected ? 'sync' : 'create'}
                          size={12}
                          color={item.isConnected ? COLORS.success : COLORS.textSecondary}
                          style={styles.breakdownMetaIcon}
                        />
                        <Text style={styles.breakdownSource}>
                          {item.isConnected ? 'Connected' : 'Manual'}
                        </Text>
                      </>
                    )}
                  </View>
                )}
              </View>
            </View>
            <View style={styles.breakdownRight}>
              <Text style={styles.breakdownAmount}>{formatCurrency(item.amount)}</Text>
              <Text style={styles.breakdownPercentage}>{item.percentage.toFixed(1)}%</Text>
            </View>
          </TouchableOpacity>
        ))}
        {items.length > 4 && (
          <TouchableOpacity style={styles.viewMoreButton} onPress={onViewDetails}>
            <Text style={styles.viewMoreText}>View all {items.length} categories</Text>
            <MaterialIcons name="arrow-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        )}
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
        <View style={styles.loadingChart} />
        <View style={styles.loadingLegend}>
          <View style={styles.loadingLegendItem} />
          <View style={styles.loadingLegendItem} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Net Worth Composition</Text>
        <TouchableOpacity onPress={onViewDetails}>
          <MaterialIcons name="more-horiz" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {renderDonutChart()}
      {renderLegend()}
      {renderCategoryBreakdown()}
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
  chartContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  legendContainer: {
    marginBottom: SPACING.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  legendItemActive: {
    backgroundColor: COLORS.backgroundInput,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: SPACING.md,
  },
  legendTextContainer: {
    flex: 1,
  },
  legendLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  legendAmount: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  legendPercentage: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  breakdownContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.lg,
  },
  breakdownTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  breakdownColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.sm,
  },
  breakdownIcon: {
    marginRight: SPACING.sm,
  },
  breakdownInfo: {
    flex: 1,
  },
  breakdownCategory: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  breakdownMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownCount: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },
  breakdownSeparator: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginHorizontal: SPACING.xs,
  },
  breakdownMetaIcon: {
    marginRight: 2,
  },
  breakdownSource: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },
  breakdownRight: {
    alignItems: 'flex-end',
  },
  breakdownAmount: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  breakdownPercentage: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  viewMoreText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.primary,
    marginRight: SPACING.xs,
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
  loadingChart: {
    width: CHART_SIZE,
    height: CHART_SIZE,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: CHART_SIZE / 2,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  loadingLegend: {
    marginBottom: SPACING.lg,
  },
  loadingLegendItem: {
    height: 40,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
});