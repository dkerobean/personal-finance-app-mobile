import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/constants/design';
import { formatCurrency } from '@/lib/formatters';
import type { HistoricalDataPoint, TimePeriodConfig } from '../../../app/(app)/networth/history';

interface HistoryBreakdownTableProps {
  data: HistoricalDataPoint[];
  timePeriod: TimePeriodConfig;
  isLoading?: boolean;
  showCategoryBreakdown?: boolean;
}

type SortField = 'date' | 'netWorth' | 'assets' | 'liabilities' | 'change';
type SortDirection = 'asc' | 'desc';

interface TableRow {
  date: string;
  displayDate: string;
  netWorth: number;
  assets: number;
  liabilities: number;
  change: number;
  changePercentage: number;
}

export default function HistoryBreakdownTable({
  data,
  timePeriod,
  isLoading = false,
  showCategoryBreakdown = false,
}: HistoryBreakdownTableProps): React.ReactElement {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Transform data for table display
  const tableData: TableRow[] = data.map((point, index) => {
    const previousPoint = index > 0 ? data[index - 1] : null;
    const change = previousPoint ? point.netWorth - previousPoint.netWorth : 0;
    const changePercentage = previousPoint && previousPoint.netWorth !== 0 
      ? (change / previousPoint.netWorth) * 100 
      : 0;

    return {
      date: point.date,
      displayDate: new Date(point.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: timePeriod.months > 12 ? '2-digit' : 'numeric',
      }),
      netWorth: point.netWorth,
      assets: point.totalAssets,
      liabilities: point.totalLiabilities,
      change,
      changePercentage,
    };
  });

  // Sort data
  const sortedData = [...tableData].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'netWorth':
        comparison = a.netWorth - b.netWorth;
        break;
      case 'assets':
        comparison = a.assets - b.assets;
        break;
      case 'liabilities':
        comparison = a.liabilities - b.liabilities;
        break;
      case 'change':
        comparison = a.change - b.change;
        break;
      default:
        comparison = 0;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Handle row expansion for category breakdown
  const toggleRowExpansion = (date: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedRows(newExpanded);
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <MaterialIcons name="unfold-more" size={16} color={COLORS.textSecondary} />;
    }
    return sortDirection === 'asc' 
      ? <MaterialIcons name="keyboard-arrow-up" size={16} color={COLORS.primary} />
      : <MaterialIcons name="keyboard-arrow-down" size={16} color={COLORS.primary} />;
  };

  // Render table header
  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <TouchableOpacity 
        style={styles.headerCell} 
        onPress={() => handleSort('date')}
        activeOpacity={0.7}
      >
        <Text style={styles.headerText}>Date</Text>
        {getSortIcon('date')}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.headerCell, styles.numberCell]} 
        onPress={() => handleSort('netWorth')}
        activeOpacity={0.7}
      >
        <Text style={styles.headerText}>Net Worth</Text>
        {getSortIcon('netWorth')}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.headerCell, styles.numberCell]} 
        onPress={() => handleSort('assets')}
        activeOpacity={0.7}
      >
        <Text style={styles.headerText}>Assets</Text>
        {getSortIcon('assets')}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.headerCell, styles.numberCell]} 
        onPress={() => handleSort('liabilities')}
        activeOpacity={0.7}
      >
        <Text style={styles.headerText}>Liabilities</Text>
        {getSortIcon('liabilities')}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.headerCell, styles.numberCell]} 
        onPress={() => handleSort('change')}
        activeOpacity={0.7}
      >
        <Text style={styles.headerText}>Change</Text>
        {getSortIcon('change')}
      </TouchableOpacity>
    </View>
  );

  // Render table row
  const renderTableRow = (row: TableRow, index: number) => {
    const isExpanded = expandedRows.has(row.date);
    const originalDataPoint = data.find(d => d.date === row.date);
    
    return (
      <View key={row.date}>
        <TouchableOpacity
          style={[
            styles.tableRow,
            index % 2 === 0 && styles.evenRow,
            isExpanded && styles.expandedRow,
          ]}
          onPress={showCategoryBreakdown ? () => toggleRowExpansion(row.date) : undefined}
          activeOpacity={showCategoryBreakdown ? 0.7 : 1}
        >
          <View style={styles.rowCell}>
            <View style={styles.dateCell}>
              <Text style={styles.cellText}>{row.displayDate}</Text>
              {showCategoryBreakdown && (
                <MaterialIcons 
                  name={isExpanded ? "expand-less" : "expand-more"} 
                  size={16} 
                  color={COLORS.textSecondary} 
                />
              )}
            </View>
          </View>
          
          <View style={[styles.rowCell, styles.numberCell]}>
            <Text style={styles.cellText}>
              {formatCurrency(row.netWorth, { compact: true })}
            </Text>
          </View>
          
          <View style={[styles.rowCell, styles.numberCell]}>
            <Text style={styles.cellText}>
              {formatCurrency(row.assets, { compact: true })}
            </Text>
          </View>
          
          <View style={[styles.rowCell, styles.numberCell]}>
            <Text style={styles.cellText}>
              {formatCurrency(row.liabilities, { compact: true })}
            </Text>
          </View>
          
          <View style={[styles.rowCell, styles.numberCell]}>
            <Text style={[
              styles.cellText,
              { color: row.change >= 0 ? COLORS.success : COLORS.error }
            ]}>
              {row.change >= 0 ? '+' : ''}{formatCurrency(row.change, { compact: true })}
            </Text>
            {row.changePercentage !== 0 && (
              <Text style={[
                styles.percentageText,
                { color: row.changePercentage >= 0 ? COLORS.success : COLORS.error }
              ]}>
                ({row.changePercentage >= 0 ? '+' : ''}{row.changePercentage.toFixed(1)}%)
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Category Breakdown (if expanded) */}
        {isExpanded && originalDataPoint && (
          <View style={styles.categoryBreakdown}>
            <View style={styles.breakdownSection}>
              <Text style={styles.breakdownTitle}>Assets Breakdown</Text>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Connected Accounts</Text>
                <Text style={styles.breakdownValue}>
                  {formatCurrency(originalDataPoint.connectedValue)}
                </Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Manual Assets</Text>
                <Text style={styles.breakdownValue}>
                  {formatCurrency(originalDataPoint.manualAssets)}
                </Text>
              </View>
            </View>
            
            <View style={styles.breakdownSection}>
              <Text style={styles.breakdownTitle}>Liabilities Breakdown</Text>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Manual Liabilities</Text>
                <Text style={styles.breakdownValue}>
                  {formatCurrency(originalDataPoint.manualLiabilities)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Historical Breakdown</Text>
        </View>
        <View style={styles.loadingContainer}>
          {[1, 2, 3, 4, 5].map((item) => (
            <View key={item} style={styles.loadingRow} />
          ))}
        </View>
      </View>
    );
  }

  // Empty state
  if (sortedData.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Historical Breakdown</Text>
        </View>
        <View style={styles.emptyContainer}>
          <MaterialIcons name="table-chart" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>No Historical Data</Text>
          <Text style={styles.emptyText}>
            Historical breakdown will appear here once you have tracked data over time.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Historical Breakdown</Text>
        <Text style={styles.subtitle}>
          {sortedData.length} data points • {timePeriod.label} view
        </Text>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tableContainer}>
          {renderTableHeader()}
          <ScrollView showsVerticalScrollIndicator={false}>
            {sortedData.map((row, index) => renderTableRow(row, index))}
          </ScrollView>
        </View>
      </ScrollView>
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
  
  // Table styles
  tableContainer: {
    minWidth: 600, // Ensure horizontal scrolling
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundContent,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.xs,
  },
  headerCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    gap: SPACING.xs,
  },
  numberCell: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  headerText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    minHeight: 50,
  },
  evenRow: {
    backgroundColor: `${COLORS.backgroundContent}50`,
  },
  expandedRow: {
    backgroundColor: `${COLORS.primary}10`,
  },
  rowCell: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  dateCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cellText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  percentageText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    marginTop: SPACING.xs,
  },
  
  // Category breakdown styles
  categoryBreakdown: {
    backgroundColor: COLORS.backgroundContent,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.md,
  },
  breakdownSection: {
    gap: SPACING.sm,
  },
  breakdownTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  breakdownLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  breakdownValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  
  // Loading state
  loadingContainer: {
    gap: SPACING.sm,
  },
  loadingRow: {
    height: 50,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
  },
  
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.md * 1.4,
    paddingHorizontal: SPACING.lg,
  },
});