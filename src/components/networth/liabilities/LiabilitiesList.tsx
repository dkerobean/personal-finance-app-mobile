import React from 'react';
import { View, Text, StyleSheet, RefreshControl, FlatList } from 'react-native';
import type { Liability, LiabilityCategory } from '@/types/models';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/design';
import LiabilityItem from './LiabilityItem';
import { formatCurrency } from '@/lib/formatters';
import { getLiabilityCategoryLabel } from '@/lib/netWorthCatalog';

interface LiabilitiesListProps {
  liabilities: Liability[];
  onLiabilityPress: (liabilityId: string) => void;
  onDeletePress?: (liability: Liability) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  loading?: boolean;
}

interface LiabilityGroup {
  category: string;
  liabilities: Liability[];
  totalBalance: number;
}

type LiabilityHeaderItem = { type: 'header'; category: string; totalBalance: number };
type LiabilityListItem = Liability | LiabilityHeaderItem;

export default function LiabilitiesList({
  liabilities,
  onLiabilityPress,
  onDeletePress,
  onRefresh,
  refreshing = false,
  loading = false,
}: LiabilitiesListProps): React.ReactElement {

  // Group liabilities by category
  const groupedLiabilities = React.useMemo(() => {
    const groups: Record<string, Liability[]> = {};
    
    liabilities.forEach(liability => {
      const category = liability.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(liability);
    });

    // Convert to array of groups and sort by total balance
    const groupArray: LiabilityGroup[] = Object.entries(groups).map(([category, categoryLiabilities]) => ({
      category,
      liabilities: categoryLiabilities.sort((a, b) => b.current_balance - a.current_balance),
      totalBalance: categoryLiabilities.reduce((sum, liability) => sum + liability.current_balance, 0),
    }));

    // Sort groups by total balance (highest first)
    return groupArray.sort((a, b) => b.totalBalance - a.totalBalance);
  }, [liabilities]);

  const getCategoryDisplayName = (category: string): string => {
    return getLiabilityCategoryLabel(category as LiabilityCategory);
  };

  const formatCategoryTotal = (total: number): string => {
    return formatCurrency(total);
  };

  // Create flat list data with headers
  const flatListData = React.useMemo(() => {
    const data: LiabilityListItem[] = [];
    
    groupedLiabilities.forEach(group => {
      // Add category header
      data.push({
        type: 'header',
        category: group.category,
        totalBalance: group.totalBalance,
      });
      
      // Add liabilities in this category
      group.liabilities.forEach(liability => {
        data.push(liability);
      });
    });
    
    return data;
  }, [groupedLiabilities]);

  const renderItem = ({ item, index }: { item: LiabilityListItem; index: number }) => {
    if ('type' in item && item.type === 'header') {
      return (
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>
            {getCategoryDisplayName(item.category)}
          </Text>
          <Text style={styles.categoryTotal}>
            {formatCategoryTotal(item.totalBalance)}
          </Text>
        </View>
      );
    }

    // Determine if we should show separator
    const nextItem = flatListData[index + 1];
    const showSeparator = nextItem ? !('type' in nextItem && nextItem.type === 'header') : false;

    const liability = item as Liability;

    return (
      <LiabilityItem
        liability={liability}
        onPress={onLiabilityPress}
        onDeletePress={onDeletePress}
        showSeparator={showSeparator}
      />
    );
  };

  if (liabilities.length === 0) {
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

          return `liability-${(item as Liability).id}`;
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.error]}
              tintColor={COLORS.error}
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
    color: COLORS.error, // Red for debt amounts
    fontFamily: 'Poppins',
  },
});
