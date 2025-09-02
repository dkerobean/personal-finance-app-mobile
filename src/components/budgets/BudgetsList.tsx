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
import { BUDGET, COLORS, TYPOGRAPHY, SPACING } from '@/constants/design';

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

  // Format the date like in the Figma design
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const day = date.getDate();
    return `${hours}:${minutes} - ${month} ${day}`;
  };

  return (
    <TouchableOpacity style={styles.budgetItem} onPress={handleEdit}>
      <View style={styles.budgetContent}>
        {/* Icon */}
        <View style={styles.categoryIconContainer}>
          <MaterialIcons
            name={budget.category_icon_name as any || 'directions-car'}
            size={27}
            color={BUDGET.circularProgress.iconColor}
          />
        </View>

        {/* Info Section */}
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>
            {budget.category_name || 'Car Deposit'}
          </Text>
          <Text style={styles.timeText}>
            {formatTime(budget.created_at)}
          </Text>
        </View>

        {/* Amount */}
        <View style={styles.amountSection}>
          <Text style={styles.budgetAmount}>
            ₵{budget.amount.toFixed(2)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
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

  // Group budgets by month for display like in Figma
  const groupedBudgets = displayBudgets.reduce((acc, budget) => {
    const monthKey = new Date(budget.month || budget.created_at).toLocaleDateString('en-US', { month: 'long' });
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(budget);
    return acc;
  }, {} as Record<string, (Budget | BudgetWithSpending)[]>);

  return (
    <View style={styles.container}>
      {Object.keys(groupedBudgets).map((monthKey) => (
        <View key={monthKey} style={styles.monthSection}>
          {/* Month Header */}
          <Text style={styles.monthTitle}>{monthKey}</Text>
          
          {/* Budget Items for this month */}
          {groupedBudgets[monthKey].map((budget, index) => (
            <React.Fragment key={budget.id}>
              {showProgress && 'spent' in budget ? (
                <BudgetProgressCard
                  budget={budget as BudgetWithSpending}
                  onPress={() => handleBudgetPress(budget)}
                  onEdit={() => onEdit(budget)}
                  onDelete={() => onDelete(budget)}
                />
              ) : (
                <BudgetItem
                  budget={budget as Budget}
                  onEdit={onEdit as (budget: Budget) => void}
                  onDelete={onDelete as (budget: Budget) => void}
                />
              )}
            </React.Fragment>
          ))}
        </View>
      ))}

      {displayBudgets.length === 0 && renderEmptyComponent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
  },
  monthSection: {
    marginBottom: SPACING.xl,
  },
  monthTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: BUDGET.transactionItem.titleColor,
    marginBottom: SPACING.md,
    paddingLeft: SPACING.md,
  },
  budgetItem: {
    backgroundColor: 'transparent',
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  budgetContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: BUDGET.transactionItem.iconSize,
    height: BUDGET.transactionItem.iconSize,
    borderRadius: BUDGET.transactionItem.iconBorderRadius,
    backgroundColor: BUDGET.transactionItem.backgroundColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  categoryInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  categoryName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: BUDGET.transactionItem.titleColor,
    marginBottom: 2,
  },
  timeText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: BUDGET.transactionItem.subtitleColor,
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  budgetAmount: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: BUDGET.transactionItem.amountColor,
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