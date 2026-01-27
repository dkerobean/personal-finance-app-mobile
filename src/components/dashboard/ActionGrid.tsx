import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { COLORS, SPACING, SHADOWS, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/design';

interface ActionGridProps {
  onAddIncome: () => void;
  onAddExpense: () => void;
}

const ActionGrid: React.FC<ActionGridProps> = ({ onAddIncome, onAddExpense }) => {
  return (
    <View style={styles.container}>
        <Text style={styles.title}>Quick Actions</Text>
        
        <View style={styles.grid}>
            {/* Add Income */}
            <TouchableOpacity style={[styles.card, styles.incomeCard]} onPress={onAddIncome} activeOpacity={0.8}>
                <TrendingUp size={28} color={COLORS.white} style={styles.icon} />
                <Text style={[styles.label, styles.primaryLabel]}>Add Income</Text>
                <Text style={styles.hint}>Record earnings</Text>
            </TouchableOpacity>

            {/* Add Expense */}
            <TouchableOpacity style={[styles.card, styles.expenseCard]} onPress={onAddExpense} activeOpacity={0.8}>
                <TrendingDown size={28} color={COLORS.white} style={styles.icon} />
                <Text style={[styles.label, styles.primaryLabel]}>Add Expense</Text>
                <Text style={styles.hint}>Record spending</Text>
            </TouchableOpacity>
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  grid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
    height: 120,
  },
  incomeCard: {
    backgroundColor: COLORS.success,
  },
  expenseCard: {
    backgroundColor: COLORS.error,
  },
  icon: {
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  primaryLabel: {
    color: COLORS.white,
  },
  hint: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.white,
    opacity: 0.9,
  },
});

export default ActionGrid;
