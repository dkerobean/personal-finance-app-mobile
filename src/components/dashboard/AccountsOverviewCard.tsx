import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { accountsApi } from '@/services/api/accounts';
import { useUser } from '@clerk/clerk-expo';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS } from '@/constants/design';

interface LinkedAccount {
  id: string;
  account_name: string;
  platform_source: 'mono' | 'mtn_momo';
  sync_status?: 'active' | 'auth_required' | 'error' | 'in_progress';
  last_synced_at?: string;
}

interface AccountsOverviewCardProps {
  onAccountsPress?: () => void;
}

export default function AccountsOverviewCard({ onAccountsPress }: AccountsOverviewCardProps) {
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();

  const loadLinkedAccounts = async () => {
    if (!user?.id) return;
    
    try {
      // Use accountsApi which connects to MongoDB backend
      const accounts = await accountsApi.getAccounts(user.id);
      
      // Map to local interface if necessary, or ensure backend matches
      // Account types from MongoDB have snake_case fields which match our interface
      setLinkedAccounts(accounts as unknown as LinkedAccount[] || []);
    } catch (error) {
      console.error('Failed to load linked accounts:', error);
      setLinkedAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLinkedAccounts();
  }, [user?.id]);

  const handleManageAccounts = () => {
    if (onAccountsPress) {
      onAccountsPress();
    } else {
      router.push('/accounts');
    }
  };

  const handleAddAccount = () => {
    router.push('/add-account');
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'mono':
        return 'account-balance';
      case 'mtn_momo':
        return 'phone-android';
      default:
        return 'account-circle';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'mono':
        return COLORS.accent;
      case 'mtn_momo':
        return COLORS.warning;
      default:
        return COLORS.textTertiary;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <MaterialIcons name="account-balance-wallet" size={24} color={COLORS.textTertiary} />
          <Text style={styles.title}>Linked Accounts</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading accounts...</Text>
        </View>
      </View>
    );
  }

  // Show add account CTA when no accounts are linked
  if (linkedAccounts.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <MaterialIcons name="account-balance-wallet" size={24} color={COLORS.textTertiary} />
          <Text style={styles.title}>Connect Your Accounts</Text>
        </View>
        
        <View style={styles.emptyContainer}>
          <MaterialIcons name="add-circle-outline" size={48} color={COLORS.gray400} />
          <Text style={styles.emptyTitle}>No Accounts Linked</Text>
          <Text style={styles.emptySubtitle}>
            Link your bank or MTN MoMo account to automatically sync transactions
          </Text>
          
          <TouchableOpacity style={styles.addAccountButton} onPress={handleAddAccount}>
            <MaterialIcons name="add" size={20} color={COLORS.white} />
            <Text style={styles.addAccountButtonText}>Add Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show linked accounts overview
  const monoAccounts = linkedAccounts.filter(acc => acc.platform_source === 'mono');
  const momoAccounts = linkedAccounts.filter(acc => acc.platform_source === 'mtn_momo');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MaterialIcons name="account-balance-wallet" size={24} color={COLORS.success} />
        <Text style={styles.title}>Linked Accounts</Text>
        <View style={styles.accountsCount}>
          <Text style={styles.accountsCountText}>{linkedAccounts.length}</Text>
        </View>
      </View>

      <View style={styles.accountsSummary}>
        {monoAccounts.length > 0 && (
          <View style={styles.accountTypeRow}>
            <View style={styles.accountTypeLeft}>
              <MaterialIcons 
                name="account-balance" 
                size={20} 
                color={getPlatformColor('mono')} 
              />
              <Text style={styles.accountTypeText}>Bank Accounts</Text>
            </View>
            <Text style={styles.accountTypeCount}>{monoAccounts.length}</Text>
          </View>
        )}

        {momoAccounts.length > 0 && (
          <View style={styles.accountTypeRow}>
            <View style={styles.accountTypeLeft}>
              <MaterialIcons 
                name="phone-android" 
                size={20} 
                color={getPlatformColor('mtn_momo')} 
              />
              <Text style={styles.accountTypeText}>MTN MoMo</Text>
            </View>
            <Text style={styles.accountTypeCount}>{momoAccounts.length}</Text>
          </View>
        )}

        {/* Show sync status warnings */}
        {linkedAccounts.some(acc => acc.sync_status === 'auth_required') && (
          <View style={styles.warningRow}>
            <MaterialIcons name="warning" size={16} color={COLORS.warning} />
            <Text style={styles.warningText}>
              Some accounts need re-authentication
            </Text>
          </View>
        )}

        {linkedAccounts.some(acc => acc.sync_status === 'error') && (
          <View style={styles.warningRow}>
            <MaterialIcons name="error" size={16} color={COLORS.error} />
            <Text style={styles.warningText}>
              Some accounts have sync errors
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.manageButton} onPress={handleManageAccounts}>
          <Text style={styles.manageButtonText}>Manage Accounts</Text>
          <MaterialIcons name="chevron-right" size={20} color={COLORS.textTertiary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.addButton} onPress={handleAddAccount}>
          <MaterialIcons name="add" size={16} color={COLORS.accent} />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    ...SHADOWS.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  accountsCount: {
    backgroundColor: COLORS.success,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  accountsCountText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  loadingContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textTertiary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  addAccountButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginLeft: 6,
  },
  accountsSummary: {
    marginBottom: SPACING.md,
  },
  accountTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  accountTypeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountTypeText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  accountTypeCount: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textTertiary,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingTop: 8,
  },
  warningText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.warning,
    marginLeft: 6,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  manageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  manageButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 12,
  },
  addButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.accent,
    marginLeft: 4,
  },
});