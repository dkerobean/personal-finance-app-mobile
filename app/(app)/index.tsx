import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useTransactionStore, useDashboardData } from '@/stores/transactionStore';
import { accountsApi } from '@/services/api/accounts';
import { assetsApi } from '@/services/api/assets';
import { liabilitiesApi } from '@/services/api/liabilities';
import { Account, Asset, Liability } from '@/types/models';
import { useUser } from '@clerk/clerk-expo';

// New Design Components
import HomeHeader from '@/components/dashboard/HomeHeader';
import NetWorthCard from '@/components/dashboard/NetWorthCard';
import AccountsRail from '@/components/dashboard/AccountsRail';
import IncomeExpenseSummary from '@/components/dashboard/IncomeExpenseSummary';
import RecentTransactions from '@/components/dashboard/RecentTransactions';

import { COLORS, SPACING } from '@/constants/design';

export default function DashboardScreen(): React.ReactElement {
  const { user } = useUser();
  const { loadTransactions } = useTransactionStore();
  const { 
    recentTransactions, 
    totalIncome, 
    totalExpenses, 
    isLoading: isLoadingTransactions 
  } = useDashboardData();

  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load Data
  const loadData = useCallback(async () => {
    if (!user?.id) return;
    
    // Parallel fetching
    const promises = [
      loadTransactions(user.id),
      accountsApi.getAccounts(user.id)
        .then(data => setAccounts(data || []))
        .catch(err => console.error('Failed to load accounts:', err)),
      assetsApi.list(user.id)
        .then(response => setAssets(response.data || []))
        .catch(err => console.error('Failed to load assets:', err)),
      liabilitiesApi.list(user.id)
        .then(response => setLiabilities(response.data || []))
        .catch(err => console.error('Failed to load liabilities:', err))
    ];

    await Promise.all(promises);
    setIsLoadingAccounts(false);
  }, [user?.id, loadTransactions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Calculate True Net Worth: (Accounts + Assets) - Liabilities
  const accountsTotal = accounts.reduce((acc, account) => acc + (Number(account.balance) || 0), 0);
  const assetsTotal = assets
    .filter(asset => asset.is_active !== false)
    .reduce((acc, asset) => acc + (Number(asset.current_value) || 0), 0);
  const liabilitiesTotal = liabilities
    .filter(liability => liability.is_active !== false)
    .reduce((acc, liability) => acc + (Number(liability.current_balance) || 0), 0);
  
  const netWorth = accountsTotal + assetsTotal - liabilitiesTotal;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <HomeHeader 
        onNotificationPress={() => console.log('Notifications')}
        onProfilePress={() => router.push('/settings')}
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Income/Expense Summary Card with Action Buttons */}
        <IncomeExpenseSummary 
          monthlyIncome={totalIncome}
          monthlyExpense={totalExpenses}
        />

        {/* Net Worth Card */}
        <NetWorthCard 
          balance={netWorth} 
          onPress={() => router.push('/networth')}
        />

        {/* Accounts Rail */}
        <AccountsRail accounts={accounts} />

        {/* Reusing RecentTransactions but wrapping in padded view matching design */}
        <View style={styles.sectionContainer}>
           <RecentTransactions 
             transactions={recentTransactions} 
             isLoading={isLoadingTransactions} 
           />
        </View>
        
        {/* Bottom Padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundContent, // White background (Premium feel)
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  sectionContainer: {
    paddingHorizontal: SPACING.lg,
  }
});