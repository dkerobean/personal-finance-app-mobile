import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useBudgetStore } from '@/stores/budgetStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useTransactionStore } from '@/stores/transactionStore';
import EditBudgetModal from '@/components/budgets/EditBudgetModal';
import BudgetsList from '@/components/budgets/BudgetsList';

export default function BudgetsScreen(): React.ReactElement {
  const { 
    budgets, 
    budgetsWithSpending,
    isLoading, 
    isTrackingLoading,
    error, 
    loadBudgets,
    fetchBudgetTracking,
    deleteBudget, 
    clearError,
    getBudgetsForMonth,
    getBudgetsWithSpendingForMonth
  } = useBudgetStore();
  
  const { categories, loadCategories } = useCategoryStore();
  const { onTransactionChanged } = useBudgetStore();
  
  // Get transaction count to trigger refresh when transactions change
  const transactions = useTransactionStore(state => state.transactions);
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });

  useEffect(() => {
    loadBudgets();
    loadCategories();
    fetchBudgetTracking(currentMonth);
  }, []);

  // Listen for transaction changes and refresh budget tracking
  useEffect(() => {
    if (transactions.length > 0) {
      onTransactionChanged();
    }
  }, [transactions.length]);

  const handleRefresh = async (): Promise<void> => {
    clearError();
    await Promise.all([
      loadBudgets(),
      fetchBudgetTracking(currentMonth)
    ]);
  };

  const handleCreateBudget = (): void => {
    router.push('/budgets/add');
  };

  const handleEditBudget = (budget: any): void => {
    setSelectedBudget(budget);
    setEditModalVisible(true);
  };

  const handleDeleteBudget = (budget: any): void => {
    Alert.alert(
      'Delete Budget',
      `Are you sure you want to delete the budget for ${budget.category_name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteBudget(budget.id);
            if (success) {
              Alert.alert('Success', 'Budget deleted successfully');
            }
          },
        },
      ]
    );
  };

  const handleGoBack = (): void => {
    router.back();
  };

  const currentMonthBudgets = getBudgetsForMonth(currentMonth);
  const currentMonthBudgetsWithSpending = getBudgetsWithSpendingForMonth(currentMonth);
  const totalBudget = currentMonthBudgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = currentMonthBudgetsWithSpending.reduce((sum, budget) => sum + budget.spent, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Budgets</Text>
          <Text style={styles.subtitle}>
            {new Date(currentMonth).toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleCreateBudget}>
          <MaterialIcons name="add" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* Budget Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Monthly Budget Overview</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryAmount}>₵{totalBudget.toFixed(2)}</Text>
            <Text style={styles.summaryItemLabel}>Total Budget</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryAmount, { color: '#dc2626' }]}>₵{totalSpent.toFixed(2)}</Text>
            <Text style={styles.summaryItemLabel}>Total Spent</Text>
          </View>
        </View>
        <Text style={styles.summarySubtext}>
          {currentMonthBudgets.length} {currentMonthBudgets.length === 1 ? 'category' : 'categories'}
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {/* Budget List */}
        <BudgetsList
          budgets={currentMonthBudgets}
          budgetsWithSpending={currentMonthBudgetsWithSpending}
          isLoading={isLoading || isTrackingLoading}
          onEdit={handleEditBudget}
          onDelete={handleDeleteBudget}
          showProgress={currentMonthBudgetsWithSpending.length > 0}
        />

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={24} color="#dc3545" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Empty State */}
        {!isLoading && currentMonthBudgets.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="account-balance-wallet" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>No Budgets Yet</Text>
            <Text style={styles.emptyStateText}>
              Create your first budget to start tracking your spending limits.
            </Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={handleCreateBudget}>
              <Text style={styles.emptyStateButtonText}>Add Budget</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleCreateBudget}>
        <MaterialIcons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Edit Modal */}
      <EditBudgetModal
        visible={editModalVisible}
        budget={selectedBudget}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedBudget(null);
        }}
      />
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
  addButton: {
    padding: 8,
    marginLeft: 8,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  summaryItemLabel: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summarySubtext: {
    fontSize: 12,
    color: '#9ca3af',
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyStateButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});