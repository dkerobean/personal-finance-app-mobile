import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet,
  SafeAreaView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useCategoryStore } from '@/stores/categoryStore';
import GradientHeader from '@/components/budgets/GradientHeader';
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY, SHADOWS, BUDGET } from '@/constants/design';
import type { Category } from '@/types/models';

import { useAuth } from '@clerk/clerk-expo';

export default function CategoriesScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const {
    categories,
    isLoading,
    error,
    loadCategories,
    deleteCategory,
    clearError,
  } = useCategoryStore();

  useEffect(() => {
    if (userId) {
      loadCategories(userId);
    }
  }, [userId]);

  const handleCategoryPress = (categoryId: string) => {
    router.push(`/settings/categories/edit/${categoryId}`);
  };

  const handleCreatePress = () => {
    router.push('/settings/categories/create');
  };

  const defaultCategories = [
    { name: 'Food', icon: 'restaurant', color: COLORS.primary },
    { name: 'Transport', icon: 'directions-car', color: COLORS.lightBlue },
    { name: 'Medicine', icon: 'local-pharmacy', color: COLORS.accent },
    { name: 'Groceries', icon: 'shopping-cart', color: COLORS.lightBlue },
    { name: 'Rent', icon: 'home', color: COLORS.accent },
    { name: 'Gifts', icon: 'card-giftcard', color: COLORS.primary },
    { name: 'Savings', icon: 'savings', color: COLORS.lightBlue },
    { name: 'Entertainment', icon: 'movie', color: COLORS.accent },
    { name: 'More', icon: 'more-horiz', color: COLORS.primary },
  ];

  if (isLoading && categories.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Gradient Header Section */}
        <GradientHeader
          title="Categories"
          subtitle="Manage your transaction categories"
          onBackPress={() => router.back()}
          onCalendarPress={() => {
            // Handle calendar press
          }}
          onNotificationPress={() => {
            // Handle notification press
          }}
          showCalendar={false}
        />

        {/* Content Card */}
        <View style={styles.content}>
          {/* Add Category Button */}
          <View style={styles.addCategoryHeader}>
            <TouchableOpacity style={styles.addCategoryButton} onPress={handleCreatePress}>
              <MaterialIcons name="add" size={24} color={COLORS.white} />
              <Text style={styles.addCategoryButtonText}>Add Category</Text>
            </TouchableOpacity>
          </View>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError} style={styles.errorCloseButton}>
              <MaterialIcons name="close" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        )}

        {categories.length === 0 && !isLoading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No categories found.{'\n'}Create your first category or load default categories.
            </Text>
            <TouchableOpacity 
              style={styles.seedButton}
              onPress={async () => {
                // Triggering a reload which triggers the seed on server
                if (userId) await loadCategories(userId);
              }}
              disabled={isLoading}
            >
              <Text style={styles.seedButtonText}>
                {isLoading ? 'Loading...' : 'Create Default Categories'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.categoriesGrid}>
            {(categories.length > 0 ? categories : defaultCategories).map((category, index) => {
              const isCategory = 'id' in category;
              const categoryColor = isCategory 
                ? COLORS.primary 
                : category.color;
              const categoryIcon = isCategory 
                ? category.icon_name as any
                : category.icon as any;
              const categoryName = category.name;

              return (
                <TouchableOpacity
                  key={isCategory ? category.id : index}
                  style={styles.categoryCard}
                  onPress={() => isCategory ? handleCategoryPress(category.id) : handleCreatePress()}
                  activeOpacity={0.7}
                >
                  <View style={[styles.categoryIconContainer, { backgroundColor: categoryColor + '20' }]}>
                    <MaterialIcons
                      name={categoryIcon}
                      size={28}
                      color={categoryColor}
                    />
                  </View>
                  <Text style={styles.categoryName} numberOfLines={1}>{categoryName}</Text>
                  
                  {/* Subtle Arrow for interactivity hint */}
                  {/* <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} style={{ marginTop: 4 }} /> */}
                </TouchableOpacity>
              );
            })}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundContent,
  },
  loadingText: {
    marginTop: 16,
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textTertiary,
    fontFamily: 'Poppins',
  },
  addCategoryHeader: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  addCategoryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.huge,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  addCategoryButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  content: {
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
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.sm,
  },
  errorText: {
    color: COLORS.error,
    flex: 1,
    fontFamily: 'Poppins',
  },
  errorCloseButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl * 2,
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    color: COLORS.textTertiary,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.sizes.lg,
    marginBottom: SPACING.xxl,
    fontFamily: 'Poppins',
  },
  seedButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  bottomSpacing: {
    height: 150,
  },
  seedButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontFamily: 'Poppins',
  },
  categoriesGrid: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    gap: SPACING.md,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  categoryName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
    flex: 1,
  },
});