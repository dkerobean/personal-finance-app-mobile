import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/design';
import type { Liability, LiabilityCategory } from '@/types/models';

interface LiabilityItemProps {
  liability: Liability;
  onPress: (liabilityId: string) => void;
  onDeletePress?: (liability: Liability) => void;
  showSeparator?: boolean;
}

const CATEGORY_ICONS: Record<LiabilityCategory, string> = {
  loans: 'account-balance',
  credit_cards: 'credit-card',
  mortgages: 'home',
  business_debt: 'business',
  other: 'category',
};

const CATEGORY_COLORS: Record<LiabilityCategory, string> = {
  loans: '#DC2626', // Red
  credit_cards: '#B91C1C', // Dark red
  mortgages: '#991B1B', // Darker red
  business_debt: '#7F1D1D', // Very dark red
  other: '#6B7280', // Gray
};

export default function LiabilityItem({
  liability,
  onPress,
  onDeletePress,
  showSeparator = true,
}: LiabilityItemProps): React.ReactElement {
  
  const getCategoryIcon = (category: LiabilityCategory): string => {
    return CATEGORY_ICONS[category] || CATEGORY_ICONS.other;
  };

  const getCategoryColor = (category: LiabilityCategory): string => {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number): string => {
    return `$${amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const getLiabilityTypeDisplayName = (type: string): string => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getInterestRateDisplay = (interestRate?: number): string | null => {
    if (!interestRate) return null;
    return `${interestRate.toFixed(2)}% APR`;
  };

  const getMonthlyPaymentDisplay = (monthlyPayment?: number): string | null => {
    if (!monthlyPayment) return null;
    return `${formatAmount(monthlyPayment)}/mo`;
  };

  const handlePress = () => {
    onPress(liability.id);
  };

  const handleDeletePress = (event: any) => {
    event.stopPropagation();
    onDeletePress?.(liability);
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container} activeOpacity={0.7}>
      <View style={styles.content}>
        {/* Left Section - Icon and Category */}
        <View style={styles.leftSection}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: getCategoryColor(liability.category) }
          ]}>
            <MaterialIcons 
              name={getCategoryIcon(liability.category) as any} 
              size={24} 
              color={COLORS.white}
            />
          </View>
        </View>

        {/* Middle Section - Liability Details */}
        <View style={styles.middleSection}>
          <Text style={styles.liabilityName} numberOfLines={1}>
            {liability.name}
          </Text>
          <View style={styles.detailsRow}>
            <Text style={styles.liabilityType}>
              {getLiabilityTypeDisplayName(liability.liability_type)}
            </Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.lastUpdated}>
              Updated {formatDate(liability.updated_at)}
            </Text>
          </View>
          
          {/* Interest Rate and Monthly Payment Row */}
          <View style={styles.paymentRow}>
            {getInterestRateDisplay(liability.interest_rate) && (
              <>
                <Text style={styles.interestRate}>
                  {getInterestRateDisplay(liability.interest_rate)}
                </Text>
                {getMonthlyPaymentDisplay(liability.monthly_payment) && (
                  <>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.monthlyPayment}>
                      {getMonthlyPaymentDisplay(liability.monthly_payment)}
                    </Text>
                  </>
                )}
              </>
            )}
          </View>

          {liability.description && (
            <Text style={styles.description} numberOfLines={1}>
              {liability.description}
            </Text>
          )}
        </View>

        {/* Right Section - Balance and Actions */}
        <View style={styles.rightSection}>
          <Text style={styles.currentBalance}>
            {formatAmount(liability.current_balance)}
          </Text>
          
          {/* Show balance change if original balance exists */}
          {liability.original_balance && liability.original_balance !== liability.current_balance && (
            <Text style={[
              styles.balanceChange,
              liability.current_balance < liability.original_balance 
                ? styles.balanceReduction 
                : styles.balanceIncrease
            ]}>
              {liability.current_balance < liability.original_balance ? '' : '+'}
              {formatAmount(liability.current_balance - liability.original_balance)}
            </Text>
          )}
          
          {onDeletePress && (
            <TouchableOpacity 
              onPress={handleDeletePress}
              style={styles.deleteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="more-vert" size={20} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showSeparator && <View style={styles.separator} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  leftSection: {
    marginRight: SPACING.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleSection: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  liabilityName: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  liabilityType: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: 'Poppins',
  },
  dot: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    marginHorizontal: SPACING.xs,
  },
  lastUpdated: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    fontFamily: 'Poppins',
  },
  interestRate: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.error,
    fontFamily: 'Poppins',
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  monthlyPayment: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: 'Poppins',
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    fontFamily: 'Poppins',
    fontStyle: 'italic',
  },
  rightSection: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  currentBalance: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.error, // Red for debt amounts
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  balanceChange: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  balanceReduction: {
    color: COLORS.success, // Green when debt is reduced
  },
  balanceIncrease: {
    color: COLORS.error, // Red when debt increases
  },
  deleteButton: {
    padding: 4,
    borderRadius: 12,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.backgroundInput,
    marginLeft: 64, // Align with text content
    marginRight: SPACING.lg,
  },
});