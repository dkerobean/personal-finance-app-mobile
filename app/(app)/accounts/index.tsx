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
import { router, Stack } from 'expo-router';
import { supabase } from '@/services/supabaseClient';
import { useAuthStore } from '@/stores/authStore';

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
    <>
      <Stack.Screen 
        options={{ 
          title: 'Manage Accounts',
          headerStyle: { backgroundColor: '#2563eb' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: '600' },
          headerShown: true,
        }} 
      />
      
      <SafeAreaView style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Your Accounts</Text>
              <Text style={styles.subtitle}>
                {linkedAccounts.length} account{linkedAccounts.length !== 1 ? 's' : ''} connected
              </Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={handleAddAccount}>
              <MaterialIcons name="add" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Accounts List */}
          {linkedAccounts.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="account-balance-wallet" size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No Accounts Connected</Text>
              <Text style={styles.emptySubtitle}>
                Connect your bank or mobile money accounts to start tracking your finances automatically
              </Text>
              <TouchableOpacity style={styles.emptyAddButton} onPress={handleAddAccount}>
                <MaterialIcons name="add" size={20} color="#ffffff" />
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
                        color="#ffffff" 
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
                      <MaterialIcons name="sync" size={16} color="#6b7280" />
                      <Text style={styles.lastSyncText}>
                        Last sync: {formatLastSync(account.last_synced_at)}
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color="#d1d5db" />
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
                  <MaterialIcons name="add-circle-outline" size={32} color="#2563eb" />
                  <Text style={styles.addAccountTitle}>Add Another Account</Text>
                  <Text style={styles.addAccountSubtitle}>
                    Connect more bank or mobile money accounts
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  addButton: {
    backgroundColor: '#2563eb',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyAddButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  accountsList: {
    paddingHorizontal: 16,
  },
  accountCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  accountType: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  accountDetail: {
    fontSize: 12,
    color: '#9ca3af',
  },
  accountMeta: {
    alignItems: 'flex-end',
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  accountFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  lastSyncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastSyncText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
  addAccountSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  addAccountCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  addAccountContent: {
    alignItems: 'center',
  },
  addAccountTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 4,
  },
  addAccountSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 40,
  },
});