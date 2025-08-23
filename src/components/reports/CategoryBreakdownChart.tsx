import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { VictoryPie, VictoryContainer, VictoryLabel } from 'victory-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { CategorySpending } from '@/types/models';

interface CategoryBreakdownChartProps {
  categoryData: CategorySpending[];
  type: 'income' | 'expense';
  isLoading?: boolean;
}

interface ChartDataPoint {
  x: string;
  y: number;
  label: string;
  color: string;
  icon: string;
}

interface LegendItemProps {
  item: CategorySpending;
  color: string;
  index: number;
}

const CHART_COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Green
  '#f59e0b', // Yellow
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16', // Lime
  '#ec4899', // Pink
  '#6b7280', // Gray
];

const { width: screenWidth } = Dimensions.get('window');
const chartSize = Math.min(screenWidth - 80, 280);

const LegendItem: React.FC<LegendItemProps> = ({ item, color, index }) => (
  <View style={styles.legendItem} testID={`legend-item-${index}`}>
    <View style={styles.legendIndicator}>
      <View style={[styles.colorDot, { backgroundColor: color }]} />
      <MaterialIcons
        name={item.categoryIcon as any || 'category'}
        size={16}
        color="#6b7280"
        style={styles.legendIcon}
      />
    </View>
    <View style={styles.legendContent}>
      <Text style={styles.legendLabel}>{item.categoryName}</Text>
      <View style={styles.legendStats}>
        <Text style={styles.legendAmount}>
          ₵{item.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
        <Text style={styles.legendPercentage}>
          {item.percentage.toFixed(1)}%
        </Text>
      </View>
      <Text style={styles.legendTransactionCount}>
        {item.transactionCount} {item.transactionCount === 1 ? 'transaction' : 'transactions'}
      </Text>
    </View>
  </View>
);

const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({
  categoryData,
  type,
  isLoading = false,
}) => {
  // Filter data by type and sort by amount
  const filteredData = categoryData
    .filter(item => item.type === type)
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // Prepare chart data
  const chartData: ChartDataPoint[] = filteredData.map((item, index) => ({
    x: item.categoryName,
    y: item.totalAmount,
    label: `${item.percentage.toFixed(1)}%`,
    color: CHART_COLORS[index % CHART_COLORS.length],
    icon: item.categoryIcon,
  }));

  const totalAmount = filteredData.reduce((sum, item) => sum + item.totalAmount, 0);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {type === 'income' ? 'Income' : 'Expense'} Breakdown
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading chart data...</Text>
        </View>
      </View>
    );
  }

  if (filteredData.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {type === 'income' ? 'Income' : 'Expense'} Breakdown
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <MaterialIcons 
            name={type === 'income' ? 'arrow-downward' : 'arrow-upward'} 
            size={48} 
            color="#d1d5db" 
          />
          <Text style={styles.emptyText}>
            No {type} data available for this month
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {type === 'income' ? 'Income' : 'Expense'} Breakdown
        </Text>
        <Text style={styles.totalAmount}>
          Total: ₵{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
      </View>

      <View style={styles.chartContainer}>
        <VictoryPie
          data={chartData}
          x="x"
          y="y"
          width={chartSize}
          height={chartSize}
          innerRadius={chartSize * 0.3}
          cornerRadius={2}
          padAngle={2}
          colorScale={chartData.map(d => d.color)}
          containerComponent={<VictoryContainer responsive={false} />}
          labelComponent={<VictoryLabel style={{ fill: "white", fontSize: 14, fontWeight: "bold" }} />}
          animate={{
            duration: 1000,
            onLoad: { duration: 500 }
          }}
        />
        
        {/* Center label */}
        <View style={styles.centerLabel}>
          <MaterialIcons
            name={type === 'income' ? 'arrow-downward' : 'arrow-upward'}
            size={24}
            color={type === 'income' ? '#16a34a' : '#dc2626'}
          />
          <Text style={styles.centerLabelText}>
            {type === 'income' ? 'Income' : 'Expenses'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.legendContainer} showsVerticalScrollIndicator={false}>
        {filteredData.map((item, index) => (
          <LegendItem
            key={`${item.categoryId}-${index}`}
            item={item}
            color={CHART_COLORS[index % CHART_COLORS.length]}
            index={index}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 16,
    color: '#6b7280',
  },
  chartContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    position: 'relative',
  },
  centerLabel: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -30 },
      { translateY: -20 }
    ],
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 4,
  },
  legendContainer: {
    maxHeight: 300,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  legendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendIcon: {
    marginLeft: 4,
  },
  legendContent: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  legendStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  legendAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginRight: 8,
  },
  legendPercentage: {
    fontSize: 14,
    color: '#6b7280',
  },
  legendTransactionCount: {
    fontSize: 12,
    color: '#9ca3af',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default CategoryBreakdownChart;