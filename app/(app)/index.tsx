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
import GradientHeader from '@/components/budgets/GradientHeader';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS, BUDGET } from '@/constants/design';

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

  const handleNetWorthCalculator = (): void => {
    router.push('/networth');
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
          title="Hi, Welcome Back"
          subtitle="Good Morning"
          onCalendarPress={() => {
            // Handle calendar press
          }}
          onNotificationPress={() => {
            console.log('Notifications');
          }}
          showCalendar={false}
        />

        {/* Content Card */}
        <View style={styles.contentCard}>

          {/* Total Balance Card */}
          <TotalBalanceCard transactions={transactions} isLoading={isLoading} />

          {/* Net Worth Link Card */}
          <TouchableOpacity style={styles.netWorthLinkCard} onPress={handleNetWorthCalculator}>
            <View style={styles.netWorthHeader}>
              <Text style={styles.netWorthTitle}>Net Worth Calculator</Text>
              <MaterialIcons name="calculate" size={24} color={COLORS.white} />
            </View>
            <Text style={styles.netWorthDescription}>
              Calculate and track your total net worth
            </Text>
            <View style={styles.netWorthCta}>
              <Text style={styles.netWorthCtaText}>View Details</Text>
              <MaterialIcons name="arrow-forward" size={16} color={COLORS.white} />
            </View>
          </TouchableOpacity>

          {/* Accounts Overview */}
          <AccountsOverviewCard onAccountsPress={handleManageAccounts} />

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleAddTransaction}>
              <MaterialIcons name="add" size={24} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Add Transaction</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButtonSecondary} onPress={handleViewTransactions}>
              <MaterialIcons name="list" size={24} color={COLORS.primary} />
              <Text style={styles.actionButtonSecondaryText}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Budget and Reports Actions */}
          <View style={styles.budgetActions}>
            <TouchableOpacity style={styles.budgetButton} onPress={handleViewBudgets}>
              <MaterialIcons name="account-balance-wallet" size={24} color={COLORS.success} />
              <Text style={styles.budgetButtonText}>Manage Budgets</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.reportsButton} onPress={handleViewReports}>
              <MaterialIcons name="assessment" size={24} color={COLORS.accent} />
              <Text style={styles.reportsButtonText}>View Reports</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Transactions */}
          <RecentTransactions transactions={recentTransactions} isLoading={isLoading} />

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={24} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
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
    backgroundColor: COLORS.backgroundCard,
    marginHorizontal: SPACING.xl,
    marginVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    ...SHADOWS.sm,
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.sizes.md,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  bottomSpacing: {
    height: 150,
  },
  // Net Worth Link Card styles
  netWorthLinkCard: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.xl,
    marginVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.md,
  },
  netWorthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  netWorthTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  netWorthDescription: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: SPACING.lg,
  },
  netWorthCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  netWorthCtaText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.white,
    marginRight: SPACING.xs,
  },
});