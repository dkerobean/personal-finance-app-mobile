import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TRANSACTIONS, TYPOGRAPHY, SHADOWS, SPACING } from '@/constants/design';

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
      <LinearGradient
        colors={['#10B981', '#059669']} // Green gradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="arrow-upward" size={18} color={COLORS.white} />
            </View>
            <Text style={styles.cardTitle}>Income</Text>
          </View>
          <Text style={styles.cardAmount}>₵{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </View>
        <View style={styles.decorativeCircle} />
      </LinearGradient>

      {/* Expense Card */}
      <LinearGradient
        colors={['#3B82F6', '#2563EB']} // Blue gradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="arrow-downward" size={18} color={COLORS.white} />
            </View>
            <Text style={styles.cardTitle}>Expense</Text>
          </View>
          <Text style={styles.cardAmount}>₵{totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </View>
        <View style={styles.decorativeCircle} />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: SPACING.lg,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    minHeight: 100,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  cardContent: {
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 0.3,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAmount: {
    fontSize: 24,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  decorativeCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    bottom: -30,
    right: -30,
  },
});