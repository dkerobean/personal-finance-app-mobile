import React from 'react';
import { View, Text, StyleSheet, RefreshControl, FlatList } from 'react-native';
import type { Asset } from '@/types/models';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/design';
import AssetItem from './AssetItem';

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
      assets: categoryAssets.sort((a, b) => b.current_value - a.current_value),
      totalValue: categoryAssets.reduce((sum, asset) => sum + asset.current_value, 0),
    }));

    // Sort groups by total value (highest first)
    return groupArray.sort((a, b) => b.totalValue - a.totalValue);
  }, [assets]);

  const getCategoryDisplayName = (category: string): string => {
    const names: Record<string, string> = {
      property: 'Property',
      investments: 'Investments',
      cash: 'Cash & Savings',
      vehicles: 'Vehicles',
      personal: 'Personal Assets',
      business: 'Business Assets',
      other: 'Other Assets',
    };
    return names[category] || category;
  };

  const formatCategoryTotal = (total: number): string => {
    return `$${total.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  // Create flat list data with headers
  const flatListData = React.useMemo(() => {
    const data: (Asset | { type: 'header'; category: string; totalValue: number })[] = [];
    
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

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    if (item.type === 'header') {
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
    const showSeparator = nextItem && nextItem.type !== 'header';

    return (
      <AssetItem
        asset={item}
        onPress={onAssetPress}
        onDeletePress={onDeletePress}
        showSeparator={showSeparator}
      />
    );
  };

  const getItemType = (item: any) => {
    return item.type === 'header' ? 'header' : 'asset';
  };

  if (assets.length === 0) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={flatListData}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.type === 'header' ? `header-${item.category}` : `asset-${item.id}`}
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