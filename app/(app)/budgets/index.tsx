import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useBudgetStore } from '@/stores/budgetStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useTransactionStore } from '@/stores/transactionStore';
import { useAuthStore } from '@/stores/authStore';

// Using existing API services instead of MCP functions
import EditBudgetModal from '@/components/budgets/EditBudgetModal';
import BudgetsList from '@/components/budgets/BudgetsList';
import GradientHeader from '@/components/budgets/GradientHeader';
import CircularProgressIndicator from '@/components/budgets/CircularProgressIndicator';
import BudgetSummaryCard from '@/components/budgets/BudgetSummaryCard';
import ProgressBarWithStatus from '@/components/budgets/ProgressBarWithStatus';
import BudgetTransactionsList from '@/components/budgets/BudgetTransactionsList';
import BudgetProgressCard from '@/components/budgets/BudgetProgressCard';

// Interface for budget data from Supabase
interface BudgetData {
  id: string;
  user_id: string;
  category_id: string;
  amount: string;
  month: string;
  created_at: string;
  updated_at: string;
  category_name: string;
  category_icon_name: string;
  spent: string;
}

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
  const { user } = useAuthStore();
  
  // Get transaction count to trigger refresh when transactions change
  const { transactions, loadTransactions } = useTransactionStore();
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [budgetTransactions, setBudgetTransactions] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  useEffect(() => {
    loadBudgets();
    loadCategories();
    fetchBudgetTracking(currentMonth);
  }, []);
  
  useEffect(() => {
    if (transactions.length > 0 && currentMonthBudgets.length > 0) {
      fetchBudgetTransactions();
    }
  }, [transactions, user, currentMonthBudgets, currentMonth]);

  const fetchBudgetTransactions = async () => {
    if (!user?.id) return;
    
    try {
      setTransactionsLoading(true);
      
      // Get budget category IDs for filtering
      const budgetCategoryIds = currentMonthBudgets.map(budget => budget.category_id);
      
      // Get current month transactions for budget categories only
      const currentMonthTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.transaction_date);
        const currentDate = new Date(currentMonth);
        return txDate.getMonth() === currentDate.getMonth() && 
               txDate.getFullYear() === currentDate.getFullYear() &&
               tx.type === 'expense' &&
               budgetCategoryIds.includes(tx.category_id);
      });
      
      // Sort by date (most recent first)
      const sortedTransactions = currentMonthTransactions.sort((a, b) => 
        new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      );
      
      setBudgetTransactions(sortedTransactions.slice(0, 10));
    } catch (error) {
      console.error('Error fetching budget transactions:', error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Listen for transaction changes and refresh budget tracking
  useEffect(() => {
    if (transactions.length > 0) {
      onTransactionChanged();
      // Recalculate budget tracking when transactions change
      fetchBudgetTracking(currentMonth);
    }
  }, [transactions.length, currentMonth]);

  const handleRefresh = async (): Promise<void> => {
    clearError();
    await Promise.all([
      loadBudgets(),
      fetchBudgetTracking(currentMonth),
      loadTransactions()
    ]);
    // Refresh transactions after loading
    if (transactions.length > 0) {
      fetchBudgetTransactions();
    }
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

  // Use store data for budget information
  const currentMonthBudgets = getBudgetsForMonth(currentMonth);
  const currentMonthBudgetsWithSpending = getBudgetsWithSpendingForMonth(currentMonth);
  
  const totalBudget = currentMonthBudgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = currentMonthBudgetsWithSpending.reduce((sum, budget) => sum + budget.spent, 0);
  
  // Calculate progress for the main budget item (we'll use the first budget as example)
  const mainBudget = currentMonthBudgetsWithSpending[0] || { spent: 0, amount: totalBudget };
  const progress = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  
  // Ensure we have a meaningful progress value to display
  const displayProgress = progress > 0 ? progress : (currentMonthBudgetsWithSpending.length > 0 ? 5 : 0);
  
  // Get the main category for display
  const mainCategoryName = currentMonthBudgets.length > 0
    ? currentMonthBudgets[0].category_name
    : "Budget";
    
  const mainIconName = currentMonthBudgets.length > 0 && currentMonthBudgets[0].category_icon_name
    ? currentMonthBudgets[0].category_icon_name
    : "directions-car";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {/* Gradient Header Section */}
        <GradientHeader
          title={mainCategoryName}
          onBackPress={handleGoBack}
          onCalendarPress={() => {
            // Handle calendar press
          }}
          onNotificationPress={() => {
            // Handle notification press
          }}
        />

        {/* Content Card */}
        <View style={styles.contentCard}>
          {/* Circular Progress Section */}
          <View style={styles.progressSection}>
            <CircularProgressIndicator
              progress={displayProgress}
              iconName={mainIconName as any}
            />
            <Text style={styles.categoryLabel}>{mainCategoryName}</Text>
          </View>

          {/* Summary Cards */}
          <BudgetSummaryCard
            goalAmount={totalBudget}
            savedAmount={totalSpent}
          />

          {/* Progress Bar */}
          <ProgressBarWithStatus
            percentage={displayProgress}
            goalAmount={totalBudget}
            statusMessage={`${Math.round(displayProgress)}% Of Your Expenses, Looks Good.`}
          />

          {/* Budget List with Progress Cards */}
          <View style={styles.budgetCardsContainer}>
            {currentMonthBudgetsWithSpending.length > 0 ? (
              currentMonthBudgetsWithSpending.map((budget) => (
                <BudgetProgressCard
                  key={budget.id}
                  budget={budget}
                  onPress={() => {
                    // Navigate to budget detail screen with transactions
                    router.push(`/(app)/budgets/${budget.id}/transactions`);
                  }}
                  onEdit={() => handleEditBudget(budget)}
                  onDelete={() => handleDeleteBudget(budget)}
                />
              ))
            ) : (
              <BudgetsList
                budgets={currentMonthBudgets}
                budgetsWithSpending={currentMonthBudgetsWithSpending}
                isLoading={isLoading || isTrackingLoading}
                onEdit={handleEditBudget}
                onDelete={handleDeleteBudget}
                showProgress={false}
              />
            )}
          </View>

          {/* Budget Transactions List */}
          <BudgetTransactionsList
            transactions={budgetTransactions}
            isLoading={transactionsLoading}
          />

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <View style={styles.errorContent}>
                <MaterialIcons name="error-outline" size={24} color="#dc3545" />
                <View style={styles.errorTextContainer}>
                  <Text style={styles.errorTitle}>Unable to load budgets</Text>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={handleRefresh}
                disabled={isLoading}
              >
                <MaterialIcons name="refresh" size={16} color="#2563eb" />
                <Text style={styles.retryButtonText}>
                  {isLoading ? 'Retrying...' : 'Retry'}
                </Text>
              </TouchableOpacity>
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
            </View>
          )}

          {/* Add Budget Button */}
          <TouchableOpacity style={styles.addBudgetButton} onPress={handleCreateBudget}>
            <Text style={styles.addBudgetButtonText}>Add Budget</Text>
          </TouchableOpacity>

          {/* Bottom spacing */}
          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>

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
    backgroundColor: '#00D09E', // Match gradient background
  },
  mainScrollView: {
    flex: 1,
  },
  contentCard: {
    backgroundColor: '#F1FFF3',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -20, // Slight overlap with header
    paddingTop: 20,
    flex: 1,
  },
  progressSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#093030',
    marginTop: 20,
    textTransform: 'uppercase',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  errorTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  errorTitle: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  retryButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
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
  addBudgetButton: {
    backgroundColor: '#00D09E',
    borderRadius: 30,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 123,
    marginVertical: 20,
  },
  addBudgetButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#093030',
    textTransform: 'capitalize',
  },
  budgetCardsContainer: {
    paddingTop: 20,
  },
  bottomSpacing: {
    height: 150, // Account for bottom navigation
  },
});