import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS, BUDGET } from '@/constants/design';
import GradientHeader from '@/components/budgets/GradientHeader';

import NetWorthHistoryChart from '@/components/networth/history/NetWorthHistoryChart';
import TimePeriodSelector from '@/components/networth/history/TimePeriodSelector';
import TrendInsights from '@/components/networth/history/TrendInsights';
import HistoryBreakdownTable from '@/components/networth/history/HistoryBreakdownTable';
import ExportOptions from '@/components/networth/history/ExportOptions';
import { useNetWorthStore } from '@/stores/netWorthStore';

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

  const getHistoricalData = useNetWorthStore(state => state.getHistoricalData);
  const loadHistoricalData = useNetWorthStore(state => state.loadHistoricalData);

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await loadHistoricalData();
      const data = await getHistoricalData(selectedPeriod.months);
      
      if (data.length === 0) {
        const mockData = generateMockHistoricalData(selectedPeriod.months);
        setHistoricalData(mockData);
      } else {
        setHistoricalData(data);
      }
    } catch (err) {
      setError('Failed to load historical data');
      console.error('Error loading historical data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockHistoricalData = (months: number): HistoricalDataPoint[] => {
    const data: HistoricalDataPoint[] = [];
    const now = new Date();
    const actualMonths = months === -1 ? 24 : months;

    for (let i = actualMonths - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      
      const baseNetWorth = 50000;
      const trend = (actualMonths - i) * 1500;
      const volatility = (Math.random() - 0.5) * 8000;
      const netWorth = baseNetWorth + trend + volatility;
      
      const assets = netWorth + 35000 + (Math.random() * 5000);
      const liabilities = assets - netWorth;
      
      data.push({
        date: date.toISOString().split('T')[0],
        netWorth: Math.max(0, netWorth),
        totalAssets: Math.max(0, assets),
        totalLiabilities: Math.max(0, liabilities),
        connectedValue: assets * 0.6,
        manualAssets: assets * 0.4,
        manualLiabilities: liabilities * 0.8,
        monthOverMonth: i === actualMonths - 1 ? 0 : ((netWorth - (data[data.length - 1]?.netWorth || netWorth)) / (data[data.length - 1]?.netWorth || netWorth)) * 100,
      });
    }

    return data;
  };

  const handlePeriodChange = (period: TimePeriodConfig) => {
    setSelectedPeriod(period);
  };

  const handleRefresh = async () => {
    await loadData();
  };

  const handleExport = async (format: 'csv' | 'image' | 'share') => {
    console.log(`Exporting data in ${format} format`);
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/networth');
    }
  };

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
        {/* Gradient Header */}
        <GradientHeader
          title="Net Worth History"
          onBackPress={handleGoBack}
          onCalendarPress={() => {}}
          onNotificationPress={() => {}}
        />

        {/* Content Card */}
        <View style={styles.contentCard}>
          {/* Time Period Selector */}
          <View style={styles.sectionContainer}>
            <TimePeriodSelector
              periods={TIME_PERIODS}
              selectedPeriod={selectedPeriod}
              onPeriodChange={handlePeriodChange}
              availableData={historicalData}
            />
          </View>

          {/* Historical Chart */}
          <View style={styles.sectionContainer}>
            <NetWorthHistoryChart
              data={historicalData}
              timePeriod={selectedPeriod}
              height={300}
              interactive={true}
              showBreakdown={true}
              isLoading={isLoading}
              onDataPointSelect={(point) => console.log('Selected:', point)}
            />
          </View>

          {/* Trend Insights */}
          <View style={styles.sectionContainer}>
            <TrendInsights
              data={historicalData}
              timePeriod={selectedPeriod}
              isLoading={isLoading}
            />
          </View>

          {/* Export Options */}
          <View style={styles.sectionContainer}>
            <ExportOptions
              onExport={handleExport}
              data={historicalData}
              timePeriod={selectedPeriod}
              disabled={isLoading || historicalData.length === 0}
            />
          </View>

          {/* Historical Breakdown Table */}
          <View style={styles.sectionContainer}>
            <HistoryBreakdownTable
              data={historicalData}
              timePeriod={selectedPeriod}
              isLoading={isLoading}
              showCategoryBreakdown={true}
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
    paddingTop: SPACING.xl,
    flex: 1,
  },
  sectionContainer: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  bottomSpacing: {
    height: 130,
  },
});