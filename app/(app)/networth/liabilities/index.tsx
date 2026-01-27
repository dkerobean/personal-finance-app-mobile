import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet,
  Modal,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useNetWorthStore } from '@/stores/netWorthStore';
import type { Liability, LiabilityCategory } from '@/types/models';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, BUDGET } from '@/constants/design';
import { useAppToast } from '@/hooks/useAppToast';
import GradientHeader from '@/components/budgets/GradientHeader';
import { LiabilitiesList } from '@/components/networth/liabilities';

const LIABILITY_CATEGORIES = [
  { key: 'all', label: 'All Debts', icon: 'account-balance' },
  { key: 'loans', label: 'Loans', icon: 'account-balance' },
  { key: 'credit_cards', label: 'Credit Cards', icon: 'credit-card' },
  { key: 'mortgages', label: 'Mortgages', icon: 'home' },
  { key: 'business_debt', label: 'Business Debt', icon: 'business' },
  { key: 'other', label: 'Other Debts', icon: 'category' },
];

export default function LiabilitiesScreen() {
  const router = useRouter();
  const toast = useAppToast();
  const [selectedCategory, setSelectedCategory] = useState<LiabilityCategory | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    liabilities,
    isLoadingLiabilities,
    error,
    loadLiabilities,
    deleteLiability,
    clearError,
  } = useNetWorthStore();

  useEffect(() => {
    loadLiabilities();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLiabilities();
    setRefreshing(false);
  };

  const handleDeletePress = (liability: Liability) => {
    toast.warning('Delete Liability', `Delete "${liability.name}"?`);
    handleDeleteConfirm(liability.id);
  };

  const handleDeleteConfirm = async (liabilityId: string) => {
    const success = await deleteLiability(liabilityId);
    if (success) {
      toast.success('Deleted', 'Liability removed successfully');
    } else if (error) {
      toast.error('Error', error);
    }
  };

  const handleLiabilityPress = (liabilityId: string) => {
    router.push(`/networth/liabilities/edit/${liabilityId}`);
  };

  const handleCreatePress = () => {
    router.push('/networth/liabilities/add');
  };

  const handleGoBack = () => {
    router.back();
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  const formatCurrency = (amount: number): string => {
    return `₵${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const summaryData = useMemo(() => {
    let filteredLiabilities = liabilities;
    
    if (selectedCategory !== 'all') {
      filteredLiabilities = liabilities.filter(liability => liability.category === selectedCategory);
    }

    filteredLiabilities = [...filteredLiabilities].sort((a, b) => {
      return sortOrder === 'desc' 
        ? b.current_balance - a.current_balance 
        : a.current_balance - b.current_balance;
    });

    const totalBalance = filteredLiabilities.reduce((sum, liability) => sum + liability.current_balance, 0);
    const liabilityCount = filteredLiabilities.length;

    return { filteredLiabilities, totalBalance, liabilityCount };
  }, [liabilities, selectedCategory, sortOrder]);

  if (isLoadingLiabilities && liabilities.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.error} />
          <Text style={styles.loadingText}>Loading liabilities...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor={COLORS.white}
          />
        }
      >
        {/* Gradient Header */}
        <GradientHeader
          title="My Liabilities"
          onBackPress={handleGoBack}
          onCalendarPress={() => {}}
          onNotificationPress={() => {}}
        />

        {/* Content Card */}
        <View style={styles.contentCard}>
          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconBg}>
              <MaterialIcons name="trending-down" size={28} color={COLORS.error} />
            </View>
            <Text style={styles.summaryLabel}>Total Liabilities</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(summaryData.totalBalance)}</Text>
            <Text style={styles.summaryCount}>{summaryData.liabilityCount} debts</Text>
          </View>

          {/* Filter Row */}
          <View style={styles.filterRow}>
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowCategoryFilter(true)}
            >
              <MaterialIcons name="filter-list" size={20} color={COLORS.error} />
              <Text style={styles.filterButtonText}>
                {selectedCategory === 'all' ? 'All Categories' : LIABILITY_CATEGORIES.find(c => c.key === selectedCategory)?.label}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color={COLORS.error} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sortButton} onPress={toggleSortOrder}>
              <MaterialIcons 
                name={sortOrder === 'desc' ? 'arrow-downward' : 'arrow-upward'} 
                size={20} 
                color={COLORS.textSecondary} 
              />
            </TouchableOpacity>
          </View>

          {/* Liabilities List */}
          {summaryData.filteredLiabilities.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <MaterialIcons name="money-off" size={48} color={COLORS.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>No liabilities yet</Text>
              <Text style={styles.emptyDescription}>
                Add your first liability to track your debts
              </Text>
              <TouchableOpacity style={styles.addButton} onPress={handleCreatePress}>
                <MaterialIcons name="add" size={20} color={COLORS.white} />
                <Text style={styles.addButtonText}>Add Liability</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <LiabilitiesList 
              liabilities={summaryData.filteredLiabilities}
              onLiabilityPress={handleLiabilityPress}
              onDeletePress={handleDeletePress}
            />
          )}

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>

      {/* FAB */}
      {summaryData.filteredLiabilities.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleCreatePress}>
          <MaterialIcons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {/* Category Filter Modal */}
      <Modal
        visible={showCategoryFilter}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryFilter(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Category</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowCategoryFilter(false)}
              >
                <MaterialIcons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.categoryList}>
              {LIABILITY_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.key}
                  style={[
                    styles.categoryItem,
                    selectedCategory === category.key && styles.categoryItemSelected
                  ]}
                  onPress={() => {
                    setSelectedCategory(category.key as LiabilityCategory | 'all');
                    setShowCategoryFilter(false);
                  }}
                >
                  <View style={[
                    styles.categoryIconBg,
                    selectedCategory === category.key && styles.categoryIconBgSelected
                  ]}>
                    <MaterialIcons 
                      name={category.icon as any} 
                      size={24} 
                      color={selectedCategory === category.key ? COLORS.white : COLORS.error} 
                    />
                  </View>
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === category.key && styles.categoryTextSelected
                  ]}>
                    {category.label}
                  </Text>
                  {selectedCategory === category.key && (
                    <MaterialIcons name="check-circle" size={24} color={COLORS.error} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
  },
  contentCard: {
    backgroundColor: COLORS.backgroundContent,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -20,
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    minHeight: 600,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  summaryIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    marginBottom: SPACING.xs,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.error,
    marginBottom: SPACING.xs,
  },
  summaryCount: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  filterButtonText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.error,
    fontWeight: '600',
  },
  sortButton: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.lg,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  addButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: 120,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    maxHeight: '70%',
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
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalCloseButton: {
    padding: SPACING.xs,
  },
  categoryList: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
  },
  categoryItemSelected: {
    backgroundColor: '#FEE2E2',
  },
  categoryIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  categoryIconBgSelected: {
    backgroundColor: COLORS.error,
  },
  categoryText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: COLORS.error,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 130,
  },
});