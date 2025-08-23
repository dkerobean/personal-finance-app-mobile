import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  SafeAreaView,
  Alert 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/services/supabaseClient';
import { useAuthStore } from '@/stores/authStore';

interface AccountDetails {
  id: string;
  account_name: string;
  platform_source: 'mono' | 'mtn_momo';
  sync_status?: 'active' | 'auth_required' | 'error' | 'in_progress';
  last_synced_at?: string;
  phone_number?: string;
  institution_name?: string;
  balance?: number;
  created_at: string;
  consecutive_sync_failures?: number;
}

export default function AccountDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  const loadAccountDetails = async () => {
    if (!user?.id || !id) return;
    
    try {
      const { data: accountData, error } = await supabase
        .from('accounts')
        .select(`
          id,
          account_name,
          platform_source,
          sync_status,
          last_synced_at,
          phone_number,
          institution_name,
          balance,
          created_at,
          consecutive_sync_failures
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setAccount(accountData);
    } catch (error) {
      console.error('Failed to load account details:', error);
      Alert.alert('Error', 'Failed to load account details. Please try again.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccountDetails();
  }, [id, user?.id]);

  const handleDeactivateAccount = () => {
    if (!account) return;

    Alert.alert(
      'Deactivate Account',
      `Are you sure you want to deactivate "${account.account_name}"? This will stop automatic syncing for this account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('accounts')
                .update({ is_active: false })
                .eq('id', account.id);

              if (error) throw error;

              Alert.alert('Success', 'Account deactivated successfully', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              console.error('Failed to deactivate account:', error);
              Alert.alert('Error', 'Failed to deactivate account. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleForceSync = async () => {
    if (!account) return;

    Alert.alert(
      'Force Sync',
      `Force sync transactions for "${account.account_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync Now',
          onPress: () => {
            Alert.alert('Info', 'Manual sync feature will be implemented in a future update.');
          }
        }
      ]
    );
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
        return 'Bank Account (Mono)';
      case 'mtn_momo':
        return 'MTN Mobile Money';
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
        return 'Active & Syncing';
      case 'auth_required':
        return 'Needs Re-authentication';
      case 'error':
        return 'Sync Error';
      case 'in_progress':
        return 'Syncing...';
      default:
        return 'Unknown Status';
    }
  };

  const formatBalance = (balance?: number) => {
    if (!balance && balance !== 0) return 'Not Available';
    return `GHS ${balance.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading account details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!account) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Account not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: account.account_name,
          headerStyle: { backgroundColor: '#2563eb' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: '600' },
          headerShown: true,
        }} 
      />
      
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          {/* Account Header */}
          <View style={styles.accountHeader}>
            <View style={[
              styles.accountIcon,
              { backgroundColor: getPlatformColor(account.platform_source) }
            ]}>
              <MaterialIcons 
                name={getPlatformIcon(account.platform_source)}
                size={32} 
                color="#ffffff" 
              />
            </View>
            
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{account.account_name}</Text>
              <Text style={styles.accountType}>
                {getPlatformName(account.platform_source)}
              </Text>
              
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

          {/* Account Balance */}
          {account.balance !== undefined && account.balance !== null && (
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={styles.balanceAmount}>
                {formatBalance(account.balance)}
              </Text>
            </View>
          )}

          {/* Account Details */}
          <View style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Account Information</Text>
            
            {account.phone_number && (
              <View style={styles.detailRow}>
                <MaterialIcons name="phone" size={20} color="#6b7280" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Phone Number</Text>
                  <Text style={styles.detailValue}>+{account.phone_number}</Text>
                </View>
              </View>
            )}

            {account.institution_name && (
              <View style={styles.detailRow}>
                <MaterialIcons name="business" size={20} color="#6b7280" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Institution</Text>
                  <Text style={styles.detailValue}>{account.institution_name}</Text>
                </View>
              </View>
            )}

            <View style={styles.detailRow}>
              <MaterialIcons name="date-range" size={20} color="#6b7280" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Added</Text>
                <Text style={styles.detailValue}>{formatDate(account.created_at)}</Text>
              </View>
            </View>

            {account.last_synced_at && (
              <View style={styles.detailRow}>
                <MaterialIcons name="sync" size={20} color="#6b7280" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Last Synced</Text>
                  <Text style={styles.detailValue}>{formatDate(account.last_synced_at)}</Text>
                </View>
              </View>
            )}

            {account.consecutive_sync_failures && account.consecutive_sync_failures > 0 && (
              <View style={styles.detailRow}>
                <MaterialIcons name="warning" size={20} color="#f59e0b" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Failed Sync Attempts</Text>
                  <Text style={[styles.detailValue, { color: '#f59e0b' }]}>
                    {account.consecutive_sync_failures}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actionsCard}>
            <Text style={styles.cardTitle}>Actions</Text>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleForceSync}>
              <MaterialIcons name="sync" size={20} color="#2563eb" />
              <Text style={styles.actionButtonText}>Force Sync Now</Text>
              <MaterialIcons name="chevron-right" size={20} color="#d1d5db" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleDeactivateAccount}>
              <MaterialIcons name="link-off" size={20} color="#dc2626" />
              <Text style={[styles.actionButtonText, { color: '#dc2626' }]}>Deactivate Account</Text>
              <MaterialIcons name="chevron-right" size={20} color="#d1d5db" />
            </TouchableOpacity>
          </View>

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  accountIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  accountType: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  balanceCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  actionsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2563eb',
    marginLeft: 12,
    flex: 1,
  },
  bottomSpacing: {
    height: 40,
  },
});