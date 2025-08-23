import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/services/supabaseClient';
import { useAuthStore } from '@/stores/authStore';

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
  const { user } = useAuthStore();

  const loadLinkedAccounts = async () => {
    if (!user?.id) return;
    
    try {
      const { data: accounts, error } = await supabase
        .from('accounts')
        .select('id, account_name, platform_source, sync_status, last_synced_at')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .in('platform_source', ['mono', 'mtn_momo']);

      if (error) throw error;
      setLinkedAccounts(accounts || []);
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
    router.push('/accounts/add');
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
        return '#2563eb';
      case 'mtn_momo':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getSyncStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return '#059669';
      case 'auth_required':
        return '#f59e0b';
      case 'error':
        return '#dc2626';
      case 'in_progress':
        return '#2563eb';
      default:
        return '#6b7280';
    }
  };

  const getSyncStatusText = (status?: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'auth_required':
        return 'Needs Auth';
      case 'error':
        return 'Error';
      case 'in_progress':
        return 'Syncing';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <MaterialIcons name="account-balance-wallet" size={24} color="#6b7280" />
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
          <MaterialIcons name="account-balance-wallet" size={24} color="#6b7280" />
          <Text style={styles.title}>Connect Your Accounts</Text>
        </View>
        
        <View style={styles.emptyContainer}>
          <MaterialIcons name="add-circle-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Accounts Linked</Text>
          <Text style={styles.emptySubtitle}>
            Link your bank or MTN MoMo account to automatically sync transactions
          </Text>
          
          <TouchableOpacity style={styles.addAccountButton} onPress={handleAddAccount}>
            <MaterialIcons name="add" size={20} color="#ffffff" />
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
        <MaterialIcons name="account-balance-wallet" size={24} color="#059669" />
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
            <MaterialIcons name="warning" size={16} color="#f59e0b" />
            <Text style={styles.warningText}>
              Some accounts need re-authentication
            </Text>
          </View>
        )}

        {linkedAccounts.some(acc => acc.sync_status === 'error') && (
          <View style={styles.warningRow}>
            <MaterialIcons name="error" size={16} color="#dc2626" />
            <Text style={styles.warningText}>
              Some accounts have sync errors
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.manageButton} onPress={handleManageAccounts}>
          <Text style={styles.manageButtonText}>Manage Accounts</Text>
          <MaterialIcons name="chevron-right" size={20} color="#6b7280" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.addButton} onPress={handleAddAccount}>
          <MaterialIcons name="add" size={16} color="#2563eb" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  accountsCount: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  accountsCountText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addAccountButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  accountsSummary: {
    marginBottom: 12,
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
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  accountTypeCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingTop: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#f59e0b',
    marginLeft: 6,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  manageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 12,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2563eb',
    marginLeft: 4,
  },
});