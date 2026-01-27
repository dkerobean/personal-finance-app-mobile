import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity,
  Alert,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet2, AlertTriangle, Grid3x3, Receipt, BarChart3, PiggyBank, AlertCircle, Download, ArrowLeftRight, FileText, X } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useReportsStore } from '@/stores/reportsStore';
import { useAuthStore } from '@/stores/authStore';
import { useUser } from '@clerk/clerk-expo';
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
    fetchReportComparison,
    comparison
  } = useReportsStore();
  
  const { user } = useUser();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareMonth, setCompareMonth] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchMonthlyReport(selectedMonth, user.id);
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
    setShowCompareModal(true);
  };

  const executeComparison = async (monthToCompare: string) => {
    if (!user) return;
    
    setCompareMonth(monthToCompare);
    setShowCompareModal(false);
    
    try {
      await fetchReportComparison(selectedMonth, monthToCompare, user.id);
      Alert.alert(
        'Comparison Ready',
        `Comparing ${formatMonthYear(selectedMonth)} with ${formatMonthYear(monthToCompare)}`,
        [{ text: 'View Details', onPress: () => router.push({
          pathname: '/reports/compare',
          params: { current: selectedMonth, previous: monthToCompare }
        } as any) }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to generate comparison');
    }
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
              <AlertCircle size={20} color={COLORS.error} />
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
              <ChevronLeft size={24} color={COLORS.white} />
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
              <ChevronRight size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* Report Summary Section */}
          <Animated.View entering={FadeInDown.duration(600)} style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Monthly Summary</Text>
            {currentReport ? (
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <TrendingUp size={24} color={COLORS.success} />
                    <Text style={styles.summaryLabel}>Income</Text>
                    <Text style={styles.summaryValue}>
                      ₵{currentReport.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                  
                  <View style={styles.summaryItem}>
                    <TrendingDown size={24} color={COLORS.error} />
                    <Text style={styles.summaryLabel}>Expenses</Text>
                    <Text style={styles.summaryValue}>
                      ₵{currentReport.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.netIncomeContainer}>
                  {currentReport.netIncome >= 0 ? (
                    <Wallet2 size={28} color={COLORS.success} />
                  ) : (
                    <AlertTriangle size={28} color={COLORS.error} />
                  )}
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
          </Animated.View>

          {/* Quick Insights Grid */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.insightsSection}>
            <Text style={styles.sectionTitle}>Quick Insights</Text>
            <View style={styles.insightsGrid}>
              <View style={styles.insightCard}>
                <Grid3x3 size={24} color={COLORS.primary} />
                <Text style={styles.insightCardTitle}>Top Category</Text>
                <Text style={styles.insightCardValue}>
                  {currentReport?.topCategories[0]?.categoryName || '--'}
                </Text>
              </View>
              
              <View style={styles.insightCard}>
                <Receipt size={24} color={COLORS.accent} />
                <Text style={styles.insightCardTitle}>Transactions</Text>
                <Text style={styles.insightCardValue}>
                  {currentReport?.transactionCount || '--'}
                </Text>
              </View>
              
              <View style={styles.insightCard}>
                <BarChart3 size={24} color={COLORS.success} />
                <Text style={styles.insightCardTitle}>Avg Amount</Text>
                <Text style={styles.insightCardValue}>
                  {currentReport ? `₵${currentReport.avgTransactionAmount.toFixed(0)}` : '--'}
                </Text>
              </View>
              
              <View style={styles.insightCard}>
                <PiggyBank size={24} color={COLORS.warning} />
                <Text style={styles.insightCardTitle}>Savings Rate</Text>
                <Text style={styles.insightCardValue}>
                  {currentReport && currentReport.totalIncome > 0 
                    ? `${((currentReport.netIncome / currentReport.totalIncome) * 100).toFixed(1)}%`
                    : '--'
                  }
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Detailed Insights */}
          {currentReport && currentReport.topCategories.length > 0 && (
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Key Insights</Text>
              <View style={styles.detailsCard}>
                {currentReport.topCategories.slice(0, 3).map((category, index) => (
                  <View key={category.categoryName} style={styles.detailItem}>
                    <TrendingDown size={20} color={COLORS.error} />
                    <Text style={styles.detailItemText}>
                      #{index + 1} spending: {category.categoryName} - ₵{category.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                ))}
                
                {currentReport.netIncome !== 0 && (
                  <View style={styles.detailItem}>
                    {currentReport.netIncome > 0 ? (
                      <PiggyBank size={20} color={COLORS.success} />
                    ) : (
                      <AlertTriangle size={20} color={COLORS.warning} />
                    )}
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
              <Download size={18} color={COLORS.textSecondary} />
              <Text style={styles.primaryActionButtonText}>Export Report</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryActionButton} onPress={handleCompareMonths}>
              <ArrowLeftRight size={18} color={COLORS.primary} />
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
              <FileText size={64} color="#d1d5db" />
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

      {/* Comparison Month Selection Modal */}
      <Modal
        visible={showCompareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCompareModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowCompareModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Compare with Month</Text>
              <TouchableOpacity onPress={() => setShowCompareModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.monthList}>
              <TouchableOpacity 
                style={styles.monthItem}
                onPress={() => {
                  const prevMonthDate = new Date(selectedMonth + '-01');
                  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
                  const prevMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
                  executeComparison(prevMonth);
                }}
              >
                <Text style={styles.monthText}>Previous Month</Text>
                <ArrowLeftRight size={20} color={COLORS.primary} />
              </TouchableOpacity>

              {/* Add more specific month options if available in store */}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.backgroundCard,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  monthList: {
    maxHeight: 300,
  },
  monthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  monthText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
  },
});