import React, { useEffect, useState } from 'react';
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

const MATERIAL_GLYPHS = (MaterialIcons as any).glyphMap as Record<string, number>;

const CATEGORY_FALLBACK_ICONS: Record<string, string> = {
  'business': 'business-center',
  'communication': 'chat',
  'education': 'school',
  'entertainment': 'movie',
  'food & dining': 'restaurant',
  'freelance': 'work-outline',
  'gifts & donations': 'card-giftcard',
  'healthcare': 'local-hospital',
  'housing': 'home',
  'insurance': 'verified-user',
  'investments': 'trending-up',
  'other income': 'payments',
  'personal care': 'self-improvement',
  'rental income': 'home-work',
  'salary': 'payments',
  'shopping': 'shopping-bag',
  'subscriptions': 'subscriptions',
  'transportation': 'directions-bus',
  'utilities': 'receipt',
};

const ICON_ALIASES: Record<string, string> = {
  'apps-outline': 'category',
  'add-circle-outline': 'add-circle-outline',
  'briefcase-outline': 'work-outline',
  'business-outline': 'business-center',
  'call-outline': 'phone',
  'car-outline': 'directions-car',
  'cash-outline': 'payments',
  'chatbubbles-outline': 'chat',
  'film-outline': 'movie',
  'gift-outline': 'card-giftcard',
  'help-circle': 'help-outline',
  'help-circle-outline': 'help-outline',
  'home-outline': 'home',
  'medkit-outline': 'local-hospital',
  'person-outline': 'person',
  'restaurant-outline': 'restaurant',
  'school-outline': 'school',
  'shield-checkmark-outline': 'verified-user',
  'trending-up-outline': 'trending-up',
  'trending-down-outline': 'trending-down',
  'wallet-outline': 'account-balance-wallet',
};

const isValidMaterialIcon = (iconName: string): boolean => Boolean(MATERIAL_GLYPHS?.[iconName]);

const mapCategoryNameToIcon = (categoryName?: string): string => {
  if (!categoryName) return 'category';
  const normalized = categoryName.toLowerCase().trim();

  const exact = CATEGORY_FALLBACK_ICONS[normalized];
  if (exact && isValidMaterialIcon(exact)) {
    return exact;
  }

  const partial = Object.entries(CATEGORY_FALLBACK_ICONS).find(([key]) =>
    normalized.includes(key) || key.includes(normalized)
  );
  if (partial && isValidMaterialIcon(partial[1])) {
    return partial[1];
  }

  return 'category';
};

const resolveCategoryIcon = (iconName?: string, categoryName?: string): string => {
  const normalized = iconName?.toLowerCase().trim().replace(/_/g, '-');

  if (iconName && isValidMaterialIcon(iconName)) {
    return iconName;
  }

  if (normalized && isValidMaterialIcon(normalized)) {
    return normalized;
  }

  if (normalized && ICON_ALIASES[normalized] && isValidMaterialIcon(ICON_ALIASES[normalized])) {
    return ICON_ALIASES[normalized];
  }

  return mapCategoryNameToIcon(categoryName);
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
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [amountError, setAmountError] = useState(false);
  const [categoryError, setCategoryError] = useState(false);

  useEffect(() => {
    if (userId) {
      loadCategories(userId);
    }
  }, [userId, loadCategories]);

  useEffect(() => {
    if (params.type) {
      setType(params.type as TransactionType);
    }
  }, [params.type]);

  const handleSubmit = async () => {
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
          `GH¢${parseFloat(amount).toFixed(2)} saved successfully`
        );
        setTimeout(() => router.back(), 500);
      } else {
        toast.error('Error', error || 'Failed to save transaction');
      }
    } catch (submitError) {
      toast.error('Error', 'An unexpected error occurred');
    }
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const selectedCategory = categories.find((cat) => cat.id === categoryId);
  const isIncome = type === 'income';
  const themeColor = isIncome ? '#047857' : '#DC2626';
  const amountLabel = isIncome ? 'Income amount' : 'Expense amount';
  const topSubtitle = isIncome ? 'Record what came in' : 'Track what went out';

  return (
    <View style={[styles.container, { backgroundColor: themeColor }]}>
      <StatusBar barStyle="light-content" backgroundColor={themeColor} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topSection}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
              <ArrowLeft color={COLORS.white} size={22} />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>{isIncome ? 'Add Income' : 'Add Expense'}</Text>
              <Text style={styles.headerSubtitle}>{topSubtitle}</Text>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.toggleContainer}>
            <View style={styles.togglePill}>
              <TouchableOpacity
                style={[styles.toggleOption, type === 'income' && styles.activeToggle]}
                onPress={() => setType('income')}
                activeOpacity={0.85}
              >
                <Text style={[styles.toggleText, type === 'income' && styles.activeToggleText]}>Income</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleOption, type === 'expense' && styles.activeToggle]}
                onPress={() => setType('expense')}
                activeOpacity={0.85}
              >
                <Text style={[styles.toggleText, type === 'expense' && styles.activeToggleText]}>Expense</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>{amountLabel}</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencyPrefix}>GH¢</Text>
              <TextInput
                style={[styles.amountInput, amountError && styles.amountInputError]}
                value={amount}
                onChangeText={(value) => {
                  setAmount(value.replace(/[^0-9.]/g, ''));
                  setAmountError(false);
                }}
                placeholder="0.00"
                placeholderTextColor="rgba(255,255,255,0.65)"
                keyboardType="numeric"
                autoFocus
              />
            </View>
          </View>
        </View>

        <View style={styles.sheetContainer}>
          <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Transaction Details</Text>
              <Text style={styles.sectionSubtitle}>Choose category, date, and optional note</Text>
            </View>

            <TouchableOpacity
              style={[styles.inputRow, categoryError && styles.inputError]}
              onPress={() => setShowCategoryPicker(true)}
              activeOpacity={0.85}
            >
              <View style={styles.iconCircle}>
                <MaterialIcons
                  name={resolveCategoryIcon(selectedCategory?.icon_name, selectedCategory?.name) as any}
                  size={22}
                  color={themeColor}
                />
              </View>

              <View style={styles.inputTextContainer}>
                <Text style={styles.inputLabel}>Category</Text>
                <Text style={[styles.inputValue, !selectedCategory && styles.placeholderText]}>
                  {selectedCategory?.name || 'Select category'}
                </Text>
              </View>

              <ChevronDown size={18} color={COLORS.gray400} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.inputRow} onPress={() => setShowDatePicker(true)} activeOpacity={0.85}>
              <View style={styles.iconCircle}>
                <CalendarIcon size={20} color={themeColor} />
              </View>

              <View style={styles.inputTextContainer}>
                <Text style={styles.inputLabel}>Date</Text>
                <Text style={styles.inputValue}>
                  {date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              <ChevronDown size={18} color={COLORS.gray400} />
            </TouchableOpacity>

            <View style={styles.noteContainer}>
              <Text style={styles.inputLabel}>Note (Optional)</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="Add context for this transaction"
                placeholderTextColor={COLORS.textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: themeColor }]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.88}
            >
              {isLoading ? (
                <Text style={styles.saveButtonText}>Saving...</Text>
              ) : (
                <>
                  <Save size={18} color={COLORS.white} style={styles.saveIcon} />
                  <Text style={styles.saveButtonText}>Save Transaction</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker value={date} mode="date" display="default" onChange={handleDateChange} />
      )}

      {Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          presentationStyle="overFullScreen"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.dateModalContent}>
              <View style={styles.dateModalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Select Date</Text>
                  <Text style={[styles.dateHeadline, { color: themeColor }]}>
                    {date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                  </Text>
                  <Text style={styles.dateSubheadline}>
                    {date.toLocaleDateString('en-US', { year: 'numeric', weekday: 'long' })}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  style={styles.dateDoneButton}
                  activeOpacity={0.85}
                >
                  <Check size={22} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={date}
                mode="date"
                display="inline"
                onChange={handleDateChange}
                accentColor={themeColor}
                style={styles.inlineDatePicker}
              />
            </View>
          </View>
        </Modal>
      )}

      <Modal visible={showCategoryPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <TouchableOpacity onPress={() => setShowCategoryPicker(false)} activeOpacity={0.8}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.categoryGrid}>
            {categories.map((cat) => {
              const isSelected = categoryId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryGridItem, isSelected && { borderColor: themeColor, backgroundColor: COLORS.primaryLight }]}
                  onPress={() => {
                    setCategoryId(cat.id);
                    setCategoryError(false);
                    setShowCategoryPicker(false);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={[styles.categoryIconLarge, { backgroundColor: isSelected ? themeColor : COLORS.gray100 }]}>
                    <MaterialIcons
                      name={resolveCategoryIcon(cat.icon_name, cat.name) as any}
                      size={30}
                      color={isSelected ? COLORS.white : COLORS.gray600}
                    />
                  </View>
                  <Text style={styles.categoryGridLabel}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.categoryGridItem}
              onPress={() => {
                setShowCategoryPicker(false);
                router.push('/settings/categories/create');
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.categoryIconLarge, { backgroundColor: COLORS.gray50 }]}>
                <MaterialIcons name="add" size={30} color={COLORS.gray400} />
              </View>
              <Text style={styles.categoryGridLabel}>Add New</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
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
  topSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: 'rgba(255,255,255,0.88)',
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  toggleContainer: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  togglePill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.14)',
    borderRadius: 999,
    padding: 4,
  },
  toggleOption: {
    paddingVertical: 9,
    paddingHorizontal: SPACING.xl,
    borderRadius: 999,
  },
  activeToggle: {
    backgroundColor: COLORS.white,
  },
  toggleText: {
    color: 'rgba(255,255,255,0.72)',
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  activeToggleText: {
    color: COLORS.primaryDark,
  },
  amountContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  amountLabel: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  currencyPrefix: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginRight: 6,
    marginBottom: 8,
  },
  amountInput: {
    fontSize: 54,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
    textAlign: 'center',
    minWidth: 200,
    paddingVertical: 0,
  },
  amountInputError: {
    color: '#FFE4E6',
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundContent,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    overflow: 'hidden',
  },
  sheetContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: 130,
  },
  sectionHeader: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    marginTop: 3,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    ...SHADOWS.sm,
  },
  inputTextContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    marginBottom: 3,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  inputValue: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  placeholderText: {
    color: COLORS.textTertiary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  noteContainer: {
    marginTop: SPACING.sm,
  },
  noteInput: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.gray50,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    padding: SPACING.lg,
    minHeight: 110,
    textAlignVertical: 'top',
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  saveButton: {
    height: 54,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  saveIcon: {
    marginRight: SPACING.xs,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  modalCloseText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  categoryGridItem: {
    width: '31%',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 16,
    paddingVertical: SPACING.sm,
    paddingHorizontal: 6,
  },
  categoryIconLarge: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  categoryGridLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  dateModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: SPACING.xl,
  },
  dateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  dateHeadline: {
    marginTop: SPACING.xs,
    fontSize: 30,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  dateSubheadline: {
    marginTop: 2,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textTertiary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  dateDoneButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineDatePicker: {
    height: 320,
  },
});
