import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/constants/design';

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
}

interface AssetLiabilityQuickActionsProps {
  onAddAsset?: () => void;
  onAddLiability?: () => void;
  onViewAssets?: () => void;
  onViewLiabilities?: () => void;
  onViewHistory?: () => void;
  onCalculateNetWorth?: () => void;
  isLoading?: boolean;
}

export default function AssetLiabilityQuickActions({
  onAddAsset,
  onAddLiability,
  onViewAssets,
  onViewLiabilities,
  onViewHistory,
  onCalculateNetWorth,
  isLoading = false,
}: AssetLiabilityQuickActionsProps): React.ReactElement {
  const quickActions: QuickAction[] = [
    {
      id: 'add_asset',
      title: 'Add Asset',
      icon: 'add-circle',
      color: COLORS.success,
      onPress: onAddAsset || (() => {}),
    },
    {
      id: 'add_liability',
      title: 'Add Liability',
      icon: 'remove-circle',
      color: COLORS.error,
      onPress: onAddLiability || (() => {}),
    },
    {
      id: 'view_assets',
      title: 'View Assets',
      icon: 'trending-up',
      color: COLORS.success,
      onPress: onViewAssets || (() => {}),
    },
    {
      id: 'view_liabilities',
      title: 'View Liabilities',
      icon: 'trending-down',
      color: COLORS.error,
      onPress: onViewLiabilities || (() => {}),
    },
    {
      id: 'view_history',
      title: 'History',
      icon: 'history',
      color: COLORS.primary,
      onPress: onViewHistory || (() => {}),
    },
    {
      id: 'calculate',
      title: 'Refresh',
      icon: 'refresh',
      color: COLORS.warning,
      onPress: onCalculateNetWorth || (() => {}),
    },
  ];

  const renderQuickAction = (action: QuickAction) => (
    <TouchableOpacity
      key={action.id}
      style={styles.actionButton}
      onPress={action.onPress}
      activeOpacity={0.8}
      disabled={isLoading}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${action.color}15` }]}>
        <MaterialIcons name={action.icon as any} size={28} color={action.color} />
      </View>
      <Text style={styles.actionTitle}>{action.title}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.loadingTitle} />
        </View>
        <View style={styles.actionsGrid}>
          {[...Array(6)].map((_, index) => (
            <View key={index} style={styles.loadingAction}>
              <View style={styles.loadingIcon} />
              <View style={styles.loadingActionTitle} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quick Actions</Text>
        <TouchableOpacity>
          <MaterialIcons name="more-horiz" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.actionsGrid}>
        {quickActions.map(renderQuickAction)}
      </View>

      <View style={styles.tipsContainer}>
        <MaterialIcons name="lightbulb-outline" size={16} color={COLORS.primary} />
        <Text style={styles.tipsText}>
          Tip: Keep your assets and liabilities updated for accurate net worth tracking
        </Text>
      </View>
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
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  actionButton: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  actionTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  tipsText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 18,
  },
  // Loading states
  loadingTitle: {
    width: 120,
    height: 20,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: BORDER_RADIUS.sm,
  },
  loadingAction: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    opacity: 0.6,
  },
  loadingIcon: {
    width: 56,
    height: 56,
    backgroundColor: COLORS.border,
    borderRadius: 28,
    marginBottom: SPACING.sm,
  },
  loadingActionTitle: {
    width: 80,
    height: 16,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
  },
});