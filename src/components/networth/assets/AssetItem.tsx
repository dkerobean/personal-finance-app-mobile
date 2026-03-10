import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/design';
import type { Asset, AssetCategory } from '@/types/models';
import { formatCurrency } from '@/lib/formatters';
import {
  APPRECIATING_ASSET_TYPES,
  ASSET_CATEGORY_OPTIONS,
  calculateAssetChange,
  calculateAssetCurrentValue,
  getAssetDisplayType,
  getAssetValuationMethodLabel,
} from '@/lib/netWorthCatalog';

interface AssetItemProps {
  asset: Asset;
  onPress: (assetId: string) => void;
  onDeletePress?: (asset: Asset) => void;
  showSeparator?: boolean;
}

const CATEGORY_ICONS = Object.fromEntries(
  ASSET_CATEGORY_OPTIONS.map((option) => [option.key, option.icon])
) as Record<AssetCategory, string>;

const CATEGORY_COLORS = Object.fromEntries(
  ASSET_CATEGORY_OPTIONS.map((option) => [option.key, option.color])
) as Record<AssetCategory, string>;

export default function AssetItem({
  asset,
  onPress,
  onDeletePress,
  showSeparator = true,
}: AssetItemProps): React.ReactElement {
  const currentValue = useMemo(() => calculateAssetCurrentValue(asset), [asset]);
  const change = useMemo(() => calculateAssetChange(asset), [asset]);
  const displayType = useMemo(() => getAssetDisplayType(asset), [asset]);
  const isAppreciating = APPRECIATING_ASSET_TYPES.has(asset.asset_type);

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'No valuation date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <TouchableOpacity onPress={() => onPress(asset.id)} style={styles.container} activeOpacity={0.82}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={[styles.iconContainer, { backgroundColor: CATEGORY_COLORS[asset.category] || CATEGORY_COLORS.other }]}>
            <MaterialIcons
              name={(CATEGORY_ICONS[asset.category] || CATEGORY_ICONS.other) as any}
              size={22}
              color={COLORS.white}
            />
          </View>
        </View>

        <View style={styles.middleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.assetName} numberOfLines={1}>
              {asset.name}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{getAssetValuationMethodLabel(asset.valuation_method)}</Text>
            </View>
          </View>

          <Text style={styles.assetType} numberOfLines={1}>
            {displayType}
            {asset.custom_category ? ` • ${asset.custom_category}` : ''}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              {asset.valuation_method === 'market' && asset.units_held && asset.unit_price
                ? `${asset.units_held.toLocaleString('en-US')} units @ ${formatCurrency(asset.unit_price)}`
                : asset.valuation_method === 'appraisal'
                  ? `Appraised ${formatDate(asset.last_valuation_date)}`
                  : `Updated ${formatDate(asset.updated_at)}`}
            </Text>
          </View>

          {asset.description ? (
            <Text style={styles.description} numberOfLines={1}>
              {asset.description}
            </Text>
          ) : null}
        </View>

        <View style={styles.rightSection}>
          <Text style={styles.currentValue}>{formatCurrency(currentValue)}</Text>

          {change.percentage !== null ? (
            <Text
              style={[
                styles.valueChange,
                change.amount >= 0 ? styles.valueGain : styles.valueLoss,
              ]}
            >
              {change.amount >= 0 ? '+' : '-'}
              {formatCurrency(Math.abs(change.amount))}
              {` ${Math.abs(change.percentage).toFixed(1)}%`}
            </Text>
          ) : isAppreciating ? (
            <Text style={styles.secondaryLabel}>Add cost basis for gain tracking</Text>
          ) : null}

          {onDeletePress ? (
            <TouchableOpacity
              onPress={(event) => {
                event.stopPropagation();
                onDeletePress(asset);
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 4,
  },
  assetName: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
  },
  badge: {
    borderRadius: 999,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.primary,
    fontFamily: 'Poppins',
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  assetType: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  metaRow: {
    marginBottom: 2,
  },
  metaText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    fontFamily: 'Poppins',
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
  currentValue: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.success,
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  valueChange: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  valueGain: {
    color: COLORS.success,
  },
  valueLoss: {
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
