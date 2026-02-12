import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/design';
import type { Asset, AssetCategory } from '@/types/models';
import { formatCurrency } from '@/lib/formatters';

interface AssetItemProps {
  asset: Asset;
  onPress: (assetId: string) => void;
  onDeletePress?: (asset: Asset) => void;
  showSeparator?: boolean;
}

const CATEGORY_ICONS: Record<AssetCategory, string> = {
  property: 'home',
  investments: 'trending-up',
  cash: 'account-balance-wallet',
  vehicles: 'directions-car',
  personal: 'diamond',
  business: 'business',
  other: 'category',
};

const CATEGORY_COLORS: Record<AssetCategory, string> = {
  property: '#10B981', // Green
  investments: '#3B82F6', // Blue
  cash: '#F59E0B', // Yellow
  vehicles: '#8B5CF6', // Purple
  personal: '#EC4899', // Pink
  business: '#6366F1', // Indigo
  other: '#6B7280', // Gray
};

const extractDescriptionMeta = (rawDescription?: string): { clean: string; customType: string } => {
  if (!rawDescription) {
    return { clean: '', customType: '' };
  }

  const customType = rawDescription.match(/\[\[custom_type:(.*?)\]\]/i)?.[1]?.trim() || '';
  const clean = rawDescription
    .replace(/\[\[custom_category:.*?\]\]/gi, '')
    .replace(/\[\[custom_type:.*?\]\]/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { clean, customType };
};

export default function AssetItem({
  asset,
  onPress,
  onDeletePress,
  showSeparator = true,
}: AssetItemProps): React.ReactElement {
  
  const getCategoryIcon = (category: AssetCategory): string => {
    return CATEGORY_ICONS[category] || CATEGORY_ICONS.other;
  };

  const getCategoryColor = (category: AssetCategory): string => {
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

  const getAssetTypeDisplayName = (type: string): string => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handlePress = () => {
    onPress(asset.id);
  };

  const handleDeletePress = (event: any) => {
    event.stopPropagation();
    onDeletePress?.(asset);
  };
  const descriptionMeta = extractDescriptionMeta(asset.description);
  const typeLabel = asset.custom_type?.trim() || descriptionMeta.customType || getAssetTypeDisplayName(asset.asset_type);
  const categoryLabel = asset.custom_category?.trim();

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container} activeOpacity={0.7}>
      <View style={styles.content}>
        {/* Left Section - Icon and Category */}
        <View style={styles.leftSection}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: getCategoryColor(asset.category) }
          ]}>
            <MaterialIcons 
              name={getCategoryIcon(asset.category) as any} 
              size={24} 
              color={COLORS.white}
            />
          </View>
        </View>

        {/* Middle Section - Asset Details */}
        <View style={styles.middleSection}>
          <Text style={styles.assetName} numberOfLines={1}>
            {asset.name}
          </Text>
          <View style={styles.detailsRow}>
            <Text style={styles.assetType}>
              {typeLabel}
            </Text>
            {categoryLabel ? (
              <>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.assetType}>{categoryLabel}</Text>
              </>
            ) : null}
            <Text style={styles.dot}>•</Text>
            <Text style={styles.lastUpdated}>
              Updated {formatDate(asset.updated_at)}
            </Text>
          </View>
          {descriptionMeta.clean ? (
            <Text style={styles.description} numberOfLines={1}>
              {descriptionMeta.clean}
            </Text>
          ) : null}
        </View>

        {/* Right Section - Value and Actions */}
        <View style={styles.rightSection}>
          <Text style={styles.currentValue}>
            {formatCurrency(asset.current_value)}
          </Text>
          {asset.original_value && asset.original_value !== asset.current_value && (
            <Text style={[
              styles.valueChange,
              asset.current_value > asset.original_value 
                ? styles.valueGain 
                : styles.valueLoss
            ]}>
              {asset.current_value > asset.original_value ? '+' : ''}
              {formatCurrency(asset.current_value - asset.original_value)}
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
  assetName: {
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
  assetType: {
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
