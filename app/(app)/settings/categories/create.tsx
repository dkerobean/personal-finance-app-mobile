import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useCategoryStore } from '@/stores/categoryStore';
import GradientHeader from '@/components/budgets/GradientHeader';
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY, SHADOWS, BUDGET } from '@/constants/design';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/ui/CustomAlert';
import { SafeAreaView } from 'react-native-safe-area-context';

const AVAILABLE_ICONS = [
  // Financial & Money
  'attach-money',
  'savings',
  'account-balance',
  'credit-card',
  'payment',
  'receipt',
  
  // Food & Dining
  'restaurant',
  'local-pizza',
  'local-cafe',
  'coffee',
  'wine-bar',
  'fastfood',
  
  // Transportation
  'car',
  'directions-bus',
  'local-taxi',
  'flight',
  'local-gas-station',
  'motorcycle',
  
  // Shopping & Retail
  'shopping-bag',
  'shopping-cart',
  'store',
  'local-grocery-store',
  'card-giftcard',
  'local-mall',
  
  // Health & Medical
  'local-hospital',
  'local-pharmacy',
  'favorite',
  'spa',
  'medical-services',
  'fitness-center',
  
  // Entertainment & Leisure
  'movie',
  'music-note',
  'games',
  'photo-camera',
  'sports-soccer',
  'sports-basketball',
  
  // Home & Living
  'home',
  'build',
  'electrical-services',
  'plumbing',
  'cleaning-services',
  'bed',
  
  // Education & Work
  'school',
  'work',
  'business-center',
  'laptop-mac',
  'library-books',
  'calculate',
  
  // Technology & Communication
  'phone',
  'computer',
  'smartphone',
  'wifi',
  'router',
  'headphones',
  
  // Travel & Adventure
  'travel-explore',
  'flight-takeoff',
  'hotel',
  'luggage',
  'map',
  'beach-access',
  
  // Utilities & Services
  'electric-bolt',
  'water-drop',
  'local-laundry-service',
  'local-post-office',
  'local-shipping',
  'support-agent',
  
  // Miscellaneous
  'pets',
  'child-care',
  'elderly',
  'volunteer-activism',
  'celebration',
  'more-horiz',
];

export default function CreateCategoryScreen() {
  const router = useRouter();
  const { createCategory, isLoading, error } = useCategoryStore();
  const { alert, alertProps } = useCustomAlert();

  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('attach-money');
  const [nameError, setNameError] = useState('');

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
    if (!validateForm()) return;

    const success = await createCategory(name.trim(), selectedIcon);
    
    if (success) {
      alert('Success', 'Category created successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } else if (error) {
      alert('Error', error);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Gradient Header Section */}
        <GradientHeader
          title="Create Category"
          subtitle="Add a new transaction category"
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
            <View style={styles.formGroup}>
              <Text style={styles.label}>Category Name</Text>
              <TextInput
                style={[styles.input, nameError ? styles.inputError : null]}
                placeholder="Enter category name"
                placeholderTextColor={COLORS.textTertiary}
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

            <View style={styles.formGroup}>
              <Text style={styles.label}>Select Icon</Text>
              
              <View style={styles.iconGrid}>
                {Array.from({ length: Math.ceil(AVAILABLE_ICONS.length / 5) }, (_, rowIndex) => (
                  <View key={rowIndex} style={styles.iconRow}>
                    {AVAILABLE_ICONS.slice(rowIndex * 5, (rowIndex + 1) * 5).map((iconName) => (
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
                          color={selectedIcon === iconName ? COLORS.white : COLORS.textPrimary}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </View>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.primaryButton,
                  (isLoading || !name.trim()) && styles.disabledButton
                ]}
                onPress={handleSubmit}
                disabled={isLoading || !name.trim()}
              >
                <Text style={styles.primaryButtonText}>
                  {isLoading ? 'Creating...' : 'Create Category'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleCancel}
                disabled={isLoading}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
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
  form: {
    gap: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
  },
  formGroup: {
    gap: SPACING.sm,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    fontSize: TYPOGRAPHY.sizes.md,
    backgroundColor: COLORS.white,
    fontFamily: 'Poppins',
    color: COLORS.textPrimary,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: 'Poppins',
  },
  errorContainer: {
    backgroundColor: COLORS.backgroundCard,
    marginHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    ...SHADOWS.sm,
  },
  iconGrid: {
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  iconRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  iconButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.gray100,
    marginHorizontal: 2,
  },
  iconButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  buttonContainer: {
    gap: SPACING.md,
    marginTop: SPACING.huge,
  },
  bottomSpacing: {
    height: 150,
  },
  button: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  disabledButton: {
    backgroundColor: COLORS.textTertiary,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontFamily: 'Poppins',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  secondaryButtonText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontFamily: 'Poppins',
  },
});