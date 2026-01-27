import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { COLORS, SPACING, SHADOWS, TYPOGRAPHY } from '@/constants/design';
import { formatCurrency } from '@/lib/formatters';

interface ModernNetWorthCardProps {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  isLoading?: boolean;
}

const { width } = Dimensions.get('window');

const timeRanges = ['1W', '1M', '3M', 'YTD', 'ALL'];

export default function ModernNetWorthCard({ 
  totalAssets, 
  totalLiabilities, 
  netWorth,
  isLoading 
}: ModernNetWorthCardProps) {
  const [selectedRange, setSelectedRange] = useState('1M');

  // Placeholder data for the background chart
  const chartData = {
    labels: ['1', '2', '3', '4', '5', '6'],
    datasets: [
      {
        data: [
          netWorth * 0.9,
          netWorth * 0.92,
          netWorth * 0.95,
          netWorth * 0.98,
          netWorth * 0.96,
          netWorth
        ],
        strokeWidth: 2,
      },
    ],
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NET WORTH</Text>
        <TouchableOpacity>
          <MaterialIcons name="more-vert" size={20} color={COLORS.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Main Balance with Add Button */}
      <View style={styles.balanceContainer}>
        <View>
          <Text style={styles.netWorthValue}>{formatCurrency(netWorth)}</Text>
          <Text style={styles.changeText}>+$0 (0%)</Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <MaterialIcons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Chart Background (Simplified representation) */}
      <View style={styles.chartContainer}>
         <LineChart
          data={chartData}
          width={width - 80} // Card width approx
          height={100}
          withDots={false}
          withInnerLines={false}
          withOuterLines={false}
          withVerticalLabels={false}
          withHorizontalLabels={false}
          chartConfig={{
            backgroundColor: COLORS.white,
            backgroundGradientFrom: COLORS.white,
            backgroundGradientTo: COLORS.white,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 109, 79, ${opacity * 0.4})`, // Primary color with opacity
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          style={styles.chart}
          bezier
        />
        
        {/* Info Bubble (Static for mockup matching reference) */}
        <View style={styles.infoBubble}>
          <Text style={styles.infoText}>
            Building wealth takes time. Your net worth graph takes a week to populate.
          </Text>
        </View>
      </View>

      {/* Time Range Selectors */}
      <View style={styles.timeFilterContainer}>
        {timeRanges.map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.timeFilterButton,
              selectedRange === range && styles.activeTimeFilter
            ]}
            onPress={() => setSelectedRange(range)}
          >
            <Text style={[
              styles.timeFilterText,
              selectedRange === range && styles.activeTimeFilterText
            ]}>
              {range}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Assets vs Liabilities Split */}
      <View style={styles.splitSection}>
        <View style={styles.splitItem}>
          <Text style={styles.splitLabel}>Assets</Text>
          <Text style={styles.splitValue}>{formatCurrency(totalAssets)}</Text>
          {/* Active Indicator Line */}
          <View style={styles.activeLine} />
        </View>
        
        <View style={styles.splitItem}>
          <Text style={styles.splitLabel}>Liabilities</Text>
          <Text style={styles.splitValue}>{formatCurrency(totalLiabilities)}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
           {/* Simulate Asset Breakdown: 70% Assets, 30% gap? No, it's just a visual bar */}
           <View style={[styles.progressSegment, { flex: 1, backgroundColor: '#A7C4A0' }]} /> 
        </View>
      </View>

      {/* Asset List Item (Cash) */}
      <View style={styles.assetList}>
        <View style={styles.assetRow}>
          <View style={styles.assetIcon} />
          <Text style={styles.assetName}>Cash</Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.assetValue}>{formatCurrency(totalAssets)}</Text>
          <MaterialIcons name="keyboard-arrow-down" size={24} color={COLORS.textTertiary} />
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 24,
    marginHorizontal: 16,
    marginTop: 20,
    ...SHADOWS.sm, // lighter shadow for cleaner look
    elevation: 2,
    borderWidth: 1, // Optional: subtle border
    borderColor: '#F3F4F6', 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textTertiary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  netWorthValue: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  changeText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6B7280', // As per reference (looks dark gray/slate)
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {
    marginBottom: 24,
    alignItems: 'center',
    position: 'relative',
    height: 140, 
    justifyContent: 'flex-end',
  },
  chart: {
    paddingRight: 0,
    paddingLeft: 0,
    position: 'absolute',
    bottom: -10,
  },
  infoBubble: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    zIndex: 10,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  timeFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  timeFilterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  activeTimeFilter: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.textTertiary,
  },
  timeFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  activeTimeFilterText: {
    color: COLORS.textPrimary,
  },
  splitSection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  splitItem: {
    flex: 1,
    alignItems: 'center',
  },
  splitLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  splitValue: {
    fontSize: 15,
    color: COLORS.textTertiary,
  },
  activeLine: {
    height: 2,
    backgroundColor: '#6B7280', // Active specific line
    width: '100%',
    marginTop: 16,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressSegment: {
    height: '100%',
  },
  assetList: {
    marginTop: 8,
  },
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#A7C4A0',
    marginRight: 12,
  },
  assetName: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  assetValue: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginRight: 8,
  },
});
