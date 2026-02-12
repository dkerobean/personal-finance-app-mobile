import React, { useEffect, useState, useCallback } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Building2,
  Smartphone,
  Clock,
  ChevronRight,
  Link as LinkIcon
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MonoConnect } from '@/components/features/MonoConnect';
import GradientHeader from '@/components/budgets/GradientHeader';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS, BUDGET } from '@/constants/design';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

interface LinkedAccount {
  _id: string;
  accountName: string;
  accountType: string;
  balance: number;
  institutionName: string;
  monoAccountId: string;
  lastSyncedAt: string;
}

export default function MonoIntegrationScreen() {
  const { user } = useUser();
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLinkedAccounts = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(
        `${API_URL}/mono/accounts?userId=${user.id}&accountType=mobile_money`
      );
      const json = await response.json();
      
      if (response.ok) {
        setAccounts(json.data || []);
      }
    } catch (error) {
      console.error('Error fetching linked accounts:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchLinkedAccounts();
  }, [fetchLinkedAccounts]);

  const handleGoBack = () => {
    router.back();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLinkedAccounts();
  };

  const handleAccountLinked = () => {
    fetchLinkedAccounts();
  };

  const handleSyncTransactions = async (accountId: string) => {
    if (!user?.id) return;

    setIsSyncing(accountId);
    try {
      const response = await fetch(`${API_URL}/mono/sync-transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, accountId }),
      });

      const json = await response.json();

      if (response.ok) {
        Alert.alert(
          'Sync Complete',
          `Imported ${json.data.imported} new transactions.\n${json.data.skipped} duplicates skipped.`
        );
        fetchLinkedAccounts();
      } else {
        Alert.alert('Sync Failed', json.error || 'Unable to sync transactions');
      }
    } catch (error) {
      console.error('Error syncing transactions:', error);
      Alert.alert('Error', 'Failed to sync transactions');
    } finally {
      setIsSyncing(null);
    }
  };

  const formatLastSync = (dateString: string) => {
    if (!dateString) return 'Never synced';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getAccountIcon = (type: string) => {
    if (type === 'mobile_money') {
      return <Smartphone size={24} color={COLORS.warning} />;
    }
    return <Building2 size={24} color={COLORS.primary} />;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.white}
            colors={[COLORS.white]}
          />
        }
      >
        {/* Gradient Header */}
        <GradientHeader
          title="Ghana MoMo Sync"
          subtitle="Connect your Ghana MoMo account to auto-import transactions"
          onBackPress={handleGoBack}
          showCalendar={false}
          onCalendarPress={() => {}}
          onNotificationPress={() => {}}
        />

        {/* Content Card */}
        <View style={styles.contentCard}>
          {/* Link New Account Section */}
          <Animated.View entering={FadeInDown.duration(500)} style={styles.section}>
            <Text style={styles.sectionTitle}>Connect New Account</Text>
            <Text style={styles.sectionDescription}>
              Link your Ghana mobile money account via Mono to automatically sync incoming and outgoing transactions.
            </Text>
            <View style={styles.monoConnectWrapper}>
              <MonoConnect
                onSuccess={handleAccountLinked}
                expectedAccountType="mobile_money"
                expectedCountry="GH"
                buttonLabel="Link Ghana MoMo"
              />
            </View>
          </Animated.View>

          {/* Linked Accounts Section */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.section}>
            <Text style={styles.sectionTitle}>Linked Accounts</Text>
            
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading accounts...</Text>
              </View>
            ) : accounts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <LinkIcon size={40} color={COLORS.textTertiary} />
                <Text style={styles.emptyText}>No accounts linked yet</Text>
                <Text style={styles.emptySubtext}>
                  Connect an account above to start syncing transactions
                </Text>
              </View>
            ) : (
              <View style={styles.accountsList}>
                {accounts.map((account, index) => (
                  <Animated.View
                    key={account._id}
                    entering={FadeInDown.delay(index * 100).duration(400)}
                  >
                    <View style={styles.accountCard}>
                      <View style={styles.accountHeader}>
                        <View style={[
                          styles.accountIconBg,
                          { backgroundColor: account.accountType === 'mobile_money' ? '#FEF9C3' : COLORS.primaryLight }
                        ]}>
                          {getAccountIcon(account.accountType)}
                        </View>
                        <View style={styles.accountInfo}>
                          <Text style={styles.accountName}>{account.accountName}</Text>
                          <Text style={styles.institutionName}>{account.institutionName}</Text>
                        </View>
                        <View style={styles.balanceContainer}>
                          <Text style={styles.balanceLabel}>Balance</Text>
                          <Text style={styles.balanceAmount}>
                            ₵{account.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.accountFooter}>
                        <View style={styles.lastSyncContainer}>
                          <Clock size={14} color={COLORS.textTertiary} />
                          <Text style={styles.lastSyncText}>
                            Last sync: {formatLastSync(account.lastSyncedAt)}
                          </Text>
                        </View>
                        
                        <TouchableOpacity
                          style={[
                            styles.syncButton,
                            isSyncing === account._id && styles.syncButtonDisabled
                          ]}
                          onPress={() => handleSyncTransactions(account._id)}
                          disabled={isSyncing === account._id}
                        >
                          {isSyncing === account._id ? (
                            <ActivityIndicator size="small" color={COLORS.white} />
                          ) : (
                            <>
                              <RefreshCw size={16} color={COLORS.white} />
                              <Text style={styles.syncButtonText}>Sync Now</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Animated.View>
                ))}
              </View>
            )}
          </Animated.View>

          {/* Info Section */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.infoCard}>
            <CheckCircle size={20} color={COLORS.success} />
            <Text style={styles.infoText}>
              Your credentials are encrypted and never stored. Mono uses bank-grade security.
            </Text>
          </Animated.View>

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
    paddingTop: 28,
    paddingHorizontal: SPACING.lg,
    minHeight: '100%',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  sectionDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  monoConnectWrapper: {
    marginTop: SPACING.sm,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.xl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  accountsList: {
    gap: SPACING.md,
  },
  accountCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  accountIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  institutionName: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    marginBottom: 2,
  },
  balanceAmount: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
    color: COLORS.success,
  },
  accountFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  lastSyncContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  lastSyncText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xs,
  },
  syncButtonDisabled: {
    opacity: 0.7,
  },
  syncButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.white,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.md,
  },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    lineHeight: 18,
  },
  bottomSpacing: {
    height: 120,
  },
});
