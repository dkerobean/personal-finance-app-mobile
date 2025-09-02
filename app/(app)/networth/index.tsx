import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import NetWorthSummaryCard from '@/components/networth/dashboard/NetWorthSummaryCard';
import NetWorthBreakdownChart from '@/components/networth/dashboard/NetWorthBreakdownChart';
import NetWorthTrendChart from '@/components/networth/dashboard/NetWorthTrendChart';
import NetWorthLoadingState from '@/components/networth/dashboard/NetWorthLoadingState';
import NetWorthErrorState, { NetworkError, CalculationError } from '@/components/networth/dashboard/NetWorthErrorState';
import FinancialHealthScore from '@/components/networth/dashboard/FinancialHealthScore';
import AssetLiabilityQuickActions from '@/components/networth/dashboard/AssetLiabilityQuickActions';
import UnifiedActivityFeed, { ActivityItem } from '@/components/networth/dashboard/UnifiedActivityFeed';
import { NetWorthService, NetWorthData } from '@/services/netWorthService';
import { useNetWorthStore, useNetWorthDashboard } from '@/stores/netWorthStore';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/design';

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
  
  // Get data from store for real-time updates
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

  // Get dashboard-specific data and actions
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
    // Load initial data
    const initializeData = async () => {
      try {
        await Promise.all([
          loadAssets(),
          loadLiabilities(),
          loadHistoricalData(),
        ]);
        // Refresh net worth calculation after loading data
        await refreshNetWorth();
        loadNetWorthData(); // Load legacy data for backward compatibility
      } catch (error) {
        console.error('Error initializing dashboard data:', error);
        setDashboardError(NetworkError('Failed to load dashboard data'));
      }
    };

    initializeData();
  }, []);

  // Recalculate net worth when assets or liabilities change
  useEffect(() => {
    if (assets.length > 0 || liabilities.length > 0) {
      refreshNetWorth();
      loadNetWorthData();
    }
  }, [assets, liabilities]);

  // Refresh data when screen comes into focus (e.g., returning from asset/liability screens)
  useFocusEffect(
    React.useCallback(() => {
      // Refresh store data when returning to screen
      const refreshStoreData = async () => {
        try {
          await Promise.all([
            loadAssets(),
            loadLiabilities()
          ]);
          // Net worth will recalculate automatically due to the useEffect above
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
      // Fetch real net worth data from Supabase
      const data = await NetWorthService.calculateNetWorth();
      setNetWorthData(data);

      // Generate mock activities for now - TODO: Create activity service
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
        {
          id: '3',
          type: 'asset_updated',
          title: 'Property Value Updated',
          description: 'Updated house valuation based on market trends',
          amount: 5000,
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'property',
        },
        {
          id: '4',
          type: 'liability_updated',
          title: 'Mortgage Payment',
          description: 'Monthly mortgage payment processed',
          amount: 2500,
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'mortgages',
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
    // Clear any existing errors
    if (error) {
      clearError();
    }
    if (calculationError) {
      resetCalculationError();
    }
    if (dashboardError) {
      setDashboardError(null);
    }
    
    try {
      // Refresh all data
      await Promise.all([
        loadAssets(),
        loadLiabilities(),
        loadHistoricalData(),
      ]);
      
      // Refresh net worth calculation
      await refreshNetWorth();
      
      // Load legacy data for backward compatibility
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

  // Combined loading state
  const combinedLoading = isLoading || isLoadingAssets || isLoadingLiabilities || isCalculating;
  const isInitialLoading = combinedLoading && (!assets.length && !liabilities.length);
  
  // Error state priority: dashboard errors first, then calculation errors, then general errors
  const currentError = dashboardError || (calculationError && CalculationError(calculationError)) || (error && NetworkError(error));

  const handleNetWorthDetails = (): void => {
    console.log('Navigate to detailed net worth analysis');
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

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Net Worth Calculator',
          headerShown: true,
          headerStyle: {
            backgroundColor: COLORS.backgroundMain,
          },
          headerTitleStyle: {
            color: COLORS.textPrimary,
            fontWeight: TYPOGRAPHY.weights.semibold,
          },
          headerTintColor: COLORS.textPrimary,
        }}
      />
      
      <SafeAreaView style={styles.container}>
        {/* Show comprehensive loading state on initial load */}
        {isInitialLoading ? (
          <NetWorthLoadingState showTrendChart={true} />
        ) : currentError ? (
          /* Show error state with retry option */
          <NetWorthErrorState 
            error={currentError}
            onRetry={handleRetryError}
            showContactSupport={true}
          />
        ) : (
          /* Main dashboard content */
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={combinedLoading && !isInitialLoading} 
                onRefresh={handleRefresh}
                tintColor={COLORS.primary}
                colors={[COLORS.primary]}
              />
            }
          >
            {/* Net Worth Summary Card */}
            <NetWorthSummaryCard
              netWorth={currentNetWorth?.netWorth || netWorthData.netWorth}
              totalAssets={currentNetWorth?.totalAssets || netWorthData.totalAssets}
              totalLiabilities={currentNetWorth?.totalLiabilities || netWorthData.totalLiabilities}
              monthlyChange={currentNetWorth?.monthlyChange || netWorthData.monthlyChange}
              monthlyChangePercentage={currentNetWorth?.monthlyChangePercentage || netWorthData.monthlyChangePercentage}
              isLoading={isCalculating}
              onPress={handleNetWorthDetails}
            />

            {/* Net Worth Breakdown Chart */}
            <NetWorthBreakdownChart
              totalAssets={currentNetWorth?.totalAssets || netWorthData.totalAssets}
              totalLiabilities={currentNetWorth?.totalLiabilities || netWorthData.totalLiabilities}
              assetsBreakdown={netWorthData.assetsBreakdown}
              liabilitiesBreakdown={netWorthData.liabilitiesBreakdown}
              isLoading={combinedLoading}
              onViewDetails={handleNetWorthDetails}
            />

            {/* Net Worth Trend Chart - NEW COMPONENT */}
            <NetWorthTrendChart
              historicalData={historicalData}
              isLoading={isLoadingHistory}
              onViewHistory={handleViewHistory}
            />

            {/* Quick Actions for Assets/Liabilities */}
            <AssetLiabilityQuickActions
              onAddAsset={handleAddAsset}
              onAddLiability={handleAddLiability}
              onViewAssets={handleViewAssets}
              onViewLiabilities={handleViewLiabilities}
              onViewHistory={handleViewHistory}
              onCalculateNetWorth={handleCalculateNetWorth}
              isLoading={combinedLoading}
            />

            {/* Financial Health Score */}
            <FinancialHealthScore
              totalAssets={currentNetWorth?.totalAssets || netWorthData.totalAssets}
              totalLiabilities={currentNetWorth?.totalLiabilities || netWorthData.totalLiabilities}
              monthlyIncome={netWorthData.monthlyIncome}
              monthlyExpenses={netWorthData.monthlyExpenses}
              savingsRate={netWorthData.savingsRate}
              isLoading={combinedLoading}
              onViewDetails={handleNetWorthDetails}
            />

            {/* Activity Feed */}
            <UnifiedActivityFeed
              activities={activities}
              isLoading={combinedLoading}
              onItemPress={handleActivityPress}
            />

            {/* Bottom spacing for navigation */}
            <View style={styles.bottomSpacing} />
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundMain,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.backgroundContent,
  },
  bottomSpacing: {
    height: 130,
  },
});