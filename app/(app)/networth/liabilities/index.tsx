import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet,
  SafeAreaView,
  Modal 
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useNetWorthStore } from '@/stores/netWorthStore';
import type { Liability, LiabilityCategory } from '@/types/models';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/design';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/ui/CustomAlert';
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
  const [selectedCategory, setSelectedCategory] = useState<LiabilityCategory | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const { alert, alertProps } = useCustomAlert();
  
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

  const handleDeletePress = (liability: Liability) => {
    alert(
      'Delete Debt',
      `Are you sure you want to delete "${liability.name}" with balance $${liability.current_balance.toFixed(2)}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => handleDeleteConfirm(liability.id)
        }
      ]
    );
  };

  const handleDeleteConfirm = async (liabilityId: string) => {
    const success = await deleteLiability(liabilityId);
    if (!success && error) {
      alert('Error', error);
    }
  };

  const handleLiabilityPress = (liabilityId: string) => {
    router.push(`/networth/liabilities/edit/${liabilityId}`);
  };

  const handleCreatePress = () => {
    router.push('/networth/liabilities/add');
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  // Calculate summary data and filter liabilities
  const summaryData = useMemo(() => {
    let filteredLiabilities = liabilities;
    
    if (selectedCategory !== 'all') {
      filteredLiabilities = liabilities.filter(liability => liability.category === selectedCategory);
    }

    // Sort liabilities
    filteredLiabilities = [...filteredLiabilities].sort((a, b) => {
      const comparison = sortOrder === 'desc' 
        ? b.current_balance - a.current_balance 
        : a.current_balance - b.current_balance;
      return comparison;
    });

    const totalBalance = filteredLiabilities.reduce((sum, liability) => sum + liability.current_balance, 0);
    const liabilityCount = filteredLiabilities.length;

    // Group by category for breakdown
    const categoryBreakdown = Object.entries(
      filteredLiabilities.reduce((groups, liability) => {
        if (!groups[liability.category]) {
          groups[liability.category] = { total: 0, count: 0 };
        }
        groups[liability.category].total += liability.current_balance;
        groups[liability.category].count += 1;
        return groups;
      }, {} as Record<string, { total: number; count: number }>)
    ).map(([category, data]) => ({ category: category as LiabilityCategory, ...data }));

    return { filteredLiabilities, totalBalance, liabilityCount, categoryBreakdown };
  }, [liabilities, selectedCategory, sortOrder]);

  if (isLoadingLiabilities && liabilities.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.error} />
          <Text style={styles.loadingText}>Loading debts...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back-ios" size={19} color={COLORS.primaryLight} />
        </TouchableOpacity>
        <Text style={styles.title}>Liabilities</Text>
        <TouchableOpacity onPress={toggleSortOrder} style={styles.sortButton}>
          <MaterialIcons 
            name={sortOrder === 'desc' ? 'arrow-downward' : 'arrow-upward'} 
            size={24} 
            color={COLORS.textPrimary} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError} style={styles.errorCloseButton}>
              <MaterialIcons name="close" size={20} color="#dc3545" />
            </TouchableOpacity>
          </View>
        )}

        {/* Summary Card - Debt focused */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Total Debt</Text>
          <Text style={styles.summaryAmount}>-${summaryData.totalBalance.toFixed(2)}</Text>
          <Text style={styles.summarySubtitle}>{summaryData.liabilityCount} debts</Text>
        </View>

        {/* Liabilities Container */}
        <View style={styles.liabilitiesContainer}>
          {/* Category Filter Header */}
          <View style={styles.categoryHeaderContainer}>
            <Text style={styles.categoryHeaderText}>
              {selectedCategory === 'all' ? 'All Debts' : LIABILITY_CATEGORIES.find(cat => cat.key === selectedCategory)?.label}
            </Text>
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowCategoryFilter(true)}
            >
              <MaterialIcons name="filter-list" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* Liabilities List */}
          {summaryData.filteredLiabilities.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="money-off" size={64} color={COLORS.textTertiary} />
              <Text style={styles.emptyText}>
                {selectedCategory === 'all' 
                  ? 'No debts tracked.\nAdd your first debt to monitor your liabilities.' 
                  : `No ${LIABILITY_CATEGORIES.find(cat => cat.key === selectedCategory)?.label.toLowerCase()} debts yet.`
                }
              </Text>
            </View>
          ) : (
            <LiabilitiesList 
              liabilities={summaryData.filteredLiabilities}
              onLiabilityPress={handleLiabilityPress}
              onDeletePress={handleDeletePress}
            />
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleCreatePress}>
        <MaterialIcons name="add" size={24} color={COLORS.white} />
      </TouchableOpacity>

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
              <TouchableOpacity onPress={() => setShowCategoryFilter(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
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
                  <View style={styles.categoryItemContent}>
                    <MaterialIcons 
                      name={category.icon as any} 
                      size={24} 
                      color={selectedCategory === category.key ? COLORS.error : COLORS.textSecondary} 
                    />
                    <Text style={[
                      styles.categoryText,
                      selectedCategory === category.key && styles.categoryTextSelected
                    ]}>
                      {category.label}
                    </Text>
                  </View>
                  {selectedCategory === category.key && (
                    <MaterialIcons name="check" size={20} color={COLORS.error} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      <CustomAlert {...alertProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundMain,
    paddingTop: 44,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 37,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
  },
  sortButton: {
    width: 30,
    height: 30,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 37,
    marginVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#dc3545',
    flex: 1,
  },
  errorCloseButton: {
    padding: 4,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 37,
    marginVertical: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: 'Poppins',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.error, // Red for debt
    fontFamily: 'Poppins',
  },
  summarySubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    fontFamily: 'Poppins',
    marginTop: 4,
  },
  liabilitiesContainer: {
    marginTop: 30,
    backgroundColor: COLORS.primaryLight,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 30,
    minHeight: 400,
  },
  categoryHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 37,
    paddingBottom: 20,
  },
  categoryHeaderText: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
  },
  filterButton: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.error, // Red theme for debts
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 37,
  },
  emptyText: {
    color: COLORS.textTertiary,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.sizes.lg,
    marginTop: 16,
    fontFamily: 'Poppins',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    fontFamily: 'Poppins',
  },
  fab: {
    position: 'absolute',
    right: 37,
    bottom: 120,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.error, // Red theme for debt FAB
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
  },
  categoryList: {
    maxHeight: 400,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryItemSelected: {
    backgroundColor: '#fef2f2', // Light red background
  },
  categoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
    marginLeft: 12,
  },
  categoryTextSelected: {
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});