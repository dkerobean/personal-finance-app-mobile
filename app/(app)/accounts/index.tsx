import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  SafeAreaView,
  RefreshControl,
  Alert 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/services/supabaseClient';
import { useAuthStore } from '@/stores/authStore';
import GradientHeader from '@/components/budgets/GradientHeader';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS, BUDGET } from '@/constants/design';

interface LinkedAccount {
  id: string;
  account_name: string;
  platform_source: 'mono' | 'mtn_momo';
  sync_status?: 'active' | 'auth_required' | 'error' | 'in_progress';
  last_synced_at?: string;
  phone_number?: string;
  institution_name?: string;
  balance?: number;
}

export default function AccountsScreen() {
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  const loadLinkedAccounts = async () => {
    if (!user?.id) return;
    
    try {
      const { data: accounts, error } = await supabase
        .from('accounts')
        .select(`
          id,
          account_name,
          platform_source,
          sync_status,
          last_synced_at,
          phone_number,
          institution_name,
          balance
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinkedAccounts(accounts || []);
    } catch (error) {
      console.error('Failed to load linked accounts:', error);
      Alert.alert('Error', 'Failed to load accounts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLinkedAccounts();
  }, [user?.id]);

  const handleRefresh = async () => {
    setIsLoading(true);
    await loadLinkedAccounts();
  };

  const handleAddAccount = () => {
    router.push('/accounts/add');
  };

  const handleAccountPress = (account: LinkedAccount) => {
    // Navigate to account details
    router.push(`/accounts/${account.id}`);
  };

  const handleGoBack = (): void => {
    router.back();
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

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'mono':
        return 'Bank Account';
      case 'mtn_momo':
        return 'MTN MoMo';
      default:
        return 'Account';
    }
  };

  const getSyncStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return COLORS.success;
      case 'auth_required':
        return COLORS.warning;
      case 'error':
        return COLORS.error;
      case 'in_progress':
        return COLORS.accent;
      default:
        return COLORS.textTertiary;
    }
  };

  const getSyncStatusText = (status?: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'auth_required':
        return 'Needs Re-auth';
      case 'error':
        return 'Error';
      case 'in_progress':
        return 'Syncing';
      default:
        return 'Unknown';
    }
  };

  const formatBalance = (balance?: number) => {
    if (!balance && balance !== 0) return null;
    return `GHS ${balance.toFixed(2)}`;
  };

  const formatLastSync = (dateString?: string) => {
    if (!dateString) return 'Never synced';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Gradient Header Section */}
        <GradientHeader
          title="Your Accounts"
          subtitle={`${linkedAccounts.length} account${linkedAccounts.length !== 1 ? 's' : ''} connected`}
          onBackPress={handleGoBack}
          onCalendarPress={() => {
            // Handle calendar press
          }}
          onNotificationPress={() => {
            // Handle notification press
          }}
          showCalendar={false}
        />

        {/* Content Card */}
        <View style={styles.contentCard}>
          {/* Add Account Button */}
          <View style={styles.addAccountHeader}>
            <TouchableOpacity style={styles.addButton} onPress={handleAddAccount}>
              <MaterialIcons name="add" size={24} color={COLORS.white} />
              <Text style={styles.addButtonText}>Add Account</Text>
            </TouchableOpacity>
          </View>

          {/* Accounts List */}
          {linkedAccounts.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="account-balance-wallet" size={64} color={COLORS.textTertiary} />
              <Text style={styles.emptyTitle}>No Accounts Connected</Text>
              <Text style={styles.emptySubtitle}>
                Connect your bank or mobile money accounts to start tracking your finances automatically
              </Text>
              <TouchableOpacity style={styles.emptyAddButton} onPress={handleAddAccount}>
                <MaterialIcons name="add" size={20} color={COLORS.white} />
                <Text style={styles.emptyAddButtonText}>Add Your First Account</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.accountsList}>
              {linkedAccounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={styles.accountCard}
                  onPress={() => handleAccountPress(account)}
                >
                  <View style={styles.accountHeader}>
                    <View style={[
                      styles.accountIcon,
                      { backgroundColor: getPlatformColor(account.platform_source) }
                    ]}>
                      <MaterialIcons 
                        name={getPlatformIcon(account.platform_source)}
                        size={24} 
                        color={COLORS.white} 
                      />
                    </View>
                    
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountName}>{account.account_name}</Text>
                      <Text style={styles.accountType}>
                        {getPlatformName(account.platform_source)}
                      </Text>
                      {account.phone_number && (
                        <Text style={styles.accountDetail}>+{account.phone_number}</Text>
                      )}
                      {account.institution_name && (
                        <Text style={styles.accountDetail}>{account.institution_name}</Text>
                      )}
                    </View>

                    <View style={styles.accountMeta}>
                      {account.balance !== undefined && account.balance !== null && (
                        <Text style={styles.accountBalance}>
                          {formatBalance(account.balance)}
                        </Text>
                      )}
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getSyncStatusColor(account.sync_status) }
                      ]}>
                        <Text style={styles.statusText}>
                          {getSyncStatusText(account.sync_status)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.accountFooter}>
                    <View style={styles.lastSyncInfo}>
                      <MaterialIcons name="sync" size={16} color={COLORS.textTertiary} />
                      <Text style={styles.lastSyncText}>
                        Last sync: {formatLastSync(account.last_synced_at)}
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={COLORS.textTertiary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Add Account CTA for existing users */}
          {linkedAccounts.length > 0 && (
            <View style={styles.addAccountSection}>
              <TouchableOpacity style={styles.addAccountCard} onPress={handleAddAccount}>
                <View style={styles.addAccountContent}>
                  <MaterialIcons name="add-circle-outline" size={32} color={COLORS.primary} />
                  <Text style={styles.addAccountTitle}>Add Another Account</Text>
                  <Text style={styles.addAccountSubtitle}>
                    Connect more bank or mobile money accounts
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom spacing for navigation */}
          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BUDGET.gradientColors.start,
  },
  mainScrollView: {
    flex: 1,
  },
  contentCard: {
    backgroundColor: COLORS.backgroundContent,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -20,
    paddingTop: 20,
    flex: 1,
  },
  addAccountHeader: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.huge,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  addButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl * 2,
    paddingHorizontal: SPACING.xxxl,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  emptyAddButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginLeft: SPACING.sm,
  },
  accountsList: {
    paddingHorizontal: SPACING.lg,
  },
  accountCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  accountType: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  accountDetail: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
  },
  accountMeta: {
    alignItems: 'flex-end',
  },
  accountBalance: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
  },
  statusText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
    textTransform: 'uppercase',
  },
  accountFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  lastSyncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastSyncText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  addAccountSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  addAccountCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  addAccountContent: {
    alignItems: 'center',
  },
  addAccountTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  addAccountSubtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 150,
  },
});