import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TRANSACTIONS, TYPOGRAPHY } from '@/constants/design';
import type { Transaction } from '@/types/models';

interface TransactionItemProps {
  transaction: Transaction;
  onPress: (transactionId: string) => void;
  showSeparator?: boolean;
}

export default function TransactionItem({
  transaction,
  onPress,
  showSeparator = true,
}: TransactionItemProps): React.ReactElement {
  const getCategoryIconColor = (categoryName?: string): string => {
    if (!categoryName) return TRANSACTIONS.categoryColors.food;
    
    const category = categoryName.toLowerCase();
    if (category.includes('salary')) return TRANSACTIONS.categoryColors.salary;
    if (category.includes('groceries')) return TRANSACTIONS.categoryColors.groceries;
    if (category.includes('rent')) return TRANSACTIONS.categoryColors.rent;
    if (category.includes('transport') || category.includes('fuel')) return TRANSACTIONS.categoryColors.transport;
    if (category.includes('food') || category.includes('dinner')) return TRANSACTIONS.categoryColors.food;
    
    return TRANSACTIONS.categoryColors.food; // Default
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: '2-digit',
    });
  };

  const formatAmount = (amount: number, type: 'income' | 'expense'): string => {
    const sign = type === 'income' ? '' : '-';
    return `${sign}$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(transaction.id)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Category Icon */}
        <View style={[
          styles.iconContainer,
          { backgroundColor: getCategoryIconColor(transaction.category?.name) }
        ]}>
          <MaterialIcons
            name={transaction.category?.icon_name as any || 'category'}
            size={26}
            color={COLORS.primaryLight}
          />
        </View>

        {/* Transaction Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.leftDetails}>
            <Text style={styles.categoryName}>
              {transaction.category?.name || 'Unknown Category'}
            </Text>
            {transaction.description && (
              <Text style={styles.subcategory} numberOfLines={1}>
                {transaction.description}
              </Text>
            )}
            <Text style={styles.dateTime}>
              {formatTime(transaction.transaction_date)} - {formatDate(transaction.transaction_date)}
            </Text>
          </View>

          {/* Amount */}
          <View style={styles.rightDetails}>
            <Text style={[
              styles.amount,
              { color: transaction.type === 'income' ? COLORS.success : COLORS.accent }
            ]}>
              {formatAmount(transaction.amount, transaction.type)}
            </Text>
          </View>
        </View>
      </View>

      {/* Separator Lines */}
      {showSeparator && (
        <View style={styles.separatorContainer}>
          <View style={[styles.separator, styles.leftSeparator]} />
          <View style={[styles.separator, styles.rightSeparator]} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: TRANSACTIONS.transactionItem.paddingVertical,
    paddingHorizontal: TRANSACTIONS.transactionItem.paddingHorizontal,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: TRANSACTIONS.transactionItem.iconSize,
    height: TRANSACTIONS.transactionItem.iconSize,
    borderRadius: TRANSACTIONS.transactionItem.iconBorderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  detailsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftDetails: {
    flex: 1,
  },
  rightDetails: {
    alignItems: 'flex-end',
  },
  categoryName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  subcategory: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.light,
    color: COLORS.textSecondary,
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  dateTime: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.accent,
    fontFamily: 'Poppins',
  },
  amount: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    fontFamily: 'Poppins',
  },
  separatorContainer: {
    flexDirection: 'row',
    marginTop: TRANSACTIONS.transactionItem.paddingVertical,
    paddingHorizontal: 16,
  },
  separator: {
    height: TRANSACTIONS.transactionItem.separatorWidth,
    backgroundColor: TRANSACTIONS.transactionItem.separatorColor,
  },
  leftSeparator: {
    width: 93,
  },
  rightSeparator: {
    flex: 1,
    marginLeft: 16,
  },
});