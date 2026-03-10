import React from 'react';
import { View, Text, StyleSheet, RefreshControl, FlatList } from 'react-native';
import type { Asset, AssetCategory } from '@/types/models';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/design';
import AssetItem from './AssetItem';
import { formatCurrency } from '@/lib/formatters';
import { calculateAssetCurrentValue, getAssetCategoryLabel } from '@/lib/netWorthCatalog';

interface AssetsListProps {
  assets: Asset[];
  onAssetPress: (assetId: string) => void;
  onDeletePress?: (asset: Asset) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  loading?: boolean;
}

interface AssetGroup {
  category: string;
  assets: Asset[];
  totalValue: number;
}

type AssetHeaderItem = { type: 'header'; category: string; totalValue: number };
type AssetListItem = Asset | AssetHeaderItem;

export default function AssetsList({
  assets,
  onAssetPress,
  onDeletePress,
  onRefresh,
  refreshing = false,
  loading = false,
}: AssetsListProps): React.ReactElement {

  // Group assets by category
  const groupedAssets = React.useMemo(() => {
    const groups: Record<string, Asset[]> = {};
    
    assets.forEach(asset => {
      const category = asset.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(asset);
    });

    // Convert to array of groups and sort by total value
    const groupArray: AssetGroup[] = Object.entries(groups).map(([category, categoryAssets]) => ({
      category,
      assets: categoryAssets.sort((a, b) => calculateAssetCurrentValue(b) - calculateAssetCurrentValue(a)),
      totalValue: categoryAssets.reduce((sum, asset) => sum + calculateAssetCurrentValue(asset), 0),
    }));

    // Sort groups by total value (highest first)
    return groupArray.sort((a, b) => b.totalValue - a.totalValue);
  }, [assets]);

  const getCategoryDisplayName = (category: string): string => {
    return getAssetCategoryLabel(category as AssetCategory);
  };

  const formatCategoryTotal = (total: number): string => {
    return formatCurrency(total);
  };

  // Create flat list data with headers
  const flatListData = React.useMemo(() => {
    const data: AssetListItem[] = [];
    
    groupedAssets.forEach(group => {
      // Add category header
      data.push({
        type: 'header',
        category: group.category,
        totalValue: group.totalValue,
      });
      
      // Add assets in this category
      group.assets.forEach(asset => {
        data.push(asset);
      });
    });
    
    return data;
  }, [groupedAssets]);

  const renderItem = ({ item, index }: { item: AssetListItem; index: number }) => {
    if ('type' in item && item.type === 'header') {
      return (
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>
            {getCategoryDisplayName(item.category)}
          </Text>
          <Text style={styles.categoryTotal}>
            {formatCategoryTotal(item.totalValue)}
          </Text>
        </View>
      );
    }

    // Determine if we should show separator
    const nextItem = flatListData[index + 1];
    const showSeparator = nextItem ? !('type' in nextItem && nextItem.type === 'header') : false;

    const asset = item as Asset;

    return (
      <AssetItem
        asset={asset}
        onPress={onAssetPress}
        onDeletePress={onDeletePress}
        showSeparator={showSeparator}
      />
    );
  };

  if (assets.length === 0) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={flatListData}
        renderItem={renderItem}
        keyExtractor={(item) => {
          if ('type' in item && item.type === 'header') {
            return `header-${item.category}`;
          }

          return `asset-${(item as Asset).id}`;
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          ) : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: SPACING.xl * 2, // Extra space for FAB
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.backgroundInput,
  },
  categoryTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
  },
  categoryTotal: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.success,
    fontFamily: 'Poppins',
  },
});
