import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TrendingDown, Plus, Minus, Clock3, RefreshCw } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useUser } from '@clerk/clerk-expo';
import NetWorthTrendChart from '@/components/networth/dashboard/NetWorthTrendChart';
import NetWorthLoadingState from '@/components/networth/dashboard/NetWorthLoadingState';
import NetWorthErrorState, { NetworkError, CalculationError } from '@/components/networth/dashboard/NetWorthErrorState';
import FinancialHealthScore from '@/components/networth/dashboard/FinancialHealthScore';
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
  const [dashboardError, setDashboardError] = useState<any>(null);

  const {
    assets,
    liabilities,
    isLoadingAssets,
    isLoadingLiabilities,
    error,
    loadAssets,
    loadLiabilities,
    clearError,
  } = useNetWorthStore();

  const {
    currentNetWorth,
    isCalculating,
    calculationError,
    historicalData,
    isLoadingHistory,
    refreshNetWorth,
    loadHistoricalData,
    resetCalculationError,
  } = useNetWorthDashboard();

  const { user } = useUser();

  const loadNetWorthData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      if (user) {
        const data = await NetWorthService.getNetWorth(user.id);
        setNetWorthData(data);
      }
    } catch (loadError) {
      setDashboardError(NetworkError('Failed to load net worth data'));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const initializeData = async () => {
      try {
        await Promise.all([
          loadAssets(user.id),
          loadLiabilities(user.id),
          loadHistoricalData(user.id),
        ]);
        await refreshNetWorth();
        await loadNetWorthData();
      } catch (initError) {
        setDashboardError(NetworkError('Failed to load dashboard data'));
      }
    };

    initializeData();
  }, [user, loadAssets, loadLiabilities, loadHistoricalData, refreshNetWorth, loadNetWorthData]);

  useEffect(() => {
    if (assets.length > 0 || liabilities.length > 0) {
      refreshNetWorth();
      loadNetWorthData();
    }
  }, [assets, liabilities, refreshNetWorth, loadNetWorthData]);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      const refreshStoreData = async () => {
        try {
          await Promise.all([loadAssets(user.id), loadLiabilities(user.id)]);
        } catch (_refreshError) {
          return;
        }
      };

      refreshStoreData();
    }, [loadAssets, loadLiabilities, user])
  );

  const handleRefresh = async (): Promise<void> => {
    if (!user) return;

    if (error) clearError();
    if (calculationError) resetCalculationError();
    if (dashboardError) setDashboardError(null);

    try {
      await Promise.all([
        loadAssets(user.id),
        loadLiabilities(user.id),
        loadHistoricalData(user.id),
      ]);
      await refreshNetWorth();
      await loadNetWorthData();
    } catch (refreshError) {
      setDashboardError(NetworkError('Failed to refresh data'));
    }
  };

  const handleRetryError = async (): Promise<void> => {
    setDashboardError(null);
    await handleRefresh();
  };

  const handleGoBack = (): void => router.back();
  const handleAddAsset = (): void => router.push('/networth/assets/add');
  const handleAddLiability = (): void => router.push('/networth/liabilities/add');
  const handleViewAssets = (): void => router.push('/networth/assets');
  const handleViewLiabilities = (): void => router.push('/networth/liabilities');
  const handleViewHistory = (): void => router.push('/networth/history');
  const handleCalculateNetWorth = (): void => handleRefresh();
  const handleActivityPress = (_activity: ActivityItem): void => {};

  const combinedLoading = isLoading || isLoadingAssets || isLoadingLiabilities || isCalculating;
  const isInitialLoading = combinedLoading && !assets.length && !liabilities.length;
  const currentError =
    dashboardError ||
    (calculationError && CalculationError(calculationError)) ||
    (error && NetworkError(error));

  const currentValue = currentNetWorth?.netWorth ?? netWorthData.netWorth;
  const currentAssets = currentNetWorth?.totalAssets ?? netWorthData.totalAssets;
  const currentLiabilities = currentNetWorth?.totalLiabilities ?? netWorthData.totalLiabilities;
  const monthlyChange = currentNetWorth?.monthlyChange ?? netWorthData.monthlyChange;

  const activities = useMemo<ActivityItem[]>(() => {
    const assetEvents: ActivityItem[] = assets.slice(0, 3).map((asset) => ({
      id: `asset-${asset.id}`,
      type: 'asset_added',
      title: `Asset Added: ${asset.name}`,
      description: `${asset.category.replace(/_/g, ' ')} asset`,
      amount: asset.current_value,
      timestamp: asset.created_at,
      category: asset.category,
    }));

    const liabilityEvents: ActivityItem[] = liabilities.slice(0, 3).map((liability) => ({
      id: `liability-${liability.id}`,
      type: 'liability_added',
      title: `Liability Added: ${liability.name}`,
      description: `${liability.category.replace(/_/g, ' ')} liability`,
      amount: liability.current_balance,
      timestamp: liability.created_at,
      category: liability.category,
    }));

    const latestSnapshot = historicalData[historicalData.length - 1];
    const calculationEvents: ActivityItem[] = latestSnapshot
      ? [
          {
            id: `snapshot-${latestSnapshot.timestamp}`,
            type: 'net_worth_calculated',
            title: 'Net Worth Snapshot Saved',
            description: `Snapshot for ${latestSnapshot.month}`,
            amount: latestSnapshot.netWorth,
            timestamp: latestSnapshot.timestamp,
          },
        ]
      : [];

    return [...assetEvents, ...liabilityEvents, ...calculationEvents]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);
  }, [assets, liabilities, historicalData]);

  const formatCurrency = (amount: number): string =>
    `₵${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const quickActions = [
    {
      key: 'asset',
      label: 'Add Asset',
      Icon: Plus,
      onPress: handleAddAsset,
      tint: COLORS.primary,
      bg: COLORS.primaryLight,
    },
    {
      key: 'liability',
      label: 'Add Liability',
      Icon: Minus,
      onPress: handleAddLiability,
      tint: COLORS.error,
      bg: '#FEE2E2',
    },
    {
      key: 'history',
      label: 'History',
      Icon: Clock3,
      onPress: handleViewHistory,
      tint: COLORS.accent,
      bg: '#DBEAFE',
    },
    {
      key: 'refresh',
      label: 'Recalculate',
      Icon: RefreshCw,
      onPress: handleCalculateNetWorth,
      tint: COLORS.warning,
      bg: '#FEF3C7',
    },
  ];

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
        <GradientHeader
          title="Net Worth"
          subtitle="Assets, liabilities, and trajectory"
          onBackPress={handleGoBack}
          onNotificationPress={() => router.push('/notifications')}
          showCalendar={false}
        />

        <View style={styles.contentCard}>
          {isInitialLoading ? (
            <NetWorthLoadingState showTrendChart />
          ) : currentError ? (
            <NetWorthErrorState error={currentError} onRetry={handleRetryError} showContactSupport />
          ) : (
            <>
              <Animated.View entering={FadeInUp.duration(550)} style={styles.heroWrap}>
                <LinearGradient
                  colors={['#033327', COLORS.primary, COLORS.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroCard}
                >
                  <View style={styles.heroGlowA} />
                  <View style={styles.heroGlowB} />

                  <View style={styles.heroHeaderRow}>
                    <Text style={styles.heroEyebrow}>Current Net Position</Text>
                    <TouchableOpacity style={styles.historyChip} onPress={handleViewHistory} activeOpacity={0.85}>
                      <Clock3 size={14} color={COLORS.white} />
                      <Text style={styles.historyChipText}>History</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.heroAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
                    {formatCurrency(currentValue)}
                  </Text>

                  <View style={styles.changePill}>
                    {monthlyChange >= 0 ? (
                      <TrendingUp size={16} color={COLORS.white} />
                    ) : (
                      <TrendingDown size={16} color={COLORS.white} />
                    )}
                    <Text style={styles.changePillText}>
                      {monthlyChange >= 0 ? '+' : '-'}
                      {formatCurrency(Math.abs(monthlyChange))} this month
                    </Text>
                  </View>

                  <View style={styles.heroStatsRow}>
                    <TouchableOpacity style={styles.heroStatCard} onPress={handleViewAssets} activeOpacity={0.85}>
                      <Text style={styles.heroStatLabel}>Assets</Text>
                      <Text style={styles.heroStatAmount}>{formatCurrency(currentAssets)}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.heroStatCard} onPress={handleViewLiabilities} activeOpacity={0.85}>
                      <Text style={styles.heroStatLabel}>Liabilities</Text>
                      <Text style={styles.heroStatAmount}>{formatCurrency(currentLiabilities)}</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.quickActionsSection}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.quickActionsGrid}>
                  {quickActions.map((action) => (
                    <TouchableOpacity
                      key={action.key}
                      style={styles.actionButton}
                      onPress={action.onPress}
                      activeOpacity={0.86}
                    >
                      <View style={[styles.actionIconWrap, { backgroundColor: action.bg }]}>
                        <action.Icon size={20} color={action.tint} />
                      </View>
                      <Text style={styles.actionText}>{action.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>

              <NetWorthTrendChart
                historicalData={historicalData}
                isLoading={isLoadingHistory}
                onViewHistory={handleViewHistory}
              />

              <FinancialHealthScore
                totalAssets={currentAssets}
                totalLiabilities={currentLiabilities}
                monthlyIncome={netWorthData.monthlyIncome}
                monthlyExpenses={netWorthData.monthlyExpenses}
                savingsRate={netWorthData.savingsRate}
                isLoading={combinedLoading}
                onViewDetails={() => {}}
              />

              <UnifiedActivityFeed activities={activities} isLoading={combinedLoading} onItemPress={handleActivityPress} />
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
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    flex: 1,
  },
  heroWrap: {
    marginBottom: SPACING.lg,
  },
  heroCard: {
    borderRadius: 28,
    padding: SPACING.lg,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  heroGlowA: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -40,
    right: -20,
  },
  heroGlowB: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -40,
    left: -25,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  heroEyebrow: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.semibold,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  historyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  historyChipText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  heroAmount: {
    fontSize: 40,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: -0.8,
    marginBottom: SPACING.md,
  },
  changePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    marginBottom: SPACING.lg,
  },
  changePillText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  heroStatCard: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    padding: SPACING.md,
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: TYPOGRAPHY.sizes.xs,
    marginBottom: 4,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  heroStatAmount: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  quickActionsSection: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: SPACING.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  actionButton: {
    width: '48%',
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  bottomSpacing: {
    height: 130,
  },
});
