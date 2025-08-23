import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { MonthlyReport } from '@/types/models';

interface MonthlySummaryCardProps {
  report: MonthlyReport;
  onPress?: () => void;
  isLoading?: boolean;
}

interface SummaryItemProps {
  label: string;
  amount: number;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  backgroundColor: string;
}

const SummaryItem: React.FC<SummaryItemProps> = ({
  label,
  amount,
  icon,
  color,
  backgroundColor,
}) => (
  <View style={styles.summaryItem}>
    <View style={[styles.iconContainer, { backgroundColor }]}>
      <MaterialIcons name={icon} size={24} color={color} />
    </View>
    <View style={styles.summaryContent}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryAmount, { color }]}>
        ₵{amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </Text>
    </View>
  </View>
);

const MonthlySummaryCard: React.FC<MonthlySummaryCardProps> = ({
  report,
  onPress,
  isLoading = false,
}) => {
  const formatMonth = (monthString: string): string => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getNetIncomeColor = (netIncome: number): string => {
    if (netIncome > 0) return '#16a34a'; // Green for positive
    if (netIncome < 0) return '#dc2626'; // Red for negative
    return '#6b7280'; // Gray for zero
  };

  const getNetIncomeIcon = (netIncome: number): keyof typeof MaterialIcons.glyphMap => {
    if (netIncome > 0) return 'trending-up';
    if (netIncome < 0) return 'trending-down';
    return 'trending-flat';
  };

  if (isLoading) {
    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading monthly summary...</Text>
          </View>
        </View>
      </View>
    );
  }

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      testID="monthly-summary-card"
    >
      <View style={styles.cardContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.monthTitle}>{formatMonth(report.month)}</Text>
            <Text style={styles.transactionCount}>
              {report.transactionCount} {report.transactionCount === 1 ? 'transaction' : 'transactions'}
            </Text>
          </View>
          {onPress && (
            <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
          )}
        </View>

        {/* Summary Items */}
        <View style={styles.summaryContainer}>
          <SummaryItem
            label="Income"
            amount={report.totalIncome}
            icon="arrow-downward"
            color="#16a34a"
            backgroundColor="#dcfce7"
          />
          
          <SummaryItem
            label="Expenses"
            amount={report.totalExpenses}
            icon="arrow-upward"
            color="#dc2626"
            backgroundColor="#fee2e2"
          />
          
          <SummaryItem
            label="Net Income"
            amount={report.netIncome}
            icon={getNetIncomeIcon(report.netIncome)}
            color={getNetIncomeColor(report.netIncome)}
            backgroundColor={report.netIncome >= 0 ? "#dcfce7" : "#fee2e2"}
          />
        </View>

        {/* Additional Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Avg Transaction</Text>
            <Text style={styles.statValue}>
              ₵{report.avgTransactionAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Income Transactions</Text>
            <Text style={styles.statValue}>{report.incomeTransactionCount}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Expense Transactions</Text>
            <Text style={styles.statValue}>{report.expenseTransactionCount}</Text>
          </View>
        </View>

        {/* Largest Transactions */}
        {(report.largestExpense || report.largestIncome) && (
          <View style={styles.largestTransactionsContainer}>
            <Text style={styles.sectionTitle}>Notable Transactions</Text>
            
            {report.largestIncome && (
              <View style={styles.largestTransaction}>
                <MaterialIcons name="arrow-downward" size={16} color="#16a34a" />
                <Text style={styles.largestTransactionText}>
                  Largest Income: ₵{report.largestIncome.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  {report.largestIncome.category_name && ` (${report.largestIncome.category_name})`}
                </Text>
              </View>
            )}
            
            {report.largestExpense && (
              <View style={styles.largestTransaction}>
                <MaterialIcons name="arrow-upward" size={16} color="#dc2626" />
                <Text style={styles.largestTransactionText}>
                  Largest Expense: ₵{report.largestExpense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  {report.largestExpense.category_name && ` (${report.largestExpense.category_name})`}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  transactionCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryContainer: {
    marginBottom: 20,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  largestTransactionsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  largestTransaction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  largestTransactionText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
});

export default MonthlySummaryCard;