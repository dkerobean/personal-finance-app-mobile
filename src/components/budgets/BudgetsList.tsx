import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Budget, BudgetWithSpending } from '@/types/models';
import BudgetProgressCard from './BudgetProgressCard';

interface BudgetsListProps {
  budgets?: Budget[];
  budgetsWithSpending?: BudgetWithSpending[];
  isLoading: boolean;
  onEdit: (budget: Budget | BudgetWithSpending) => void;
  onDelete: (budget: Budget | BudgetWithSpending) => void;
  showProgress?: boolean;
}

interface BudgetItemProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
}

const BudgetItem = ({ budget, onEdit, onDelete }: BudgetItemProps): React.ReactElement => {
  const handleEdit = (): void => {
    onEdit(budget);
  };

  const handleDelete = (): void => {
    onDelete(budget);
  };

  return (
    <View style={styles.budgetItem}>
      <View style={styles.budgetContent}>
        {/* Category Info */}
        <View style={styles.categorySection}>
          <View style={styles.categoryIconContainer}>
            <MaterialIcons
              name={budget.category_icon_name as any || 'category'}
              size={24}
              color="#2563eb"
            />
          </View>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{budget.category_name}</Text>
            <Text style={styles.budgetMonth}>
              {new Date(budget.month).toLocaleDateString('en-US', { 
                month: 'short', 
                year: 'numeric' 
              })}
            </Text>
          </View>
        </View>

        {/* Budget Amount */}
        <View style={styles.amountSection}>
          <Text style={styles.budgetAmount}>₵{budget.amount.toFixed(2)}</Text>
          <Text style={styles.amountLabel}>Budget</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <MaterialIcons name="edit" size={18} color="#2563eb" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <MaterialIcons name="delete-outline" size={18} color="#dc3545" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function BudgetsList({
  budgets = [],
  budgetsWithSpending = [],
  isLoading,
  onEdit,
  onDelete,
  showProgress = false,
}: BudgetsListProps): React.ReactElement {
  const displayBudgets = showProgress ? budgetsWithSpending : budgets;

  const handleBudgetPress = (budget: Budget | BudgetWithSpending): void => {
    // Navigate to budget detail screen with transactions
    router.push(`/(app)/budgets/${budget.id}/transactions`);
  };

  const renderBudgetItem = ({ item }: { item: Budget | BudgetWithSpending }): React.ReactElement => {
    if (showProgress && 'spent' in item) {
      // Render with progress tracking
      return (
        <BudgetProgressCard
          budget={item as BudgetWithSpending}
          onPress={() => handleBudgetPress(item)}
          onEdit={() => onEdit(item)}
          onDelete={() => onDelete(item)}
        />
      );
    } else {
      // Render basic budget item
      return (
        <BudgetItem
          budget={item as Budget}
          onEdit={onEdit as (budget: Budget) => void}
          onDelete={onDelete as (budget: Budget) => void}
        />
      );
    }
  };

  const renderEmptyComponent = (): React.ReactElement => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading budgets...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="account-balance-wallet" size={48} color="#d1d5db" />
        <Text style={styles.emptyTitle}>No budgets found</Text>
        <Text style={styles.emptySubtitle}>
          Create your first budget to start tracking spending limits
        </Text>
      </View>
    );
  };

  const renderSeparator = (): React.ReactElement => {
    if (showProgress) {
      return <View style={{ height: 0 }} />; // No separator for progress cards
    }
    return <View style={styles.separator} />;
  };

  return (
    <View style={styles.container}>
      {displayBudgets.length > 0 && (
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>
            {showProgress ? 'Budget Progress' : 'Your Budgets'}
          </Text>
          <Text style={styles.budgetCount}>
            {displayBudgets.length} {displayBudgets.length === 1 ? 'budget' : 'budgets'}
          </Text>
        </View>
      )}

      <FlatList
        data={displayBudgets}
        renderItem={renderBudgetItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={showProgress ? styles.progressListContainer : styles.listContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={renderSeparator}
        ListEmptyComponent={renderEmptyComponent}
        scrollEnabled={false} // Parent handles scrolling
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  budgetCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  listContainer: {
    flexGrow: 1,
  },
  progressListContainer: {
    flexGrow: 1,
    paddingHorizontal: 0, // Remove horizontal padding since cards have their own
  },
  budgetItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  budgetContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categorySection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  budgetMonth: {
    fontSize: 12,
    color: '#6b7280',
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  budgetAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 2,
  },
  amountLabel: {
    fontSize: 11,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionButtons: {
    flexDirection: 'row',
    marginLeft: 12,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});