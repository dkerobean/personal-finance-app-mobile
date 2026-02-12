import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useTransactionStore, useDashboardData } from '@/stores/transactionStore';
import { accountsApi } from '@/services/api/accounts';
import { NetWorthService } from '@/services/netWorthService';
import { Account } from '@/types/models';
import { useUser } from '@clerk/clerk-expo';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { UserRound } from 'lucide-react-native';

// New Design Components
import NetWorthCard from '@/components/dashboard/NetWorthCard';
import AccountsRail from '@/components/dashboard/AccountsRail';
import IncomeExpenseSummary from '@/components/dashboard/IncomeExpenseSummary';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import GradientHeader from '@/components/budgets/GradientHeader';

import { BUDGET, COLORS, SPACING } from '@/constants/design';

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
  const [netWorth, setNetWorth] = useState<number>(0);
  const [netWorthChange, setNetWorthChange] = useState<number>(0);
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
      // Fetch Real Net Worth from DB
      NetWorthService.getNetWorth(user.id)
        .then(data => {
          setNetWorth(data.netWorth);
          setNetWorthChange(data.monthlyChangePercentage || 0);
        })
        .catch(err => console.error('Failed to load net worth:', err))
    ];

    await Promise.all(promises);
  }, [user?.id, loadTransactions]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.white}
            colors={[COLORS.white]}
          />
        }
      >
        <GradientHeader
          title="Financial Home"
          subtitle="Track, save, and grow steadily"
          showCalendar={false}
          onNotificationPress={() => router.push('/notifications')}
          leftAccessory={
            <TouchableOpacity
              style={styles.headerAvatarButton}
              activeOpacity={0.85}
              onPress={() => router.push('/settings')}
            >
              {user?.imageUrl ? (
                <Image source={{ uri: user.imageUrl }} style={styles.headerAvatar} contentFit="cover" transition={180} />
              ) : (
                <View style={styles.headerAvatarFallback}>
                  <UserRound size={18} color={COLORS.primary} />
                </View>
              )}
            </TouchableOpacity>
          }
        />

        <View style={styles.contentCard}>
          <Animated.View entering={FadeInDown.duration(450)}>
            <IncomeExpenseSummary
              monthlyIncome={totalIncome}
              monthlyExpense={totalExpenses}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).duration(450)}>
            <NetWorthCard
              balance={netWorth}
              percentageChange={netWorthChange}
              onPress={() => router.push('/networth')}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(140).duration(450)}>
            <AccountsRail accounts={accounts} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(450)} style={styles.sectionContainer}>
            <RecentTransactions
              transactions={recentTransactions}
              isLoading={isLoadingTransactions}
            />
          </Animated.View>

          <View style={{ height: 110 }} />
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
  scrollContent: {
    paddingBottom: SPACING.lg,
  },
  contentCard: {
    backgroundColor: COLORS.backgroundContent,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -20,
    paddingTop: SPACING.md,
    minHeight: '100%',
  },
  headerAvatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionContainer: {
    paddingHorizontal: SPACING.lg,
  },
});
