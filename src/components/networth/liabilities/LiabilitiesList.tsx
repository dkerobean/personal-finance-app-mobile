import React from 'react';
import { View, Text, StyleSheet, RefreshControl, FlatList } from 'react-native';
import type { Liability } from '@/types/models';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/design';
import LiabilityItem from './LiabilityItem';

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
    const names: Record<string, string> = {
      loans: 'Loans',
      credit_cards: 'Credit Cards',
      mortgages: 'Mortgages',
      business_debt: 'Business Debt',
      other: 'Other Debts',
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
    const data: (Liability | { type: 'header'; category: string; totalBalance: number })[] = [];
    
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

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    if (item.type === 'header') {
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
    const showSeparator = nextItem && nextItem.type !== 'header';

    return (
      <LiabilityItem
        liability={item}
        onPress={onLiabilityPress}
        onDeletePress={onDeletePress}
        showSeparator={showSeparator}
      />
    );
  };

  const getItemType = (item: any) => {
    return item.type === 'header' ? 'header' : 'liability';
  };

  if (liabilities.length === 0) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={flatListData}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.type === 'header' ? `header-${item.category}` : `liability-${item.id}`}
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