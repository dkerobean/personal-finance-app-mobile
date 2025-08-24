import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useReportsStore } from '@/stores/reportsStore';
import { reportsApi } from '@/services/api/reports';
import MonthlySummaryCard from '@/components/reports/MonthlySummaryCard';
import CategoryBreakdownChart from '@/components/reports/CategoryBreakdownChart';
import MonthPicker from '@/components/reports/MonthPicker';

const ReportsScreen: React.FC = () => {
  const {
    currentReport,
    selectedMonth,
    availableMonths,
    isLoading,
    error,
    setSelectedMonth,
    fetchMonthlyReport,
    refreshCurrentReport,
    clearError,
    setError,
  } = useReportsStore();

  // Load available months on component mount
  useEffect(() => {
    loadAvailableMonths();
  }, []);

  // Load report for selected month
  useEffect(() => {
    if (selectedMonth) {
      fetchMonthlyReport(selectedMonth);
    }
  }, [selectedMonth, fetchMonthlyReport]);

  const loadAvailableMonths = async () => {
    try {
      const response = await reportsApi.getAvailableMonths(12);
      if (response.error) {
        setError(response.error.message);
        return;
      }

      const months = response.data?.map(item => item.month) || [];
      // Note: In a real implementation, you'd update the store with available months
      // For now, we'll work with the current selectedMonth
    } catch (error) {
      console.error('Error loading available months:', error);
      setError('Failed to load available months');
    }
  };

  const handleRefresh = async () => {
    clearError();
    await Promise.all([
      refreshCurrentReport(),
      loadAvailableMonths(),
    ]);
  };

  const handleMonthSelect = (month: string) => {
    setSelectedMonth(month);
  };

  const showErrorAlert = () => {
    if (error) {
      Alert.alert(
        'Unable to Load Financial Report',
        `We're having trouble loading your financial data. ${error}`,
        [
          {
            text: 'Try Again',
            onPress: handleRefresh,
          },
          {
            text: 'Dismiss',
            style: 'cancel',
            onPress: clearError,
          },
        ]
      );
    }
  };

  // Show error alert when error occurs
  useEffect(() => {
    if (error) {
      showErrorAlert();
    }
  }, [error]);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="assessment" size={64} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No Report Data</Text>
      <Text style={styles.emptySubtitle}>
        Add some transactions to see your monthly financial report and insights.
      </Text>
      <Text style={styles.emptyHint}>
        💡 Connect your bank or mobile money accounts to automatically sync transactions
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingState}>
      <MaterialIcons name="hourglass-empty" size={48} color="#9ca3af" />
      <Text style={styles.loadingText}>Loading your financial report...</Text>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Financial Reports',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTitleStyle: {
            color: '#111827',
            fontWeight: 'bold',
          },
          headerTintColor: '#6b7280',
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#3b82f6"
            colors={['#3b82f6']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Month Picker */}
        <MonthPicker
          selectedMonth={selectedMonth}
          availableMonths={availableMonths}
          onMonthSelect={handleMonthSelect}
          isLoading={isLoading}
        />

        {/* Content */}
        {isLoading && !currentReport ? (
          renderLoadingState()
        ) : !currentReport ? (
          renderEmptyState()
        ) : (
          <>
            {/* Monthly Summary */}
            <MonthlySummaryCard
              report={currentReport}
              isLoading={isLoading}
            />

            {/* Expense Breakdown Chart */}
            {currentReport.categoryBreakdown.length > 0 && (
              <CategoryBreakdownChart
                categoryData={currentReport.categoryBreakdown}
                type="expense"
                isLoading={isLoading}
              />
            )}

            {/* Income Breakdown Chart */}
            {currentReport.categoryBreakdown.some(item => item.type === 'income') && (
              <CategoryBreakdownChart
                categoryData={currentReport.categoryBreakdown}
                type="income"
                isLoading={isLoading}
              />
            )}

            {/* Insights Section */}
            {currentReport.topCategories.length > 0 && (
              <View style={styles.insightsCard}>
                <Text style={styles.insightsTitle}>Key Insights</Text>
                
                <View style={styles.insightItem}>
                  <MaterialIcons name="trending-up" size={20} color="#dc2626" />
                  <Text style={styles.insightText}>
                    Top spending category: {currentReport.topCategories[0]?.categoryName} 
                    (₵{currentReport.topCategories[0]?.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                  </Text>
                </View>

                {currentReport.avgTransactionAmount > 0 && (
                  <View style={styles.insightItem}>
                    <MaterialIcons name="receipt" size={20} color="#3b82f6" />
                    <Text style={styles.insightText}>
                      Average transaction: ₵{currentReport.avgTransactionAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                )}

                {currentReport.netIncome !== 0 && (
                  <View style={styles.insightItem}>
                    <MaterialIcons 
                      name={currentReport.netIncome > 0 ? "savings" : "warning"}
                      size={20} 
                      color={currentReport.netIncome > 0 ? "#16a34a" : "#f59e0b"}
                    />
                    <Text style={styles.insightText}>
                      {currentReport.netIncome > 0 
                        ? `You saved ₵${currentReport.netIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })} this month`
                        : `You overspent by ₵${Math.abs(currentReport.netIncome).toLocaleString('en-US', { minimumFractionDigits: 2 })} this month`
                      }
                    </Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  emptyHint: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  insightsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default ReportsScreen;