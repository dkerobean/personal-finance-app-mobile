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
  Modal,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { ArrowLeft, Calendar as CalendarIcon, Check, ChevronDown, Save } from 'lucide-react-native';
import { useTransactionStore } from '@/stores/transactionStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useAppToast } from '@/hooks/useAppToast';
import type { TransactionType } from '@/types/models';
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '@/constants/design';

import { useAuth } from '@clerk/clerk-expo';

// Verified valid MaterialIcons names
const VALID_ICONS = [
  'restaurant', 'local-cafe', 'local-pizza', 'fastfood', 'local-bar',
  'lunch-dining', 'ramen-dining', 'bakery-dining', 'icecream', 'local-dining',
  'directions-car', 'local-gas-station', 'directions-bus', 'flight', 'commute',
  'two-wheeler', 'train', 'directions-boat', 'electric-bike', 'airport-shuttle',
  'shopping-bag', 'shopping-cart', 'local-mall', 'storefront', 'card-giftcard',
  'shopping-basket', 'redeem', 'sell', 'store',
  'home', 'power', 'water', 'wifi', 'build',
  'lightbulb', 'electrical-services', 'roofing', 'chair', 'weekend',
  'movie', 'sports-esports', 'music-note', 'celebration', 'theaters',
  'casino', 'sports-bar', 'nightlife', 'sports-soccer', 'sports-basketball',
  'local-hospital', 'fitness-center', 'spa', 'medical-services', 'healing',
  'vaccines', 'medication', 'health-and-safety', 'self-improvement',
  'attach-money', 'savings', 'account-balance', 'credit-card', 'receipt',
  'payments', 'request-quote', 'money', 'paid', 'currency-exchange',
  'school', 'work', 'laptop', 'business-center', 'menu-book',
  'auto-stories', 'class', 'engineering', 'science',
  'family-restroom', 'pets', 'child-care', 'volunteer-activism', 'favorite',
  'cake', 'baby-changing-station', 'elderly', 'person',
  'category', 'more-horiz', 'label', 'bookmark', 'star',
  'local-atm', 'local-phone', 'subscriptions', 'receipt-long'
];

// Validate icon name, return fallback if invalid
const validateIcon = (iconName?: string): string => {
  if (!iconName) return 'category';
  return VALID_ICONS.includes(iconName) ? iconName : 'category';
};


export default function CreateTransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialType = (params.type as TransactionType) || 'expense';
  const { userId } = useAuth();
  const toast = useAppToast();

  const { createTransaction, isLoading, error } = useTransactionStore();
  const { categories, loadCategories } = useCategoryStore();

  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(initialType);
  const [categoryId, setCategoryId] = useState('');
  
  const now = new Date();
  const [date, setDate] = useState(now);
  const [description, setDescription] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  
  // Validation State
  const [amountError, setAmountError] = useState(false);
  const [categoryError, setCategoryError] = useState(false);

  useEffect(() => {
    if (userId) {
      loadCategories(userId);
    }
  }, [userId]);

  // Update type if params change (e.g. deep link)
  useEffect(() => {
    if (params.type) {
      setType(params.type as TransactionType);
    }
  }, [params.type]);

  const handleSubmit = async () => {
    // Validation
    let isValid = true;
    if (!amount || parseFloat(amount) <= 0) {
      setAmountError(true);
      isValid = false;
    }
    if (!categoryId) {
      setCategoryError(true);
      isValid = false;
    }

    if (!isValid || !userId) return;

    try {
      const success = await createTransaction(
        userId,
        parseFloat(amount),
        type,
        categoryId,
        date.toISOString(),
        description.trim() || undefined
      );

      if (success) {
        toast.success(
          type === 'income' ? 'Income Added!' : 'Expense Added!',
          `₵${parseFloat(amount).toFixed(2)} saved successfully`
        );
        setTimeout(() => router.back(), 500);
      } else {
        toast.error('Error', error || 'Failed to save transaction');
      }
    } catch (e) {
      toast.error('Error', 'An unexpected error occurred');
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // Android: hide picker immediately after selection or cancellation
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      // If user selected a date, update state
      setDate(selectedDate);
      
      // OPTIONAL: If we wanted iOS to close on tap, we could do it here, 
      // but "Done" button is better UI for inline pickers.
    }
  };

  const selectedCategory = categories.find(cat => cat.id === categoryId);
  const isIncome = type === 'income';
  const themeColor = isIncome ? COLORS.success : COLORS.error;

  return (
    <View style={[styles.container, { backgroundColor: themeColor }]}>
      <StatusBar barStyle="light-content" backgroundColor={themeColor} />
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={COLORS.white} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isIncome ? 'New Income' : 'New Expense'}</Text>
          <View style={{ width: 24 }} /> 
        </View>

        {/* Type Toggle (Pill) */}
        <View style={styles.toggleContainer}>
          <View style={styles.togglePill}>
            <TouchableOpacity 
              style={[styles.toggleOption, type === 'income' && styles.activeToggle]}
              onPress={() => setType('income')}
            >
              <Text style={[styles.toggleText, type === 'income' && styles.activeToggleText]}>Income</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleOption, type === 'expense' && styles.activeToggle]}
              onPress={() => setType('expense')}
            >
              <Text style={[styles.toggleText, type === 'expense' && styles.activeToggleText]}>Expense</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Massive Amount Input */}
        <View style={styles.amountContainer}>
          <Text style={styles.currencyPrefix}>GHS</Text>
          <TextInput
            style={[styles.amountInput, amountError && { color: '#ffcccc' }]}
            value={amount}
            onChangeText={(t) => {
              setAmount(t.replace(/[^0-9.]/g, ''));
              setAmountError(false);
            }}
            placeholder="0.00"
            placeholderTextColor="rgba(255,255,255,0.6)"
            keyboardType="numeric"
            autoFocus
          />
        </View>

        {/* Start of White Sheet */}
        <View style={styles.sheetContainer}>
          <ScrollView contentContainerStyle={styles.sheetContent}>
            
            {/* Category Selector */}
            <TouchableOpacity 
              style={[styles.inputRow, categoryError && styles.inputError]} 
              onPress={() => setShowCategoryPicker(true)}
            >
              <View style={styles.iconCircle}>
                <MaterialIcons 
                  name={validateIcon(selectedCategory?.icon_name) || 'category'} 
                  size={24} 
                  color={themeColor} 
                />
              </View>
              <View style={styles.inputTextContainer}>
                <Text style={styles.inputLabel}>Category</Text>
                <Text style={[styles.inputValue, !selectedCategory && styles.placeholderText]}>
                  {selectedCategory?.name || 'Select Category'}
                </Text>
              </View>
              <ChevronDown size={20} color={COLORS.gray400} />
            </TouchableOpacity>

            {/* Date Picker Trigger (Label only) */}
            <TouchableOpacity 
              style={styles.inputRow} 
              onPress={() => setShowDatePicker(true)}
            >
              <View style={styles.iconCircle}>
                <CalendarIcon size={24} color={themeColor} />
              </View>
              <View style={styles.inputTextContainer}>
                <Text style={styles.inputLabel}>Date</Text>
                <Text style={styles.inputValue}>{date.toLocaleDateString()}</Text>
              </View>
              <ChevronDown size={20} color={COLORS.gray400} />
            </TouchableOpacity>

            {/* Note Input */}
            <View style={styles.noteContainer}>
              <Text style={styles.inputLabel}>Note (Optional)</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="What is this for?"
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>

          </ScrollView>

          {/* Save Button (Fixed at bottom of sheet) */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: themeColor }]} 
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <Text style={styles.saveButtonText}>Saving...</Text>
              ) : (
                <>
                  <Save size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                  <Text style={styles.saveButtonText}>Save Transaction</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

      </SafeAreaView>

      {/* Android Date Picker */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* iOS Date Picker Modal */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          presentationStyle="overFullScreen"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '75%' }]}>
             <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Select Date</Text>
                  <Text style={{ fontSize: 32, fontWeight: '700', color: themeColor, marginTop: 8 }}>
                    {date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                  </Text>
                   <Text style={{ fontSize: 16, color: COLORS.textTertiary }}>
                    {date.toLocaleDateString('en-US', { year: 'numeric', weekday: 'long' })}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowDatePicker(false)} style={{ padding: 8, backgroundColor: COLORS.gray100, borderRadius: 20 }}>
                  <Check size={24} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={date}
                mode="date"
                display="inline"
                onChange={handleDateChange}
                accentColor={themeColor}
                style={{ height: 320 }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Category Picker Modal */}
      <Modal visible={showCategoryPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
              <Text style={{ color: COLORS.primary, fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={[styles.categoryGrid, { paddingBottom: 50 }]}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryGridItem,
                  categoryId === cat.id && { borderColor: themeColor, borderWidth: 2, backgroundColor: COLORS.primaryLight }
                ]}
                onPress={() => {
                  setCategoryId(cat.id);
                  setCategoryError(false);
                  setShowCategoryPicker(false);
                }}
              >
                <View style={[styles.categoryIconLarge, { backgroundColor: categoryId === cat.id ? themeColor : COLORS.gray100 }]}>
                   <MaterialIcons 
                      name={validateIcon(cat.icon_name) as any} 
                      size={32} 
                      color={categoryId === cat.id ? COLORS.white : COLORS.gray600} 
                   />
                </View>

                <Text style={styles.categoryGridLabel}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
            
            {/* Add New Category Button */}
            <TouchableOpacity 
              style={styles.categoryGridItem}
              onPress={() => {
                setShowCategoryPicker(false);
                router.push('/settings/categories/create');
              }}
            >
               <View style={[styles.categoryIconLarge, { backgroundColor: COLORS.gray50 }]}>
                 <MaterialIcons name="add" size={32} color={COLORS.gray400} />
               </View>
               <Text style={styles.categoryGridLabel}>Add New</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  toggleContainer: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  togglePill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 25,
    padding: 4,
  },
  toggleOption: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  activeToggle: {
    backgroundColor: COLORS.white,
  },
  toggleText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  activeToggleText: {
    color: COLORS.primaryDark, // Or dynamic theme color
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  currencyPrefix: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    width: '80%',
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundContent,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: SPACING.xl,
  },
  sheetContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundInput,
    padding: SPACING.md,
    borderRadius: 16,
    marginBottom: SPACING.md,
  },
  inputError: {
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  inputTextContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginBottom: 2,
  },
  inputValue: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  placeholderText: {
    color: COLORS.textTertiary,
  },
  noteContainer: {
    marginTop: SPACING.md,
  },
  noteInput: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: 16,
    padding: SPACING.lg,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    ...SHADOWS.md,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  categoryGridItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    padding: 10,
    borderRadius: 12,
  },
  categoryIconLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryGridLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  iosDatePickerContainer: {
    backgroundColor: COLORS.gray50,
    borderRadius: 12,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  closeDatePicker: {
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40, 
  },
});