import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/design';
import type { Liability, LiabilityCategory } from '@/types/models';
import { formatCurrency } from '@/lib/formatters';
import {
  LIABILITY_CATEGORY_OPTIONS,
  getLiabilityDisplayType,
} from '@/lib/netWorthCatalog';

interface LiabilityItemProps {
  liability: Liability;
  onPress: (liabilityId: string) => void;
  onDeletePress?: (liability: Liability) => void;
  showSeparator?: boolean;
}

const CATEGORY_ICONS = Object.fromEntries(
  LIABILITY_CATEGORY_OPTIONS.map((option) => [option.key, option.icon])
) as Record<LiabilityCategory, string>;

const CATEGORY_COLORS = Object.fromEntries(
  LIABILITY_CATEGORY_OPTIONS.map((option) => [option.key, option.color])
) as Record<LiabilityCategory, string>;

export default function LiabilityItem({
  liability,
  onPress,
  onDeletePress,
  showSeparator = true,
}: LiabilityItemProps): React.ReactElement {
  const displayType = useMemo(() => getLiabilityDisplayType(liability), [liability]);
  const balanceDelta = useMemo(() => {
    if (!liability.original_balance) return null;
    return liability.original_balance - liability.current_balance;
  }, [liability]);

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <TouchableOpacity onPress={() => onPress(liability.id)} style={styles.container} activeOpacity={0.82}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={[styles.iconContainer, { backgroundColor: CATEGORY_COLORS[liability.category] || CATEGORY_COLORS.other }]}>
            <MaterialIcons
              name={(CATEGORY_ICONS[liability.category] || CATEGORY_ICONS.other) as any}
              size={22}
              color={COLORS.white}
            />
          </View>
        </View>

        <View style={styles.middleSection}>
          <Text style={styles.liabilityName} numberOfLines={1}>
            {liability.name}
          </Text>

          <Text style={styles.liabilityType} numberOfLines={1}>
            {displayType}
            {liability.custom_category ? ` • ${liability.custom_category}` : ''}
          </Text>

          <Text style={styles.metaText} numberOfLines={1}>
            {liability.interest_rate ? `${liability.interest_rate.toFixed(2)}% APR` : 'No APR set'}
            {liability.monthly_payment ? ` • ${formatCurrency(liability.monthly_payment)}/mo` : ''}
          </Text>

          <Text style={styles.metaText} numberOfLines={1}>
            {liability.due_date ? `Next due ${formatDate(liability.due_date)}` : `Updated ${formatDate(liability.updated_at)}`}
          </Text>

          {liability.description ? (
            <Text style={styles.description} numberOfLines={1}>
              {liability.description}
            </Text>
          ) : null}
        </View>

        <View style={styles.rightSection}>
          <Text style={styles.currentBalance}>{formatCurrency(liability.current_balance)}</Text>

          {balanceDelta !== null ? (
            <Text
              style={[
                styles.balanceChange,
                balanceDelta >= 0 ? styles.balanceReduction : styles.balanceIncrease,
              ]}
            >
              {balanceDelta >= 0 ? '-' : '+'}
              {formatCurrency(Math.abs(balanceDelta))}
            </Text>
          ) : (
            <Text style={styles.secondaryLabel}>Add original balance for payoff tracking</Text>
          )}

          {onDeletePress ? (
            <TouchableOpacity
              onPress={(event) => {
                event.stopPropagation();
                onDeletePress(liability);
              }}
              style={styles.deleteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="more-vert" size={20} color={COLORS.textTertiary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {showSeparator ? <View style={styles.separator} /> : null}
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
  liabilityType: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  metaText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    fontFamily: 'Poppins',
    fontStyle: 'italic',
  },
  rightSection: {
    alignItems: 'flex-end',
    minWidth: 112,
  },
  currentBalance: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.error,
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  balanceChange: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  balanceReduction: {
    color: COLORS.success,
  },
  balanceIncrease: {
    color: COLORS.error,
  },
  secondaryLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    fontFamily: 'Poppins',
    textAlign: 'right',
    marginBottom: 4,
  },
  deleteButton: {
    padding: 4,
    borderRadius: 12,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.backgroundInput,
    marginLeft: 64,
    marginRight: SPACING.lg,
  },
});
