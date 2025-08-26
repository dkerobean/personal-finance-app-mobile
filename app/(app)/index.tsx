import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useTransactionStore, useDashboardData } from '@/stores/transactionStore';
import { authService } from '@/services/authService';
import TotalBalanceCard from '@/components/dashboard/TotalBalanceCard';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import AccountsOverviewCard from '@/components/dashboard/AccountsOverviewCard';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/design';

export default function DashboardScreen(): React.ReactElement {
  const { user, logout } = useAuthStore();
  const { loadTransactions } = useTransactionStore();
  const { transactions, isLoading, error, recentTransactions } = useDashboardData();

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleSignOut = async (): Promise<void> => {
    const result = await authService.signOut();
    if (result.success) {
      await logout();
      router.replace('/(auth)/login');
    }
  };

  const handleRefresh = async (): Promise<void> => {
    await loadTransactions();
  };

  const handleAddTransaction = (): void => {
    router.push('/transactions/create');
  };

  const handleViewTransactions = (): void => {
    router.push('/transactions');
  };

  const handleViewBudgets = (): void => {
    router.push('/budgets');
  };

  const handleManageAccounts = (): void => {
    router.push('/accounts');
  };

  const handleViewReports = (): void => {
    router.push('/reports');
  };

  const handleSettings = (): void => {
    router.push('/settings');
  };


  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Hi, Welcome Back</Text>
          <Text style={styles.welcomeText}>Good Morning</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.notificationButton} onPress={() => console.log('Notifications')}>
            <View style={styles.notificationIconContainer}>
              <MaterialIcons name="notifications-none" size={20} color={COLORS.textPrimary} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Container */}
      <View style={styles.contentContainer}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
        >

        {/* Total Balance Card */}
        <TotalBalanceCard transactions={transactions} isLoading={isLoading} />

        {/* Accounts Overview */}
        <AccountsOverviewCard onAccountsPress={handleManageAccounts} />

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleAddTransaction}>
            <MaterialIcons name="add" size={24} color="#ffffff" />
            <Text style={styles.actionButtonText}>Add Transaction</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButtonSecondary} onPress={handleViewTransactions}>
            <MaterialIcons name="list" size={24} color="#2563eb" />
            <Text style={styles.actionButtonSecondaryText}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Budget and Reports Actions */}
        <View style={styles.budgetActions}>
          <TouchableOpacity style={styles.budgetButton} onPress={handleViewBudgets}>
            <MaterialIcons name="account-balance-wallet" size={24} color="#059669" />
            <Text style={styles.budgetButtonText}>Manage Budgets</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.reportsButton} onPress={handleViewReports}>
            <MaterialIcons name="assessment" size={24} color="#7c3aed" />
            <Text style={styles.reportsButtonText}>View Reports</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <RecentTransactions transactions={recentTransactions} isLoading={isLoading} />

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={24} color="#dc3545" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

          {/* Bottom spacing for navigation */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundMain,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.normal,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundContent,
    borderTopLeftRadius: BORDER_RADIUS.huge,
    borderTopRightRadius: BORDER_RADIUS.huge,
    marginTop: SPACING.md,
  },
  scrollView: {
    flex: 1,
    paddingTop: SPACING.xxxl,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    padding: SPACING.sm,
  },
  notificationIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    marginVertical: SPACING.md,
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.md,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginLeft: SPACING.sm,
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  actionButtonSecondaryText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginLeft: SPACING.sm,
  },
  budgetActions: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  budgetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 2,
    borderColor: COLORS.success,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  budgetButtonText: {
    color: COLORS.success,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginLeft: SPACING.sm,
  },
  reportsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 2,
    borderColor: COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  reportsButtonText: {
    color: COLORS.accent,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginLeft: SPACING.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: SPACING.xl,
    marginHorizontal: SPACING.xl,
    marginVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.sizes.md,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  bottomSpacing: {
    height: 130,
  },
});