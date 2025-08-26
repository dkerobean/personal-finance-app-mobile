import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TRANSACTIONS, TYPOGRAPHY, SHADOWS } from '@/constants/design';

interface TransactionSummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
}

export default function TransactionSummaryCards({
  totalIncome,
  totalExpense,
}: TransactionSummaryCardsProps): React.ReactElement {
  return (
    <View style={styles.container}>
      {/* Income Card */}
      <View style={[styles.card, styles.incomeCard]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Income</Text>
          <View style={[styles.iconContainer, styles.incomeIconContainer]}>
            <MaterialIcons name="arrow-upward" size={12.5} color={COLORS.primary} />
          </View>
        </View>
        <Text style={styles.cardAmount}>${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
      </View>

      {/* Expense Card */}
      <View style={[styles.card, styles.expenseCard]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Expense</Text>
          <View style={[styles.iconContainer, styles.expenseIconContainer]}>
            <MaterialIcons name="arrow-downward" size={12.5} color={COLORS.accent} />
          </View>
        </View>
        <Text style={[styles.cardAmount, styles.expenseAmount]}>${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
    paddingHorizontal: 37,
    marginBottom: 10,
  },
  card: {
    flex: 1,
    height: 80,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    maxWidth: 160,
    ...SHADOWS.sm,
  },
  incomeCard: {
    backgroundColor: COLORS.primaryLight,
  },
  expenseCard: {
    backgroundColor: COLORS.primaryLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
  },
  iconContainer: {
    width: 25,
    height: 25,
    borderRadius: 6.25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  incomeIconContainer: {
    borderColor: COLORS.primary,
  },
  expenseIconContainer: {
    borderColor: COLORS.accent,
  },
  cardAmount: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
    lineHeight: 22,
  },
  expenseAmount: {
    color: COLORS.accent,
  },
});