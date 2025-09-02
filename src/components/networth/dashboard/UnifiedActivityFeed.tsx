import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/constants/design';
import { formatCurrency, formatDateRelative } from '@/lib/formatters';

export interface ActivityItem {
  id: string;
  type: 'asset_added' | 'liability_added' | 'asset_updated' | 'liability_updated' | 'net_worth_calculated';
  title: string;
  description: string;
  amount?: number;
  timestamp: string;
  category?: string;
}

interface UnifiedActivityFeedProps {
  activities: ActivityItem[];
  isLoading?: boolean;
  onViewAll?: () => void;
  onItemPress?: (item: ActivityItem) => void;
}

export default function UnifiedActivityFeed({
  activities = [],
  isLoading = false,
  onViewAll,
  onItemPress,
}: UnifiedActivityFeedProps): React.ReactElement {
  const [showAll, setShowAll] = useState(false);
  
  const displayedActivities = showAll ? activities : activities.slice(0, 5);

  const getActivityIcon = (type: ActivityItem['type']): string => {
    switch (type) {
      case 'asset_added':
        return 'add-circle';
      case 'liability_added':
        return 'remove-circle';
      case 'asset_updated':
        return 'edit';
      case 'liability_updated':
        return 'edit';
      case 'net_worth_calculated':
        return 'calculate';
      default:
        return 'info';
    }
  };

  const getActivityColor = (type: ActivityItem['type']): string => {
    switch (type) {
      case 'asset_added':
      case 'asset_updated':
        return COLORS.success;
      case 'liability_added':
      case 'liability_updated':
        return COLORS.error;
      case 'net_worth_calculated':
        return COLORS.primary;
      default:
        return COLORS.textSecondary;
    }
  };

  const renderActivityItem = ({ item }: { item: ActivityItem }) => (
    <TouchableOpacity
      style={styles.activityItem}
      onPress={() => onItemPress?.(item)}
      activeOpacity={0.8}
    >
      <View style={[styles.activityIcon, { backgroundColor: `${getActivityColor(item.type)}15` }]}>
        <MaterialIcons
          name={getActivityIcon(item.type) as any}
          size={20}
          color={getActivityColor(item.type)}
        />
      </View>
      
      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.activityTime}>
            {formatDateRelative(item.timestamp)}
          </Text>
        </View>
        
        <Text style={styles.activityDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        {item.amount !== undefined && (
          <View style={styles.amountContainer}>
            <Text style={[styles.activityAmount, { color: getActivityColor(item.type) }]}>
              {item.type.includes('liability') ? '-' : '+'}{formatCurrency(item.amount)}
            </Text>
            {item.category && (
              <View style={[styles.categoryTag, { backgroundColor: `${getActivityColor(item.type)}15` }]}>
                <Text style={[styles.categoryText, { color: getActivityColor(item.type) }]}>
                  {item.category}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <MaterialIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="timeline" size={48} color={COLORS.textSecondary} />
      <Text style={styles.emptyTitle}>No Recent Activity</Text>
      <Text style={styles.emptyDescription}>
        Start by adding your assets and liabilities to see activity here
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      {[...Array(3)].map((_, index) => (
        <View key={index} style={styles.loadingItem}>
          <View style={styles.loadingIcon} />
          <View style={styles.loadingContent}>
            <View style={styles.loadingTitle} />
            <View style={styles.loadingDescription} />
            <View style={styles.loadingAmount} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Activity</Text>
        <TouchableOpacity onPress={onViewAll || (() => setShowAll(!showAll))}>
          <Text style={styles.viewAllText}>
            {showAll ? 'Show Less' : 'View All'}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        renderLoadingState()
      ) : activities.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={displayedActivities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
      )}

      {activities.length > 5 && !showAll && (
        <TouchableOpacity
          style={styles.showMoreButton}
          onPress={() => setShowAll(true)}
        >
          <Text style={styles.showMoreText}>
            Show {activities.length - 5} more activities
          </Text>
          <MaterialIcons name="expand-more" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundCard,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  viewAllText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  activityTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    flex: 1,
  },
  activityTime: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  activityDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.xs,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityAmount: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  categoryTag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  categoryText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.sm,
  },
  showMoreText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    marginRight: SPACING.xs,
  },
  // Loading states
  loadingContainer: {
    opacity: 0.6,
  },
  loadingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  loadingIcon: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: 20,
    marginRight: SPACING.md,
  },
  loadingContent: {
    flex: 1,
  },
  loadingTitle: {
    width: '60%',
    height: 16,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  loadingDescription: {
    width: '80%',
    height: 14,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  loadingAmount: {
    width: '40%',
    height: 16,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: BORDER_RADIUS.sm,
  },
});