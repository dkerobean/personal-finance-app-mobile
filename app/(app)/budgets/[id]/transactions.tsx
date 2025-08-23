import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { budgetsApi } from '@/services/api/budgets';
import { useTransactionStore } from '@/stores/transactionStore';
import type { Budget, Transaction, BudgetStatus } from '@/types/models';

interface BudgetWithTransactions {
  budget: Budget;
  transactions: Transaction[];
}

const getStatusConfig = (status: BudgetStatus) => {
  switch (status) {
    case 'on_track':
      return {
        color: '#16a34a',
        backgroundColor: '#dcfce7',
        icon: 'check-circle' as keyof typeof MaterialIcons.glyphMap,
        label: 'On Track',
      };
    case 'warning':
      return {
        color: '#d97706',
        backgroundColor: '#fef3c7',
        icon: 'warning' as keyof typeof MaterialIcons.glyphMap,
        label: 'Warning',
      };
    case 'over_budget':
      return {
        color: '#dc2626',
        backgroundColor: '#fee2e2',
        icon: 'error' as keyof typeof MaterialIcons.glyphMap,
        label: 'Over Budget',
      };
    default:
      return {
        color: '#6b7280',
        backgroundColor: '#f3f4f6',
        icon: 'info' as keyof typeof MaterialIcons.glyphMap,
        label: 'Unknown',
      };
  }
};

export default function BudgetTransactionsScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<BudgetWithTransactions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const getCurrentMonth = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  };

  const loadBudgetData = async (isRefresh = false): Promise<void> => {
    if (!id) return;
    
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const currentMonth = getCurrentMonth();
      const response = await budgetsApi.getBudgetTransactions(id, currentMonth);

      if (response.error) {
        setError(response.error.message);
        return;
      }

      if (response.data) {
        setData(response.data);
      }
    } catch (err) {
      setError('Failed to load budget data');
      console.error('Error loading budget data:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBudgetData();
  }, [id]);

  const handleRefresh = async (): Promise<void> => {
    await loadBudgetData(true);
  };

  const handleGoBack = (): void => {
    router.back();
  };

  const calculateBudgetMetrics = () => {
    if (!data) return null;

    const { budget, transactions } = data;
    const spent = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    const remaining = budget.amount - spent;
    
    let status: BudgetStatus = 'on_track';
    if (percentage >= 90) status = 'over_budget';
    else if (percentage >= 75) status = 'warning';

    return {
      spent: Math.round(spent * 100) / 100,
      percentage: Math.round(percentage * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
      status,
    };
  };

  const metrics = calculateBudgetMetrics();
  const statusConfig = metrics ? getStatusConfig(metrics.status) : null;

  if (isLoading && !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading budget details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#dc2626" />
          <Text style={styles.errorTitle}>Error Loading Budget</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadBudgetData()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#dc2626" />
          <Text style={styles.errorTitle}>Budget Not Found</Text>
          <Text style={styles.errorText}>The requested budget could not be found.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleGoBack}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { budget, transactions } = data;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{budget.category_name}</Text>
          <Text style={styles.subtitle}>Budget Details</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Budget Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.categorySection}>
              <View style={styles.categoryIconContainer}>
                <MaterialIcons
                  name={budget.category_icon_name as any || 'category'}
                  size={32}
                  color="#2563eb"
                />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{budget.category_name}</Text>
                <Text style={styles.monthText}>
                  {new Date(budget.month).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </Text>
              </View>
            </View>
            
            {statusConfig && (
              <View style={[styles.statusBadge, { backgroundColor: statusConfig.backgroundColor }]}>
                <MaterialIcons
                  name={statusConfig.icon}
                  size={20}
                  color={statusConfig.color}
                />
                <Text style={[styles.statusText, { color: statusConfig.color }]}>
                  {statusConfig.label}
                </Text>
              </View>
            )}
          </View>

          {metrics && (
            <>
              {/* Budget Progress */}
              <View style={styles.progressSection}>
                <View style={styles.amountRow}>
                  <Text style={styles.spentAmount}>₵{metrics.spent.toFixed(2)}</Text>
                  <Text style={styles.budgetTotal}>of ₵{budget.amount.toFixed(2)}</Text>
                </View>
                
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${Math.min(metrics.percentage, 100)}%`,
                        backgroundColor: statusConfig?.color || '#2563eb',
                      }
                    ]}
                  />
                </View>
                
                <View style={styles.metricsRow}>
                  <Text style={styles.percentageText}>
                    {metrics.percentage.toFixed(1)}% used
                  </Text>
                  <Text style={[
                    styles.remainingText,
                    { color: metrics.remaining >= 0 ? '#16a34a' : '#dc2626' }
                  ]}>
                    {metrics.remaining >= 0 ? 'Remaining: ' : 'Over by: '}
                    ₵{Math.abs(metrics.remaining).toFixed(2)}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Transactions Section */}
        <View style={styles.transactionsSection}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.transactionsTitle}>Transactions</Text>
            <Text style={styles.transactionsCount}>
              {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'}
            </Text>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="receipt" size={48} color="#d1d5db" />
              <Text style={styles.emptyStateTitle}>No Transactions</Text>
              <Text style={styles.emptyStateText}>
                No transactions found for this category this month.
              </Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {transactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionItem}>
                  <View style={styles.transactionContent}>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionDescription}>
                        {transaction.description || 'No description'}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {new Date(transaction.transaction_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                      {transaction.is_synced && (
                        <Text style={styles.syncedIndicator}>
                          {transaction.platform_source === 'mono' ? 'Bank' : 'Mobile Money'}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.transactionAmount}>
                      -₵{transaction.amount.toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 40, // Balance the back button
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
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
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  categorySection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  monthText: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressSection: {
    gap: 12,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  spentAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginRight: 8,
  },
  budgetTotal: {
    fontSize: 18,
    color: '#6b7280',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  remainingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  transactionsCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  transactionsList: {
    gap: 1,
  },
  transactionItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
    marginRight: 16,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  syncedIndicator: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
});