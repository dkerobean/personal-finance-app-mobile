import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TrendingUp, TrendingDown, Plus, Minus, Clock, RefreshCw } from 'lucide-react-native';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import NetWorthSummaryCard from '@/components/networth/dashboard/NetWorthSummaryCard';
import NetWorthBreakdownChart from '@/components/networth/dashboard/NetWorthBreakdownChart';
import NetWorthTrendChart from '@/components/networth/dashboard/NetWorthTrendChart';
import NetWorthLoadingState from '@/components/networth/dashboard/NetWorthLoadingState';
import NetWorthErrorState, { NetworkError, CalculationError } from '@/components/networth/dashboard/NetWorthErrorState';
import FinancialHealthScore from '@/components/networth/dashboard/FinancialHealthScore';
import AssetLiabilityQuickActions from '@/components/networth/dashboard/AssetLiabilityQuickActions';
import UnifiedActivityFeed, { ActivityItem } from '@/components/networth/dashboard/UnifiedActivityFeed';
import GradientHeader from '@/components/budgets/GradientHeader';
import { NetWorthService, NetWorthData } from '@/services/netWorthService';
import { useNetWorthStore, useNetWorthDashboard } from '@/stores/netWorthStore';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS, BUDGET } from '@/constants/design';

export default function NetWorthScreen(): React.ReactElement {
  const [isLoading, setIsLoading] = useState(false);
  const [netWorthData, setNetWorthData] = useState<NetWorthData>({
    netWorth: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    monthlyChange: 0,
    monthlyChangePercentage: 0,
    assetsBreakdown: [],
    liabilitiesBreakdown: [],
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savingsRate: 0,
  });
  
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [dashboardError, setDashboardError] = useState<any>(null);
  
  const { 
    assets, 
    liabilities, 
    isLoadingAssets, 
    isLoadingLiabilities, 
    error,
    loadAssets,
    loadLiabilities,
    clearError 
  } = useNetWorthStore();

  const {
    currentNetWorth,
    isCalculating,
    calculationError,
    historicalData,
    isLoadingHistory,
    assetsBreakdown,
    liabilitiesBreakdown,
    refreshNetWorth,
    loadHistoricalData,
    resetCalculationError,
  } = useNetWorthDashboard();

  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          loadAssets(),
          loadLiabilities(),
          loadHistoricalData(),
        ]);
        await refreshNetWorth();
        loadNetWorthData();
      } catch (error) {
        console.error('Error initializing dashboard data:', error);
        setDashboardError(NetworkError('Failed to load dashboard data'));
      }
    };

    initializeData();
  }, []);

  useEffect(() => {
    if (assets.length > 0 || liabilities.length > 0) {
      refreshNetWorth();
      loadNetWorthData();
    }
  }, [assets, liabilities]);

  useFocusEffect(
    React.useCallback(() => {
      const refreshStoreData = async () => {
        try {
          await Promise.all([
            loadAssets(),
            loadLiabilities()
          ]);
        } catch (error) {
          console.error('Error refreshing store data on focus:', error);
        }
      };

      refreshStoreData();
    }, [loadAssets, loadLiabilities])
  );

  const loadNetWorthData = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const data = await NetWorthService.calculateNetWorth();
      setNetWorthData(data);

      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'asset_added',
          title: 'Investment Account Added',
          description: 'Added Vanguard S&P 500 ETF to portfolio',
          amount: 10000,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          category: 'investments',
        },
        {
          id: '2',
          type: 'net_worth_calculated',
          title: 'Net Worth Recalculated',
          description: 'Monthly net worth snapshot completed',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setActivities(mockActivities);
    } catch (error) {
      console.error('Error loading net worth data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async (): Promise<void> => {
    if (error) clearError();
    if (calculationError) resetCalculationError();
    if (dashboardError) setDashboardError(null);
    
    try {
      await Promise.all([
        loadAssets(),
        loadLiabilities(),
        loadHistoricalData(),
      ]);
      await refreshNetWorth();
      loadNetWorthData();
    } catch (error) {
      console.error('Error during refresh:', error);
      setDashboardError(NetworkError('Failed to refresh data'));
    }
  };

  const handleRetryError = async (): Promise<void> => {
    setDashboardError(null);
    await handleRefresh();
  };

  const combinedLoading = isLoading || isLoadingAssets || isLoadingLiabilities || isCalculating;
  const isInitialLoading = combinedLoading && (!assets.length && !liabilities.length);
  const currentError = dashboardError || (calculationError && CalculationError(calculationError)) || (error && NetworkError(error));

  const handleGoBack = (): void => {
    router.back();
  };

  const handleAddAsset = (): void => {
    router.push('/networth/assets/add');
  };

  const handleAddLiability = (): void => {
    router.push('/networth/liabilities/add');
  };

  const handleViewAssets = (): void => {
    router.push('/networth/assets');
  };

  const handleViewLiabilities = (): void => {
    router.push('/networth/liabilities');
  };

  const handleViewHistory = (): void => {
    router.push('/networth/history');
  };

  const handleCalculateNetWorth = (): void => {
    handleRefresh();
  };

  const handleActivityPress = (activity: ActivityItem): void => {
    console.log('Activity pressed:', activity.title);
  };

  const formatCurrency = (amount: number): string => {
    return `₵${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView 
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={combinedLoading && !isInitialLoading} 
            onRefresh={handleRefresh}
            tintColor={COLORS.white}
            colors={[COLORS.white]}
          />
        }
      >
        {/* Gradient Header Section */}
        <GradientHeader
          title="Net Worth"
          onBackPress={handleGoBack}
          onCalendarPress={() => router.push('/networth/history')}
          onNotificationPress={() => {}}
        />

        {/* Content Card */}
        <View style={styles.contentCard}>
          {isInitialLoading ? (
            <NetWorthLoadingState showTrendChart={true} />
          ) : currentError ? (
            <NetWorthErrorState 
              error={currentError}
              onRetry={handleRetryError}
              showContactSupport={true}
            />
          ) : (
            <>
              {/* Net Worth Hero Card */}
              <Animated.View entering={FadeInUp.duration(600)} style={styles.heroCard}>
                <Text style={styles.heroLabel}>Total Net Worth</Text>
                <Text style={styles.heroAmount}>
                  {formatCurrency(currentNetWorth?.netWorth || netWorthData.netWorth)}
                </Text>
                <View style={styles.changeContainer}>
                  {(currentNetWorth?.monthlyChange || netWorthData.monthlyChange) >= 0 ? (
                    <TrendingUp size={20} color={COLORS.success} />
                  ) : (
                    <TrendingDown size={20} color={COLORS.error} />
                  )}
                  <Text style={[
                    styles.changeText,
                    { color: (currentNetWorth?.monthlyChange || netWorthData.monthlyChange) >= 0 ? COLORS.success : COLORS.error }
                  ]}>
                    {formatCurrency(Math.abs(currentNetWorth?.monthlyChange || netWorthData.monthlyChange))} this month
                  </Text>
                </View>
              </Animated.View>

              {/* Assets & Liabilities Summary */}
              <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.summaryRow}>
                <TouchableOpacity style={styles.summaryCard} onPress={handleViewAssets}>
                  <View style={[styles.summaryIconBg, { backgroundColor: COLORS.primaryLight }]}>
                    <TrendingUp size={24} color={COLORS.primary} />
                  </View>
                  <Text style={styles.summaryLabel}>Total Assets</Text>
                  <Text style={styles.summaryAmount}>
                    {formatCurrency(currentNetWorth?.totalAssets || netWorthData.totalAssets)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.summaryCard} onPress={handleViewLiabilities}>
                  <View style={[styles.summaryIconBg, { backgroundColor: '#FEF2F2' }]}>
                    <TrendingDown size={24} color={COLORS.error} />
                  </View>
                  <Text style={styles.summaryLabel}>Total Liabilities</Text>
                  <Text style={styles.summaryAmount}>
                    {formatCurrency(currentNetWorth?.totalLiabilities || netWorthData.totalLiabilities)}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Quick Actions */}
              <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.quickActionsSection}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.quickActionsGrid}>
                  <TouchableOpacity style={styles.actionButton} onPress={handleAddAsset}>
                    <View style={[styles.actionIconBg, { backgroundColor: COLORS.primaryLight }]}>
                      <Plus size={24} color={COLORS.primary} />
                    </View>
                    <Text style={styles.actionText}>Add Asset</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionButton} onPress={handleAddLiability}>
                    <View style={[styles.actionIconBg, { backgroundColor: '#FEF2F2' }]}>
                      <Minus size={24} color={COLORS.error} />
                    </View>
                    <Text style={styles.actionText}>Add Liability</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionButton} onPress={handleViewHistory}>
                    <View style={[styles.actionIconBg, { backgroundColor: COLORS.lightBlue }]}>
                      <Clock size={24} color={COLORS.accent} />
                    </View>
                    <Text style={styles.actionText}>View History</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionButton} onPress={handleCalculateNetWorth}>
                    <View style={[styles.actionIconBg, { backgroundColor: '#FEF9C3' }]}>
                      <RefreshCw size={24} color={COLORS.warning} />
                    </View>
                    <Text style={styles.actionText}>Recalculate</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Trend Chart */}
              <NetWorthTrendChart
                historicalData={historicalData}
                isLoading={isLoadingHistory}
                onViewHistory={handleViewHistory}
              />

              {/* Financial Health Score */}
              <FinancialHealthScore
                totalAssets={currentNetWorth?.totalAssets || netWorthData.totalAssets}
                totalLiabilities={currentNetWorth?.totalLiabilities || netWorthData.totalLiabilities}
                monthlyIncome={netWorthData.monthlyIncome}
                monthlyExpenses={netWorthData.monthlyExpenses}
                savingsRate={netWorthData.savingsRate}
                isLoading={combinedLoading}
                onViewDetails={() => {}}
              />

              {/* Activity Feed */}
              <UnifiedActivityFeed
                activities={activities}
                isLoading={combinedLoading}
                onItemPress={handleActivityPress}
              />
            </>
          )}

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
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    flex: 1,
  },
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  heroLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    marginBottom: SPACING.xs,
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  changeText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  summaryIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    marginBottom: SPACING.xs,
  },
  summaryAmount: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  quickActionsSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  actionButton: {
    width: '47%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  actionText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 130,
  },
});