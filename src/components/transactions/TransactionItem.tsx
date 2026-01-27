import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/design';
import type { Transaction } from '@/types/models';
import { mapIconName } from '@/utils/iconMapping';

// Define transaction specific colors
const TX_COLORS = {
  income: {
    bg: '#dcfce7', // Green 100
    text: '#15803d', // Green 700
  },
  expense: {
    bg: '#fee2e2', // Red 100
    text: '#b91c1c', // Red 700
  },
  default: {
    bg: '#f3f4f6', // Gray 100
    icon: '#6b7280', // Gray 500
  }
};

interface TransactionItemProps {
  transaction: Transaction;
  onPress: (transactionId: string) => void;
  showSeparator?: boolean; // Kept for API compatibility but unused in new design
}

export default function TransactionItem({
  transaction,
  onPress,
}: TransactionItemProps): React.ReactElement {
  
  const getIconColor = (categoryName?: string): string => {
    // We could use category colors here, but for a cleaner look we might just use primary
    return COLORS.primary;
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number, type: 'income' | 'expense'): string => {
    const sign = type === 'income' ? '+' : '-';
    return `${sign}₵${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const isIncome = transaction.type === 'income';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(transaction.id)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Icon Container */}
        <View style={[
          styles.iconContainer,
          { backgroundColor: isIncome ? TX_COLORS.income.bg : TX_COLORS.expense.bg }
        ]}>
          <Ionicons
            name={mapIconName(transaction.category?.icon_name, transaction.category?.name) as any}
            size={20}
            color={isIncome ? TX_COLORS.income.text : TX_COLORS.expense.text}
          />
        </View>

        {/* Transaction Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.leftDetails}>
            <Text style={styles.categoryName} numberOfLines={1}>
              {transaction.category?.name || 'Uncategorized'}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.dateText}>
                {formatDate(transaction.transaction_date)} • {formatTime(transaction.transaction_date)}
              </Text>
            </View>
            {transaction.description ? (
               <Text style={styles.noteText} numberOfLines={1}>
                 {transaction.description}
               </Text>
            ) : null}
          </View>

          {/* Amount */}
          <View style={styles.rightDetails}>
            <Text style={[
              styles.amount,
              { color: isIncome ? COLORS.success : COLORS.error }
            ]}>
              {formatAmount(transaction.amount, transaction.type)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginBottom: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  detailsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Align to top
  },
  leftDetails: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  rightDetails: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 44, // Align vertically with icon
  },
  categoryName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  noteText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  amount: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '700',
  },
});