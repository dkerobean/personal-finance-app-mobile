import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowUpRight,
  ArrowDownRight,
  Clock3,
  Landmark,
  Layers3,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useUser } from '@clerk/clerk-expo';
import GradientHeader from '@/components/budgets/GradientHeader';
import NetWorthTrendChart from '@/components/networth/dashboard/NetWorthTrendChart';
import NetWorthLoadingState from '@/components/networth/dashboard/NetWorthLoadingState';
import NetWorthErrorState, { NetworkError } from '@/components/networth/dashboard/NetWorthErrorState';
import type { NetWorthError } from '@/components/networth/dashboard/NetWorthErrorState';
import UnifiedActivityFeed, { ActivityItem } from '@/components/networth/dashboard/UnifiedActivityFeed';
import { NetWorthData, NetWorthService } from '@/services/netWorthService';
import { transactionsApi } from '@/services/api/transactions';
import { useNetWorthStore } from '@/stores/netWorthStore';
import { BORDER_RADIUS, BUDGET, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/design';
import { getAssetCategoryLabel, getLiabilityCategoryLabel } from '@/lib/netWorthCatalog';
import type { Transaction } from '@/types/models';

const EMPTY_NET_WORTH_DATA: NetWorthData = {
  netWorth: 0,
  totalAssets: 0,
  totalLiabilities: 0,
  monthlyChange: 0,
  monthlyChangePercentage: 0,
  manualAssetsValue: 0,
  manualLiabilitiesValue: 0,
  connectedAccountsValue: 0,
  connectedAccountDebt: 0,
  liquidAssetsValue: 0,
  appreciatingAssetsValue: 0,
  monthlyDebtPayments: 0,
  totalAssetGain: 0,
  debtToAssetRatio: 0,
  assetCoverageRatio: null,
  assetsBreakdown: [],
  liabilitiesBreakdown: [],
  topAssets: [],
  topLiabilities: [],
  monthlyIncome: 0,
  monthlyExpenses: 0,
  savingsRate: 0,
};

type MetricTone = 'green' | 'blue' | 'amber' | 'red';

const toneMap: Record<MetricTone, { value: string; bg: string }> = {
  green: { value: COLORS.success, bg: '#ECFDF5' },
  blue: { value: COLORS.accent, bg: '#EFF6FF' },
  amber: { value: COLORS.warning, bg: '#FFFBEB' },
  red: { value: COLORS.error, bg: '#FEF2F2' },
};

function formatCurrency(amount: number): string {
  return `₵${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function clampPercentage(value: number): `${number}%` {
  return `${Math.max(0, Math.min(100, value)).toFixed(1)}%` as `${number}%`;
}

function MetricCard({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  tone: MetricTone;
  icon: React.ReactNode;
}): React.ReactElement {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIconWrap, { backgroundColor: toneMap[tone].bg }]}>
        {icon}
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: toneMap[tone].value }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.metricHint}>{hint}</Text>
    </View>
  );
}

function BreakdownRow({
  label,
  amount,
  percentage,
  color,
  count,
  isConnected,
}: {
  label: string;
  amount: number;
  percentage: number;
  color: string;
  count: number;
  isConnected?: boolean;
}): React.ReactElement {
  return (
    <View style={styles.breakdownRow}>
      <View style={styles.breakdownRowHeader}>
        <View style={styles.breakdownLabelWrap}>
          <View style={[styles.breakdownDot, { backgroundColor: color }]} />
          <View style={styles.breakdownCopy}>
            <Text style={styles.breakdownLabel}>{label}</Text>
            <Text style={styles.breakdownMeta}>
              {count} item{count === 1 ? '' : 's'}
              {isConnected ? ' • connected' : ''}
            </Text>
          </View>
        </View>
        <View style={styles.breakdownAmountWrap}>
          <Text style={styles.breakdownAmount}>{formatCurrency(amount)}</Text>
          <Text style={styles.breakdownPercent}>{formatPercent(percentage)}</Text>
        </View>
      </View>
      <View style={styles.breakdownBarTrack}>
        <View style={[styles.breakdownBarFill, { width: clampPercentage(percentage), backgroundColor: color }]} />
      </View>
    </View>
  );
}

function PositionRow({
  name,
  label,
  amount,
  change,
  changeTone,
  subtitle,
  onPress,
}: {
  name: string;
  label: string;
  amount: number;
  change: string;
  changeTone: string;
  subtitle: string;
  onPress: () => void;
}): React.ReactElement {
  return (
    <TouchableOpacity style={styles.positionRow} onPress={onPress} activeOpacity={0.84}>
      <View style={styles.positionCopy}>
        <Text style={styles.positionName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.positionLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.positionSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <View style={styles.positionValueWrap}>
        <Text style={styles.positionAmount}>{formatCurrency(amount)}</Text>
        <Text style={[styles.positionChange, { color: changeTone }]}>{change}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function NetWorthScreen(): React.ReactElement {
  const { user } = useUser();
  const [summary, setSummary] = useState<NetWorthData>(EMPTY_NET_WORTH_DATA);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [dashboardError, setDashboardError] = useState<NetWorthError | null>(null);

  const {
    assets,
    liabilities,
    isLoadingAssets,
    isLoadingLiabilities,
    error,
    historicalData,
    isLoadingHistory,
    loadAssets,
    loadLiabilities,
    loadHistoricalData,
    clearError,
  } = useNetWorthStore();

  const loadScreenData = useCallback(async () => {
    const userId = user?.id;

    if (!userId) {
      setSummary(EMPTY_NET_WORTH_DATA);
      return;
    }

    setIsLoadingSummary(true);
    setDashboardError(null);

    try {
      const netWorthData = await NetWorthService.getNetWorth(userId);
      const transactionsResponse = await transactionsApi.list(userId);

      await Promise.all([
        loadAssets(userId),
        loadLiabilities(userId),
        loadHistoricalData(userId),
      ]);

      setSummary(netWorthData);
      setRecentTransactions(
        (transactionsResponse.data || [])
          .filter((transaction) => Boolean(transaction.account_id || transaction.is_synced))
          .sort((left, right) => new Date(right.transaction_date).getTime() - new Date(left.transaction_date).getTime())
          .slice(0, 8)
      );
    } catch (loadError) {
      setDashboardError(NetworkError('Failed to load net worth overview'));
    } finally {
      setIsLoadingSummary(false);
    }
  }, [loadAssets, loadHistoricalData, loadLiabilities, user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadScreenData();
    }, [loadScreenData])
  );

  const handleRefresh = useCallback(async () => {
    if (error) {
      clearError();
    }
    await loadScreenData();
  }, [clearError, error, loadScreenData]);

  const handleRetry = useCallback(async () => {
    setDashboardError(null);
    await handleRefresh();
  }, [handleRefresh]);

  const handleAddAsset = (): void => router.push('/networth/assets/add');
  const handleAddLiability = (): void => router.push('/networth/liabilities/add');
  const handleViewAssets = (): void => router.push('/networth/assets');
  const handleViewLiabilities = (): void => router.push('/networth/liabilities');
  const handleViewHistory = (): void => router.push('/networth/history');

  const combinedLoading = isLoadingSummary || isLoadingAssets || isLoadingLiabilities || isLoadingHistory;
  const isInitialLoading =
    combinedLoading &&
    !assets.length &&
    !liabilities.length &&
    !summary.assetsBreakdown.length &&
    !summary.liabilitiesBreakdown.length;
  const currentError = dashboardError || (error ? NetworkError(error) : null);

  const netWorthTone = summary.monthlyChange >= 0 ? COLORS.white : '#FECACA';
  const monthlyChangeText = `${summary.monthlyChange >= 0 ? '+' : '-'}${formatCurrency(Math.abs(summary.monthlyChange))}`;

  const quickActions = [
    {
      key: 'asset',
      label: 'Add Asset',
      icon: <Plus size={18} color={COLORS.primary} />,
      onPress: handleAddAsset,
      bg: COLORS.primaryLight,
    },
    {
      key: 'liability',
      label: 'Add Liability',
      icon: <Minus size={18} color={COLORS.error} />,
      onPress: handleAddLiability,
      bg: '#FEE2E2',
    },
    {
      key: 'history',
      label: 'History',
      icon: <Clock3 size={18} color={COLORS.accent} />,
      onPress: handleViewHistory,
      bg: '#DBEAFE',
    },
    {
      key: 'refresh',
      label: 'Recalculate',
      icon: <RefreshCw size={18} color={COLORS.warning} />,
      onPress: handleRefresh,
      bg: '#FEF3C7',
    },
  ];

  const activities = useMemo<ActivityItem[]>(
    () =>
      recentTransactions.map((transaction) => ({
        id: transaction.id,
        type: transaction.type === 'income' ? 'transaction_income' : 'transaction_expense',
        title: transaction.description?.trim() || transaction.category?.name || 'Transaction',
        description: transaction.category?.name || 'Uncategorized transaction',
        amount: transaction.amount,
        timestamp: transaction.transaction_date,
        category: transaction.category?.name,
        detailsRoute: `/transactions/${transaction.id}`,
      })),
    [recentTransactions]
  );

  const sourceMix = useMemo(
    () => [
      {
        label: 'Manual Assets',
        value: summary.manualAssetsValue,
        hint: 'Property, investments, business assets, valuables',
      },
      {
        label: 'Connected Accounts',
        value: summary.connectedAccountsValue,
        hint: 'Positive bank and wallet balances',
      },
      {
        label: 'Manual Liabilities',
        value: summary.manualLiabilitiesValue,
        hint: 'Loans, cards, mortgages, trade debt',
      },
      {
        label: 'Connected Account Debt',
        value: summary.connectedAccountDebt,
        hint: 'Overdrawn connected accounts',
      },
    ],
    [summary.connectedAccountDebt, summary.connectedAccountsValue, summary.manualAssetsValue, summary.manualLiabilitiesValue]
  );

  const handleActivityPress = useCallback((item: ActivityItem) => {
    if (item.detailsRoute) {
      router.push(item.detailsRoute as any);
    }
  }, []);

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
          subtitle="Portfolio, liabilities, and balance-sheet health"
          onBackPress={() => router.back()}
          onNotificationPress={() => router.push('/notifications')}
          showCalendar={false}
        />

        <View style={styles.contentCard}>
          {isInitialLoading ? (
            <NetWorthLoadingState showTrendChart />
          ) : currentError ? (
            <NetWorthErrorState error={currentError} onRetry={handleRetry} showContactSupport />
          ) : (
            <>
              <Animated.View entering={FadeInUp.duration(450)} style={styles.heroWrap}>
                <LinearGradient
                  colors={['#032F27', COLORS.primary, COLORS.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroCard}
                >
                  <View style={styles.heroGlowA} />
                  <View style={styles.heroGlowB} />

                  <View style={styles.heroHeaderRow}>
                    <View>
                      <Text style={styles.heroEyebrow}>Current Net Worth</Text>
                      <Text style={styles.heroSubcopy}>Current-value assets minus live liabilities</Text>
                    </View>
                    <TouchableOpacity style={styles.historyChip} onPress={handleViewHistory} activeOpacity={0.86}>
                      <Clock3 size={14} color={COLORS.white} />
                      <Text style={styles.historyChipText}>History</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.heroAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.68}>
                    {formatCurrency(summary.netWorth)}
                  </Text>

                  <View style={styles.changePill}>
                    {summary.monthlyChange >= 0 ? (
                      <ArrowUpRight size={16} color={netWorthTone} />
                    ) : (
                      <ArrowDownRight size={16} color={netWorthTone} />
                    )}
                    <Text style={[styles.changePillText, { color: netWorthTone }]}>
                      {monthlyChangeText} this month
                    </Text>
                    <Text style={[styles.changePillPercent, { color: netWorthTone }]}>
                      {formatPercent(Math.abs(summary.monthlyChangePercentage))}
                    </Text>
                  </View>

                  <View style={styles.heroStatsRow}>
                    <TouchableOpacity style={styles.heroStatCard} onPress={handleViewAssets} activeOpacity={0.85}>
                      <Text style={styles.heroStatLabel}>Assets</Text>
                      <Text style={styles.heroStatAmount}>{formatCurrency(summary.totalAssets)}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.heroStatCard} onPress={handleViewLiabilities} activeOpacity={0.85}>
                      <Text style={styles.heroStatLabel}>Liabilities</Text>
                      <Text style={styles.heroStatAmount}>{formatCurrency(summary.totalLiabilities)}</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(40).duration(420)} style={styles.quickActionsSection}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.quickActionsGrid}>
                  {quickActions.map((action) => (
                    <TouchableOpacity
                      key={action.key}
                      style={styles.actionButton}
                      onPress={action.onPress}
                      activeOpacity={0.86}
                    >
                      <View style={[styles.actionIconWrap, { backgroundColor: action.bg }]}>{action.icon}</View>
                      <Text style={styles.actionText}>{action.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(80).duration(420)} style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Professional Summary</Text>
                  <View style={styles.badgePill}>
                    <ShieldCheck size={14} color={COLORS.primary} />
                    <Text style={styles.badgePillText}>Current value basis</Text>
                  </View>
                </View>

                <View style={styles.metricGrid}>
                  <MetricCard
                    label="Liquid Assets"
                    value={formatCurrency(summary.liquidAssetsValue)}
                    hint="Cash, reserves, money-market style holdings"
                    tone="green"
                    icon={<Wallet size={18} color={COLORS.success} />}
                  />
                  <MetricCard
                    label="Appreciating Assets"
                    value={formatCurrency(summary.appreciatingAssetsValue)}
                    hint="Property, quoted investments, equity-like holdings"
                    tone="blue"
                    icon={<TrendingUp size={18} color={COLORS.accent} />}
                  />
                  <MetricCard
                    label="Monthly Debt Load"
                    value={formatCurrency(summary.monthlyDebtPayments)}
                    hint="Scheduled monthly payments across liabilities"
                    tone="amber"
                    icon={<Landmark size={18} color={COLORS.warning} />}
                  />
                  <MetricCard
                    label="Unrealized Asset Gain"
                    value={formatCurrency(summary.totalAssetGain)}
                    hint="Current value less original value where cost basis exists"
                    tone={summary.totalAssetGain >= 0 ? 'green' : 'red'}
                    icon={<Layers3 size={18} color={summary.totalAssetGain >= 0 ? COLORS.success : COLORS.error} />}
                  />
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(120).duration(420)} style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Balance Sheet Health</Text>
                  <TouchableOpacity onPress={handleViewLiabilities} activeOpacity={0.84}>
                    <Text style={styles.linkText}>Manage debt</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.healthRow}>
                  <View style={styles.healthCard}>
                    <Text style={styles.healthLabel}>Debt-to-Asset Ratio</Text>
                    <Text style={[styles.healthValue, { color: summary.debtToAssetRatio > 60 ? COLORS.error : COLORS.primary }]}>
                      {formatPercent(summary.debtToAssetRatio)}
                    </Text>
                    <Text style={styles.healthHint}>Lower is healthier. Shows leverage against total assets.</Text>
                  </View>
                  <View style={styles.healthCard}>
                    <Text style={styles.healthLabel}>Asset Coverage</Text>
                    <Text style={styles.healthValue}>
                      {summary.assetCoverageRatio === null ? 'Debt free' : `${summary.assetCoverageRatio.toFixed(2)}x`}
                    </Text>
                    <Text style={styles.healthHint}>How many times your assets cover total liabilities.</Text>
                  </View>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(160).duration(420)} style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Data Sources</Text>
                  <TouchableOpacity onPress={handleViewAssets} activeOpacity={0.84}>
                    <Text style={styles.linkText}>Review entries</Text>
                  </TouchableOpacity>
                </View>

                {sourceMix.map((item) => (
                  <View key={item.label} style={styles.sourceRow}>
                    <View style={styles.sourceCopy}>
                      <Text style={styles.sourceLabel}>{item.label}</Text>
                      <Text style={styles.sourceHint}>{item.hint}</Text>
                    </View>
                    <Text style={styles.sourceValue}>{formatCurrency(item.value)}</Text>
                  </View>
                ))}
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(200).duration(420)} style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Asset Allocation</Text>
                  <TouchableOpacity onPress={handleViewAssets} activeOpacity={0.84}>
                    <Text style={styles.linkText}>All assets</Text>
                  </TouchableOpacity>
                </View>

                {summary.assetsBreakdown.length > 0 ? (
                  summary.assetsBreakdown.slice(0, 5).map((item) => (
                    <BreakdownRow
                      key={item.key}
                      label={item.label}
                      amount={item.amount}
                      percentage={item.percentage}
                      color={item.color}
                      count={item.count}
                      isConnected={item.isConnected}
                    />
                  ))
                ) : (
                  <Text style={styles.emptyInlineText}>Add assets or connect accounts to see your allocation mix.</Text>
                )}
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(240).duration(420)} style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Liability Allocation</Text>
                  <TouchableOpacity onPress={handleViewLiabilities} activeOpacity={0.84}>
                    <Text style={styles.linkText}>All liabilities</Text>
                  </TouchableOpacity>
                </View>

                {summary.liabilitiesBreakdown.length > 0 ? (
                  summary.liabilitiesBreakdown.slice(0, 5).map((item) => (
                    <BreakdownRow
                      key={item.key}
                      label={item.label}
                      amount={item.amount}
                      percentage={item.percentage}
                      color={item.color}
                      count={item.count}
                      isConnected={item.isConnected}
                    />
                  ))
                ) : (
                  <Text style={styles.emptyInlineText}>No liabilities recorded. Add debt to complete the picture.</Text>
                )}
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(280).duration(420)} style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Top Assets</Text>
                  <TouchableOpacity onPress={handleAddAsset} activeOpacity={0.84}>
                    <Text style={styles.linkText}>Add asset</Text>
                  </TouchableOpacity>
                </View>

                {summary.topAssets.length > 0 ? (
                  summary.topAssets.slice(0, 4).map((item) => (
                    <PositionRow
                      key={item.id}
                      name={item.name}
                      label={`${item.label} • ${item.trackingMethod}`}
                      amount={item.amount}
                      change={
                        item.changePercentage !== null
                          ? `${item.changeAmount >= 0 ? '+' : '-'}${formatCurrency(Math.abs(item.changeAmount))} • ${formatPercent(Math.abs(item.changePercentage))}`
                          : 'No cost basis yet'
                      }
                      changeTone={item.changeAmount >= 0 ? COLORS.success : COLORS.error}
                      subtitle={item.lastUpdated ? `Updated ${new Date(item.lastUpdated).toLocaleDateString()}` : 'No valuation date'}
                      onPress={() => router.push(`/networth/assets/edit/${item.id}`)}
                    />
                  ))
                ) : (
                  <Text style={styles.emptyInlineText}>Your largest holdings will appear here for quick updates.</Text>
                )}
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(320).duration(420)} style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Top Liabilities</Text>
                  <TouchableOpacity onPress={handleAddLiability} activeOpacity={0.84}>
                    <Text style={styles.linkText}>Add liability</Text>
                  </TouchableOpacity>
                </View>

                {summary.topLiabilities.length > 0 ? (
                  summary.topLiabilities.slice(0, 4).map((item) => (
                    <PositionRow
                      key={item.id}
                      name={item.name}
                      label={item.label}
                      amount={item.amount}
                      change={
                        item.changeAmount >= 0
                          ? `Paid down ${formatCurrency(item.changeAmount)}`
                          : `Up ${formatCurrency(Math.abs(item.changeAmount))}`
                      }
                      changeTone={item.changeAmount >= 0 ? COLORS.success : COLORS.error}
                      subtitle={[
                        item.interestRate !== null ? `${item.interestRate.toFixed(2)}% APR` : null,
                        item.monthlyPayment !== null ? `${formatCurrency(item.monthlyPayment)}/mo` : null,
                      ]
                        .filter(Boolean)
                        .join(' • ') || 'No payment schedule yet'}
                      onPress={() => router.push(`/networth/liabilities/edit/${item.id}`)}
                    />
                  ))
                ) : (
                  <Text style={styles.emptyInlineText}>Your largest debt positions will appear here.</Text>
                )}
              </Animated.View>

              <NetWorthTrendChart
                historicalData={historicalData}
                isLoading={isLoadingHistory}
                onViewHistory={handleViewHistory}
              />

              <UnifiedActivityFeed
                activities={activities}
                isLoading={combinedLoading}
                onViewAll={() => router.push('/transactions')}
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
    width: 150,
    height: 150,
    borderRadius: 75,
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
    bottom: -35,
    left: -20,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  heroEyebrow: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.semibold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroSubcopy: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: 4,
  },
  historyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 7,
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
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    marginBottom: SPACING.lg,
  },
  changePillText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  changePillPercent: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  heroStatCard: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    padding: SPACING.md,
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.84)',
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
    marginBottom: SPACING.lg,
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
  sectionCard: {
    borderRadius: 24,
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgePillText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  linkText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  metricCard: {
    width: '48%',
    backgroundColor: COLORS.gray50,
    borderRadius: 20,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  metricLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: 4,
  },
  metricHint: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    lineHeight: 16,
  },
  healthRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  healthCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    padding: SPACING.md,
  },
  healthLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  healthValue: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: 6,
  },
  healthHint: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    lineHeight: 16,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    gap: SPACING.md,
  },
  sourceCopy: {
    flex: 1,
  },
  sourceLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: 2,
  },
  sourceHint: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    lineHeight: 18,
  },
  sourceValue: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  breakdownRow: {
    marginBottom: SPACING.md,
  },
  breakdownRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginBottom: 8,
  },
  breakdownLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  breakdownCopy: {
    flex: 1,
  },
  breakdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.sm,
  },
  breakdownLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  breakdownMeta: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  breakdownAmountWrap: {
    alignItems: 'flex-end',
  },
  breakdownAmount: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  breakdownPercent: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  breakdownBarTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: COLORS.gray100,
    overflow: 'hidden',
  },
  breakdownBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  positionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    gap: SPACING.md,
  },
  positionCopy: {
    flex: 1,
  },
  positionName: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: 2,
  },
  positionLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  positionSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
  },
  positionValueWrap: {
    alignItems: 'flex-end',
    maxWidth: '42%',
  },
  positionAmount: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: 2,
  },
  positionChange: {
    fontSize: TYPOGRAPHY.sizes.sm,
    textAlign: 'right',
  },
  emptyInlineText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 130,
  },
});
