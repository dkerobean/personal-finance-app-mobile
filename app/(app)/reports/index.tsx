import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useReportsStore } from '@/stores/reportsStore';
import { useAuthStore } from '@/stores/authStore';
import GradientHeader from '@/components/budgets/GradientHeader';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS, BUDGET } from '@/constants/design';

export default function ReportsScreen(): React.ReactElement {
  const { 
    currentReport,
    selectedMonth,
    isLoading, 
    error, 
    setSelectedMonth,
    fetchMonthlyReport,
    refreshCurrentReport,
    clearError,
    fetchReportComparison
  } = useReportsStore();
  
  const { user } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMonthlyReport(selectedMonth);
    }
  }, [user, selectedMonth]);

  const handleRefresh = async (): Promise<void> => {
    if (!user) return;
    
    setIsRefreshing(true);
    clearError();
    
    try {
      await refreshCurrentReport();
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGoBack = (): void => {
    router.back();
  };

  const handleMonthNavigation = (direction: 'prev' | 'next'): void => {
    const currentDate = new Date(selectedMonth + '-01');
    
    if (direction === 'prev') {
      currentDate.setMonth(currentDate.getMonth() - 1);
    } else {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    const newMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const formatMonthYear = (monthString: string): string => {
    const date = new Date(monthString + '-01');
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const handleExportReport = (): void => {
    Alert.alert('Export Report', 'Report export functionality will be available soon.');
  };

  const handleCompareMonths = (): void => {
    Alert.alert('Compare Months', 'Month comparison functionality will be available soon.');
  };

  const combinedLoading = isLoading || isRefreshing;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={combinedLoading} 
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Gradient Header Section */}
        <GradientHeader
          title="Financial Reports"
          onBackPress={handleGoBack}
          onCalendarPress={() => {
            // Handle calendar press
          }}
          onNotificationPress={() => {
            // Handle notification press
          }}
        />

        {/* Content Card */}
        <View style={styles.contentCard}>
          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={20} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.errorRetryButton}
                onPress={handleRefresh}
              >
                <Text style={styles.errorRetryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Month Navigation */}
          <View style={styles.monthNavigationContainer}>
            <TouchableOpacity 
              style={styles.monthNavButton}
              onPress={() => handleMonthNavigation('prev')}
            >
              <MaterialIcons name="chevron-left" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            
            <View style={styles.monthDisplayContainer}>
              <Text style={styles.monthDisplayText}>
                {formatMonthYear(selectedMonth)}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.monthNavButton}
              onPress={() => handleMonthNavigation('next')}
            >
              <MaterialIcons name="chevron-right" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Report Summary Section */}
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Monthly Summary</Text>
            {currentReport ? (
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <MaterialIcons name="trending-up" size={24} color={COLORS.success} />
                    <Text style={styles.summaryLabel}>Income</Text>
                    <Text style={styles.summaryValue}>
                      ₵{currentReport.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                  
                  <View style={styles.summaryItem}>
                    <MaterialIcons name="trending-down" size={24} color={COLORS.error} />
                    <Text style={styles.summaryLabel}>Expenses</Text>
                    <Text style={styles.summaryValue}>
                      ₵{currentReport.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.netIncomeContainer}>
                  <MaterialIcons 
                    name={currentReport.netIncome >= 0 ? "account-balance" : "warning"} 
                    size={28} 
                    color={currentReport.netIncome >= 0 ? COLORS.success : COLORS.error} 
                  />
                  <Text style={styles.netIncomeLabel}>Net Income</Text>
                  <Text style={[
                    styles.netIncomeValue,
                    { color: currentReport.netIncome >= 0 ? COLORS.success : COLORS.error }
                  ]}>
                    ₵{currentReport.netIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardTitle}>No Data Available</Text>
                <Text style={styles.summaryCardText}>
                  No financial data available for the selected month
                </Text>
              </View>
            )}
          </View>

          {/* Quick Insights Grid */}
          <View style={styles.insightsSection}>
            <Text style={styles.sectionTitle}>Quick Insights</Text>
            <View style={styles.insightsGrid}>
              <View style={styles.insightCard}>
                <MaterialIcons name="category" size={24} color={COLORS.primary} />
                <Text style={styles.insightCardTitle}>Top Category</Text>
                <Text style={styles.insightCardValue}>
                  {currentReport?.topCategories[0]?.categoryName || '--'}
                </Text>
              </View>
              
              <View style={styles.insightCard}>
                <MaterialIcons name="receipt" size={24} color={COLORS.accent} />
                <Text style={styles.insightCardTitle}>Transactions</Text>
                <Text style={styles.insightCardValue}>
                  {currentReport?.transactionCount || '--'}
                </Text>
              </View>
              
              <View style={styles.insightCard}>
                <MaterialIcons name="analytics" size={24} color={COLORS.success} />
                <Text style={styles.insightCardTitle}>Avg Amount</Text>
                <Text style={styles.insightCardValue}>
                  {currentReport ? `₵${currentReport.avgTransactionAmount.toFixed(0)}` : '--'}
                </Text>
              </View>
              
              <View style={styles.insightCard}>
                <MaterialIcons name="savings" size={24} color={COLORS.warning} />
                <Text style={styles.insightCardTitle}>Savings Rate</Text>
                <Text style={styles.insightCardValue}>
                  {currentReport && currentReport.totalIncome > 0 
                    ? `${((currentReport.netIncome / currentReport.totalIncome) * 100).toFixed(1)}%`
                    : '--'
                  }
                </Text>
              </View>
            </View>
          </View>

          {/* Detailed Insights */}
          {currentReport && currentReport.topCategories.length > 0 && (
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Key Insights</Text>
              <View style={styles.detailsCard}>
                {currentReport.topCategories.slice(0, 3).map((category, index) => (
                  <View key={category.categoryName} style={styles.detailItem}>
                    <MaterialIcons name="trending-up" size={20} color={COLORS.error} />
                    <Text style={styles.detailItemText}>
                      #{index + 1} spending: {category.categoryName} - ₵{category.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                ))}
                
                {currentReport.netIncome !== 0 && (
                  <View style={styles.detailItem}>
                    <MaterialIcons 
                      name={currentReport.netIncome > 0 ? "savings" : "warning"}
                      size={20} 
                      color={currentReport.netIncome > 0 ? COLORS.success : COLORS.warning}
                    />
                    <Text style={styles.detailItemText}>
                      {currentReport.netIncome > 0 
                        ? `You saved ₵${currentReport.netIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })} this month`
                        : `You overspent by ₵${Math.abs(currentReport.netIncome).toLocaleString('en-US', { minimumFractionDigits: 2 })} this month`
                      }
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.primaryActionButton} onPress={handleExportReport}>
              <MaterialIcons name="file-download" size={18} color={COLORS.textSecondary} />
              <Text style={styles.primaryActionButtonText}>Export Report</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryActionButton} onPress={handleCompareMonths}>
              <MaterialIcons name="compare-arrows" size={18} color={COLORS.primary} />
              <Text style={styles.secondaryActionButtonText}>Compare Months</Text>
            </TouchableOpacity>
          </View>

          {/* Loading State */}
          {combinedLoading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading report data...</Text>
            </View>
          )}

          {/* Empty State */}
          {!combinedLoading && !currentReport && !error && (
            <View style={styles.emptyState}>
              <MaterialIcons name="assessment" size={64} color="#d1d5db" />
              <Text style={styles.emptyStateTitle}>No Report Data</Text>
              <Text style={styles.emptyStateText}>
                No financial data available for the selected month.
              </Text>
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
  errorContainer: {
    backgroundColor: COLORS.backgroundCard,
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    ...SHADOWS.sm,
  },
  errorText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
    marginRight: SPACING.md,
  },
  errorRetryButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  errorRetryText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  monthNavigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.md,
  },
  monthNavButton: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  monthDisplayContainer: {
    flex: 1,
    alignItems: 'center',
  },
  monthDisplayText: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  summarySection: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  summaryCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    ...SHADOWS.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  netIncomeContainer: {
    alignItems: 'center',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  netIncomeLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textTertiary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  netIncomeValue: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  summaryCardTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  summaryCardText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  insightsSection: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.sm,
  },
  insightCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    width: '47%',
    marginHorizontal: '1.5%',
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  insightCardTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  insightCardValue: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  detailsSection: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  detailsCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  detailItemText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 20,
  },
  actionsContainer: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  primaryActionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.huge,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  primaryActionButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
  },
  secondaryActionButton: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.huge,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  secondaryActionButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.huge,
    marginTop: SPACING.xl,
  },
  emptyStateTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 150,
  },
});