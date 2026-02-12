import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS, BUDGET } from '@/constants/design';
import GradientHeader from '@/components/budgets/GradientHeader';
import NetWorthHistoryChart from '@/components/networth/history/NetWorthHistoryChart';
import TimePeriodSelector from '@/components/networth/history/TimePeriodSelector';
import TrendInsights from '@/components/networth/history/TrendInsights';
import HistoryBreakdownTable from '@/components/networth/history/HistoryBreakdownTable';
import ExportOptions from '@/components/networth/history/ExportOptions';
import { useNetWorthStore } from '@/stores/netWorthStore';
import { useUser } from '@clerk/clerk-expo';
import { formatCurrency } from '@/lib/formatters';

export interface TimePeriodConfig {
  label: string;
  months: number;
  defaultChart: 'line' | 'bar';
  dataPoints: 'all' | 'monthly' | 'quarterly';
}

export interface HistoricalDataPoint {
  date: string;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  connectedValue: number;
  manualAssets: number;
  manualLiabilities: number;
  monthOverMonth: number;
}

export const TIME_PERIODS: TimePeriodConfig[] = [
  { label: '3M', months: 3, defaultChart: 'line', dataPoints: 'all' },
  { label: '6M', months: 6, defaultChart: 'line', dataPoints: 'all' },
  { label: '1Y', months: 12, defaultChart: 'line', dataPoints: 'monthly' },
  { label: '2Y', months: 24, defaultChart: 'line', dataPoints: 'quarterly' },
  { label: 'All', months: -1, defaultChart: 'line', dataPoints: 'quarterly' },
];

export default function NetWorthHistoryScreen(): React.ReactElement {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriodConfig>(TIME_PERIODS[2]);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getHistoricalData = useNetWorthStore((state) => state.getHistoricalData);
  const loadHistoricalData = useNetWorthStore((state) => state.loadHistoricalData);
  const { user } = useUser();

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);

    try {
      await loadHistoricalData(
        user.id,
        selectedPeriod.months > 0 ? selectedPeriod.months : undefined
      );
      const data = await getHistoricalData(selectedPeriod.months);
      setHistoricalData(data);
    } catch (_err) {
      setHistoricalData([]);
      setError('Failed to load historical data from your account.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, loadHistoricalData, getHistoricalData, selectedPeriod.months]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summary = useMemo(() => {
    if (historicalData.length < 1) {
      return {
        current: 0,
        start: 0,
        absoluteChange: 0,
        percentageChange: 0,
      };
    }

    const sorted = [...historicalData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const start = sorted[0].netWorth;
    const current = sorted[sorted.length - 1].netWorth;
    const absoluteChange = current - start;
    const percentageChange = start !== 0 ? (absoluteChange / Math.abs(start)) * 100 : 0;

    return { current, start, absoluteChange, percentageChange };
  }, [historicalData]);

  const handlePeriodChange = (period: TimePeriodConfig) => {
    setSelectedPeriod(period);
  };

  const handleRefresh = async () => {
    await loadData();
  };

  const handleExport = async (_format: 'csv' | 'image' | 'share') => {};

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/networth');
    }
  };

  const changePositive = summary.absoluteChange >= 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={COLORS.white}
            colors={[COLORS.white]}
          />
        }
      >
        <GradientHeader
          title="Net Worth History"
          subtitle="Your financial trend over time"
          onBackPress={handleGoBack}
          showCalendar={false}
          showNotification={false}
        />

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['#033327', COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryCard}
          >
            <Text style={styles.summaryLabel}>Latest Net Worth</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.current)}</Text>
            <Text style={styles.summaryMeta}>
              {changePositive ? '+' : '-'}
              {formatCurrency(Math.abs(summary.absoluteChange))} ({changePositive ? '+' : ''}
              {summary.percentageChange.toFixed(1)}%) in {selectedPeriod.label}
            </Text>
          </LinearGradient>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.sectionContainer}>
            <TimePeriodSelector
              periods={TIME_PERIODS}
              selectedPeriod={selectedPeriod}
              onPeriodChange={handlePeriodChange}
              availableData={historicalData}
            />
          </View>

          <View style={styles.sectionContainer}>
            <NetWorthHistoryChart
              data={historicalData}
              timePeriod={selectedPeriod}
              height={300}
              interactive
              showBreakdown
              isLoading={isLoading}
            />
          </View>

          <View style={styles.sectionContainer}>
            <TrendInsights data={historicalData} timePeriod={selectedPeriod} isLoading={isLoading} />
          </View>

          <View style={styles.sectionContainer}>
            <ExportOptions
              onExport={handleExport}
              data={historicalData}
              timePeriod={selectedPeriod}
              disabled={isLoading || historicalData.length === 0}
            />
          </View>

          <View style={styles.sectionContainer}>
            <HistoryBreakdownTable
              data={historicalData}
              timePeriod={selectedPeriod}
              isLoading={isLoading}
              showCategoryBreakdown
            />
          </View>

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
  scrollView: {
    flex: 1,
  },
  contentCard: {
    backgroundColor: COLORS.backgroundContent,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -20,
    paddingTop: SPACING.lg,
    flex: 1,
  },
  summaryCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: 24,
    padding: SPACING.lg,
    ...SHADOWS.lg,
  },
  summaryLabel: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryValue: {
    marginTop: SPACING.xs,
    color: COLORS.white,
    fontSize: 34,
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: -0.7,
  },
  summaryMeta: {
    marginTop: SPACING.sm,
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  errorText: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    color: COLORS.error,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  sectionContainer: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  bottomSpacing: {
    height: 130,
  },
});
