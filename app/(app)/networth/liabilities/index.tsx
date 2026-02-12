import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@clerk/clerk-expo';
import { useNetWorthStore } from '@/stores/netWorthStore';
import type { Liability, LiabilityCategory } from '@/types/models';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, BUDGET } from '@/constants/design';
import { useAppToast } from '@/hooks/useAppToast';
import GradientHeader from '@/components/budgets/GradientHeader';
import { LiabilitiesList } from '@/components/networth/liabilities';
import { formatCurrency } from '@/lib/formatters';

const LIABILITY_CATEGORIES: Array<{ key: LiabilityCategory | 'all'; label: string; icon: string }> = [
  { key: 'all', label: 'All Debts', icon: 'account-balance' },
  { key: 'loans', label: 'Loans', icon: 'account-balance' },
  { key: 'credit_cards', label: 'Credit Cards', icon: 'credit-card' },
  { key: 'mortgages', label: 'Mortgages', icon: 'home' },
  { key: 'business_debt', label: 'Business Debt', icon: 'business-center' },
  { key: 'other', label: 'Other Debts', icon: 'category' },
];

export default function LiabilitiesScreen() {
  const router = useRouter();
  const toast = useAppToast();
  const { user } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<LiabilityCategory | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { liabilities, isLoadingLiabilities, error, loadLiabilities, deleteLiability, clearError } = useNetWorthStore();

  useEffect(() => {
    if (user?.id) {
      loadLiabilities(user.id);
    }
  }, [user?.id, loadLiabilities]);

  const handleRefresh = async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await loadLiabilities(user.id);
    setRefreshing(false);
  };

  const handleDeletePress = (liability: Liability) => {
    Alert.alert('Delete Liability', `Are you sure you want to delete "${liability.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!user?.id) return;
          const success = await deleteLiability(user.id, liability.id);
          if (success) {
            toast.success('Deleted', 'Liability removed successfully');
          } else {
            toast.error('Error', 'Failed to delete liability');
          }
        },
      },
    ]);
  };

  const handleLiabilityPress = (liabilityId: string) => {
    router.push(`/networth/liabilities/edit/${liabilityId}`);
  };

  const handleCreatePress = () => {
    router.push('/networth/liabilities/add');
  };

  const summaryData = useMemo(() => {
    let filteredLiabilities = liabilities;
    if (selectedCategory !== 'all') {
      filteredLiabilities = filteredLiabilities.filter((liability) => liability.category === selectedCategory);
    }

    filteredLiabilities = [...filteredLiabilities].sort((a, b) =>
      sortOrder === 'desc' ? b.current_balance - a.current_balance : a.current_balance - b.current_balance
    );

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.white} />}
      >
        <GradientHeader
          title="Liabilities"
          subtitle="Track debts and obligations"
          onBackPress={() => router.back()}
          showCalendar={false}
          showNotification={false}
        />

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['#7F1D1D', '#B91C1C', '#EF4444']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryCard}
          >
            <Text style={styles.summaryLabel}>Total Liabilities</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(summaryData.totalBalance)}</Text>
            <Text style={styles.summaryCount}>{summaryData.liabilityCount} debt entries</Text>
          </LinearGradient>

          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.filterButton} onPress={() => setShowCategoryFilter(true)} activeOpacity={0.86}>
              <MaterialIcons name="filter-list" size={18} color={COLORS.error} />
              <Text style={styles.filterButtonText}>
                {selectedCategory === 'all'
                  ? 'All Categories'
                  : LIABILITY_CATEGORIES.find((item) => item.key === selectedCategory)?.label}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={18} color={COLORS.error} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              activeOpacity={0.86}
            >
              <MaterialIcons name={sortOrder === 'desc' ? 'south' : 'north'} size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={clearError}>
                <MaterialIcons name="close" size={18} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ) : null}

          {summaryData.filteredLiabilities.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <MaterialIcons name="money-off" size={42} color={COLORS.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>No liabilities yet</Text>
              <Text style={styles.emptyDescription}>Add your first liability to complete your net worth picture.</Text>
              <TouchableOpacity style={styles.addButton} onPress={handleCreatePress} activeOpacity={0.86}>
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

      {summaryData.filteredLiabilities.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleCreatePress} activeOpacity={0.9}>
          <MaterialIcons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}

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
              <TouchableOpacity onPress={() => setShowCategoryFilter(false)} style={styles.modalCloseButton}>
                <MaterialIcons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.categoryList}>
              {LIABILITY_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.key}
                  style={[styles.categoryItem, selectedCategory === category.key && styles.categoryItemSelected]}
                  onPress={() => {
                    setSelectedCategory(category.key);
                    setShowCategoryFilter(false);
                  }}
                >
                  <View style={[styles.categoryIconBg, selectedCategory === category.key && styles.categoryIconBgSelected]}>
                    <MaterialIcons
                      name={category.icon as any}
                      size={22}
                      color={selectedCategory === category.key ? COLORS.white : COLORS.error}
                    />
                  </View>
                  <Text style={[styles.categoryText, selectedCategory === category.key && styles.categoryTextSelected]}>
                    {category.label}
                  </Text>
                  {selectedCategory === category.key ? (
                    <MaterialIcons name="check-circle" size={22} color={COLORS.error} />
                  ) : null}
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
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    minHeight: 600,
  },
  summaryCard: {
    borderRadius: 24,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.lg,
  },
  summaryLabel: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  summaryAmount: {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginTop: SPACING.xs,
    letterSpacing: -0.7,
  },
  summaryCount: {
    color: COLORS.white,
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    opacity: 0.95,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    ...SHADOWS.sm,
  },
  filterButtonText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  sortButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  errorBanner: {
    marginBottom: SPACING.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    flex: 1,
    color: COLORS.error,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
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
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 999,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  addButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: 118,
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
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: '70%',
  },
  modalHeader: {
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.semibold,
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
    borderRadius: 14,
    marginTop: SPACING.sm,
  },
  categoryItemSelected: {
    backgroundColor: '#FEE2E2',
  },
  categoryIconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  categoryTextSelected: {
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  bottomSpacing: {
    height: 130,
  },
});
