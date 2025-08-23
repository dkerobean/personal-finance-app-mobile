import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { BudgetWithSpending, BudgetStatus } from '@/types/models';

interface BudgetProgressCardProps {
  budget: BudgetWithSpending;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

interface StatusConfig {
  color: string;
  backgroundColor: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

const getStatusConfig = (status: BudgetStatus): StatusConfig => {
  switch (status) {
    case 'on_track':
      return {
        color: '#16a34a',
        backgroundColor: '#dcfce7',
        icon: 'check-circle',
      };
    case 'warning':
      return {
        color: '#d97706',
        backgroundColor: '#fef3c7',
        icon: 'warning',
      };
    case 'over_budget':
      return {
        color: '#dc2626',
        backgroundColor: '#fee2e2',
        icon: 'error',
      };
  }
};

const BudgetProgressCard = ({ 
  budget, 
  onPress, 
  onEdit, 
  onDelete 
}: BudgetProgressCardProps): React.ReactElement => {
  const statusConfig = getStatusConfig(budget.status);
  const progressWidth = Math.min(budget.percentage, 100);

  const getDaysInMonth = (monthString: string): number => {
    const date = new Date(monthString);
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getDaysRemaining = (monthString: string): number => {
    const today = new Date();
    const month = new Date(monthString);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    if (today > lastDay) return 0;
    if (today.getMonth() !== month.getMonth() || today.getFullYear() !== month.getFullYear()) {
      return getDaysInMonth(monthString);
    }
    
    const diffTime = lastDay.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = getDaysRemaining(budget.month);

  const handlePress = (): void => {
    onPress?.();
  };

  const handleEdit = (): void => {
    onEdit?.();
  };

  const handleDelete = (): void => {
    onDelete?.();
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={handlePress}
      activeOpacity={0.7}
      testID="budget-progress-card"
    >
      <View style={styles.cardContent}>
        {/* Header with category info */}
        <View style={styles.header}>
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
              <Text style={styles.transactionCount}>
                {budget.transaction_count} {budget.transaction_count === 1 ? 'transaction' : 'transactions'}
              </Text>
            </View>
          </View>
          
          {/* Status indicator */}
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.backgroundColor }]}>
            <MaterialIcons
              name={statusConfig.icon}
              size={16}
              color={statusConfig.color}
            />
          </View>
        </View>

        {/* Budget amounts */}
        <View style={styles.amountSection}>
          <View style={styles.amountRow}>
            <Text style={styles.spentAmount}>₵{budget.spent.toFixed(2)}</Text>
            <Text style={styles.budgetTotal}>of ₵{budget.amount.toFixed(2)}</Text>
          </View>
          <Text style={[
            styles.remainingAmount, 
            { color: budget.remaining >= 0 ? '#16a34a' : '#dc2626' }
          ]}>
            {budget.remaining >= 0 ? 'Remaining: ' : 'Over by: '}
            ₵{Math.abs(budget.remaining).toFixed(2)}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${progressWidth}%`,
                  backgroundColor: statusConfig.color,
                }
              ]}
              testID="progress-bar"
            />
          </View>
          <Text style={styles.percentageText}>
            {budget.percentage.toFixed(1)}%
          </Text>
        </View>

        {/* Footer with days remaining */}
        <View style={styles.footer}>
          <Text style={styles.daysRemaining}>
            {daysRemaining === 0 
              ? 'Month ended' 
              : `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining`
            }
          </Text>
          
          {/* Action buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleEdit}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              testID="edit-button"
            >
              <MaterialIcons name="edit" size={20} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleDelete}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              testID="delete-button"
            >
              <MaterialIcons name="delete" size={20} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  transactionCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountSection: {
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  spentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginRight: 8,
  },
  budgetTotal: {
    fontSize: 16,
    color: '#6b7280',
  },
  remainingAmount: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    minWidth: 40,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  daysRemaining: {
    fontSize: 12,
    color: '#9ca3af',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
});

export default BudgetProgressCard;