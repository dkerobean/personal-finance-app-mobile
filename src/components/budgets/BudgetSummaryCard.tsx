import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BUDGET, COLORS, TYPOGRAPHY, SPACING } from '@/constants/design';

interface BudgetSummaryCardProps {
  goalAmount: number;
  savedAmount: number;
  currency?: string;
  onGoalPress?: () => void;
  onSavedPress?: () => void;
}

export default function BudgetSummaryCard({
  goalAmount,
  savedAmount,
  currency = '₵',
  onGoalPress,
  onSavedPress,
}: BudgetSummaryCardProps): React.ReactElement {
  return (
    <View style={styles.container}>
      {/* Goal Section */}
      <TouchableOpacity 
        style={styles.section} 
        onPress={onGoalPress}
        disabled={!onGoalPress}
      >
        <View style={styles.iconContainer}>
          <MaterialIcons name="flag" size={12} color={BUDGET.transactionItem.titleColor} />
        </View>
        <Text style={styles.label}>Goal</Text>
        <Text style={styles.amount}>
          {currency}{goalAmount.toLocaleString()}
        </Text>
        <View style={styles.arrowContainer}>
          <MaterialIcons name="keyboard-arrow-up" size={12} color={BUDGET.transactionItem.titleColor} />
        </View>
      </TouchableOpacity>

      {/* Amount Saved Section */}
      <TouchableOpacity 
        style={styles.section} 
        onPress={onSavedPress}
        disabled={!onSavedPress}
      >
        <View style={styles.iconContainer}>
          <MaterialIcons name="savings" size={12} color={BUDGET.transactionItem.titleColor} />
        </View>
        <Text style={styles.label}>Amount Saved</Text>
        <Text style={[styles.amount, styles.savedAmount]}>
          {currency}{savedAmount.toLocaleString()}
        </Text>
        <View style={styles.arrowContainer}>
          <MaterialIcons name="keyboard-arrow-up" size={12} color={BUDGET.transactionItem.titleColor} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  section: {
    alignItems: 'flex-start',
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  iconContainer: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: BUDGET.transactionItem.titleColor,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: BUDGET.transactionItem.titleColor,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amount: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  savedAmount: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  arrowContainer: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: BUDGET.transactionItem.titleColor,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});