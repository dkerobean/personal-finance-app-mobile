import React, { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useCategoryStore } from '@/stores/categoryStore';
import GradientHeader from '@/components/budgets/GradientHeader';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/ui/CustomAlert';
import type { Category } from '@/types/models';
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY, SHADOWS, BUDGET } from '@/constants/design';
import { useAuth } from '@clerk/clerk-expo';

const ICON_CATEGORIES = {
  'Financial': ['attach-money', 'payment', 'account-balance', 'savings', 'credit-card', 'account-balance-wallet'],
  'Food & Dining': ['restaurant', 'fastfood', 'local-cafe', 'local-pizza', 'cake', 'local-bar', 'coffee', 'local-dining'],
  'Transportation': ['directions-car', 'local-gas-station', 'train', 'directions-bus', 'flight', 'motorcycle', 'local-taxi', 'commute'],
  'Shopping': ['shopping-cart', 'shopping-bag', 'local-mall', 'storefront', 'local-grocery-store', 'receipt', 'redeem'],
  'Entertainment': ['movie', 'music-note', 'sports-soccer', 'videogame-asset', 'camera-alt', 'beach-access', 'casino'],
  'Health': ['local-hospital', 'local-pharmacy', 'fitness-center', 'spa', 'healing', 'favorite', 'medical-services'],
  'Education': ['school', 'library-books', 'menu-book', 'science', 'psychology', 'graduation-cap'],
  'Home': ['home', 'bed', 'kitchen', 'lightbulb', 'plumbing', 'construction', 'cleaning-services'],
  'Technology': ['phone', 'computer', 'laptop', 'tablet', 'watch', 'headphones', 'wifi', 'memory'],
  'Personal Care': ['face', 'cut', 'spa', 'brush', 'checkroom', 'local-laundry-service'],
  'Travel': ['travel-explore', 'hotel', 'local-activity', 'map', 'luggage', 'flight-takeoff'],
  'Pets': ['pets', 'cruelty-free'],
  'Other': ['category', 'work', 'business', 'event', 'star', 'flag', 'schedule', 'place']
};

const AVAILABLE_ICONS = Object.values(ICON_CATEGORIES).flat();

export default function EditCategoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const { categories, updateCategory, isLoading, error } = useCategoryStore();
  const { alert, alertProps } = useCustomAlert();

  const [category, setCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('restaurant');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (id && categories.length > 0) {
      const foundCategory = categories.find(cat => cat.id === id);
      if (foundCategory) {
        setCategory(foundCategory);
        setName(foundCategory.name);
        setSelectedIcon(foundCategory.icon_name);
      }
    }
  }, [id, categories]);

  const validateForm = () => {
    let isValid = true;
    
    if (!name.trim()) {
      setNameError('Category name is required');
      isValid = false;
    } else if (name.trim().length < 2) {
      setNameError('Category name must be at least 2 characters');
      isValid = false;
    } else {
      setNameError('');
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!category || !validateForm()) return;
    if (!userId) {
      alert('Sign In Required', 'Please sign in to update categories.');
      return;
    }

    const success = await updateCategory(
      userId,
      category.id,
      name.trim() !== category.name ? name.trim() : undefined,
      selectedIcon !== category.icon_name ? selectedIcon : undefined
    );
    
    if (success) {
      alert('Success', 'Category updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } else if (error) {
      alert('Error', error);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (!category) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading category...</Text>
        </View>
      </View>
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
          title="Edit Category"
          subtitle="Update your category details"
          onBackPress={handleCancel}
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
          <View style={styles.form}>
            {/* Category Name Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Category Name</Text>
              <TextInput
                style={[styles.mintInput, nameError ? styles.inputError : null]}
                placeholder="Enter category name"
                placeholderTextColor={COLORS.textSecondary}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (nameError) setNameError('');
                }}
                autoCapitalize="words"
                maxLength={50}
              />
              {nameError && (
                <Text style={styles.errorText}>{nameError}</Text>
              )}
            </View>

            {/* Icon Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Select Icon</Text>
              
              {Object.entries(ICON_CATEGORIES).map(([categoryName, icons]) => (
                <View key={categoryName} style={styles.iconCategorySection}>
                  <Text style={styles.iconCategoryTitle}>{categoryName}</Text>
                  <View style={styles.iconGrid}>
                    {icons.map((iconName) => (
                      <TouchableOpacity
                        key={iconName}
                        onPress={() => setSelectedIcon(iconName)}
                        style={[
                          styles.iconButton,
                          selectedIcon === iconName && styles.iconButtonSelected
                        ]}
                      >
                        <MaterialIcons
                          name={iconName as any}
                          size={24}
                          color={selectedIcon === iconName ? COLORS.primary : COLORS.textSecondary}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            {/* Save Button */}
            <View style={styles.saveButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (isLoading || !name.trim()) && styles.disabledButton
                ]}
                onPress={handleSubmit}
                disabled={isLoading || !name.trim()}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading ? 'Updating...' : 'Update Category'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Bottom spacing for navigation */}
            <View style={styles.bottomSpacing} />
          </View>
        </View>
      </ScrollView>
      
      <CustomAlert {...alertProps} />
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
  content: {
    backgroundColor: COLORS.backgroundContent,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -20,
    paddingTop: 20,
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
    fontFamily: 'Poppins',
  },
  form: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    fontFamily: 'Poppins',
  },
  mintInput: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: 'Poppins',
    color: COLORS.textPrimary,
    borderWidth: 0,
  },
  inputError: {
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.xs,
    fontFamily: 'Poppins',
  },
  errorContainer: {
    backgroundColor: COLORS.backgroundCard,
    marginHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    marginTop: SPACING.md,
    ...SHADOWS.sm,
  },
  iconCategorySection: {
    marginBottom: SPACING.lg,
  },
  iconCategoryTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
    fontFamily: 'Poppins',
    textTransform: 'uppercase',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: SPACING.sm,
  },
  iconButton: {
    width: '18%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundCard,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  iconButtonSelected: {
    backgroundColor: COLORS.backgroundInput,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  saveButtonContainer: {
    paddingVertical: SPACING.lg,
  },
  bottomSpacing: {
    height: 150,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.huge,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  disabledButton: {
    backgroundColor: COLORS.textTertiary,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontFamily: 'Poppins',
    textTransform: 'uppercase',
  },
});
