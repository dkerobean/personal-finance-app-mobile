import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useTransactionStore } from '@/stores/transactionStore';
import { useCategoryStore } from '@/stores/categoryStore';
import type { TransactionType } from '@/types/models';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/ui/CustomAlert';
import SegmentedControl from '@/components/ui/SegmentedControl';
import GradientHeader from '@/components/budgets/GradientHeader';
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY, SHADOWS, BUDGET } from '@/constants/design';

export default function CreateTransactionScreen() {
  const router = useRouter();
  const { createTransaction, isLoading, error } = useTransactionStore();
  const { categories, loadCategories } = useCategoryStore();
  const { alert, alertProps } = useCustomAlert();

  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [categoryId, setCategoryId] = useState('');
  const now = new Date();
  const [date, setDate] = useState(now);
  const [time, setTime] = useState(now);
  const [tempDate, setTempDate] = useState(now);
  const [tempTime, setTempTime] = useState(now);
  const [description, setDescription] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Form validation errors
  const [amountError, setAmountError] = useState('');
  const [categoryError, setCategoryError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    // Set first available category as default
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const validateForm = () => {
    let isValid = true;
    
    // Validate amount
    const amountValue = parseFloat(amount);
    if (!amount.trim()) {
      setAmountError('Amount is required');
      isValid = false;
    } else if (isNaN(amountValue) || amountValue <= 0) {
      setAmountError('Please enter a valid amount greater than 0');
      isValid = false;
    } else {
      setAmountError('');
    }

    // Validate category
    if (!categoryId) {
      setCategoryError('Please select a category');
      isValid = false;
    } else {
      setCategoryError('');
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Combine date and time into a single datetime
    const combinedDateTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes(),
      time.getSeconds()
    );

    const success = await createTransaction(
      parseFloat(amount),
      type,
      categoryId,
      combinedDateTime.toISOString(), // Full ISO datetime string
      description.trim() || undefined
    );
    
    if (success) {
      alert('Success', 'Transaction created successfully', [{
        text: 'OK',
        onPress: () => router.back()
      }]);
    } else if (error) {
      console.error('Transaction creation error:', error);
      
      // Provide more specific error messages
      let errorMessage = error;
      if (error.includes('permission') || error.includes('RLS')) {
        errorMessage = 'You do not have permission to create transactions. Please check your account settings.';
      } else if (error.includes('connection') || error.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.includes('validation') || error.includes('invalid')) {
        errorMessage = 'Invalid transaction data. Please check your input and try again.';
      } else if (error.includes('database') || error.includes('Database')) {
        errorMessage = 'Database error occurred. Please try again later.';
      }
      
      alert('Error Creating Transaction', errorMessage);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      // Android: Close picker after selection
      setShowDatePicker(false);
      
      // Only update the date if user selected a date (not cancelled)
      if (selectedDate && event.type !== 'dismissed') {
        console.log('Android date change:', selectedDate);
        setDate(selectedDate);
      }
    } else {
      // iOS: Only update the temporary date, don't close picker
      // Picker will be closed manually via Done/Cancel buttons
      if (selectedDate) {
        console.log('iOS temp date change:', selectedDate);
        setTempDate(selectedDate);
      }
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      // Android: Close picker after selection
      setShowTimePicker(false);
      
      // Only update the time if user selected a time (not cancelled)
      if (selectedTime && event.type !== 'dismissed') {
        console.log('Android time change:', selectedTime);
        setTime(selectedTime);
      }
    } else {
      // iOS: Only update the temporary time, don't close picker
      // Picker will be closed manually via Done/Cancel buttons
      if (selectedTime) {
        console.log('iOS temp time change:', selectedTime);
        setTempTime(selectedTime);
      }
    }
  };

  const handleDatePickerOpen = () => {
    console.log('Opening date picker - syncing tempDate with date:', date);
    setTempDate(date);
    setShowDatePicker(true);
  };

  const handleTimePickerOpen = () => {
    console.log('Opening time picker - syncing tempTime with time:', time);
    setTempTime(time);
    setShowTimePicker(true);
  };

  const handleDatePickerDone = () => {
    console.log('Date picker done - updating date from:', date, 'to:', tempDate);
    setDate(new Date(tempDate));
    setShowDatePicker(false);
  };

  const handleTimePickerDone = () => {
    console.log('Time picker done - updating time from:', time, 'to:', tempTime);
    setTime(new Date(tempTime));
    setShowTimePicker(false);
  };

  const handleDatePickerCancel = () => {
    setTempDate(date); // Reset to original value
    setShowDatePicker(false);
  };

  const handleTimePickerCancel = () => {
    setTempTime(time); // Reset to original value
    setShowTimePicker(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const selectedCategory = categories.find(cat => cat.id === categoryId);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Gradient Header Section */}
        <GradientHeader
          title="Add Transaction"
          subtitle="Record your expense or income"
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
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            {/* Amount Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={[styles.mintInput, amountError ? styles.inputError : null]}
                placeholder="00"
                placeholderTextColor={COLORS.textSecondary}
                value={amount}
                onChangeText={(text) => {
                  // Only allow numbers and decimal point
                  const cleanedText = text.replace(/[^0-9.]/g, '');
                  setAmount(cleanedText);
                  if (amountError) setAmountError('');
                }}
                keyboardType="decimal-pad"
                autoCapitalize="none"
              />
              {amountError && (
                <Text style={styles.errorText}>{amountError}</Text>
              )}
            </View>

            {/* Type Selector */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Type</Text>
              <SegmentedControl
                options={[
                  { label: 'Income', value: 'income' },
                  { label: 'Expense', value: 'expense' }
                ]}
                selectedValue={type}
                onValueChange={(value) => setType(value as TransactionType)}
              />
            </View>

            {/* Category Picker */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Category</Text>
              <TouchableOpacity
                style={[styles.categorySelector, categoryError ? styles.inputError : null]}
                onPress={() => setShowCategoryPicker(true)}
              >
                <View style={styles.pickerContent}>
                  {selectedCategory ? (
                    <>
                      <MaterialIcons
                        name={selectedCategory.icon_name as any}
                        size={20}
                        color="#007bff"
                      />
                      <Text style={styles.pickerText}>{selectedCategory.name}</Text>
                    </>
                  ) : (
                    <Text style={styles.pickerPlaceholder}>Select a category</Text>
                  )}
                </View>
                <MaterialIcons name="keyboard-arrow-down" size={24} color="#666" />
              </TouchableOpacity>
              {categoryError && (
                <Text style={styles.errorText}>{categoryError}</Text>
              )}
            </View>

            {/* Date & Time Pickers */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Date & Time</Text>
              <View style={styles.dateTimeContainer}>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={handleDatePickerOpen}
                  activeOpacity={0.7}
                >
                  <View style={styles.dateTimeContent}>
                    <MaterialIcons name="event" size={24} color={COLORS.primary} />
                    <Text style={styles.dateTimeText}>{formatDate(date)}</Text>
                  </View>
                  <MaterialIcons name="keyboard-arrow-down" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={handleTimePickerOpen}
                  activeOpacity={0.7}
                >
                  <View style={styles.dateTimeContent}>
                    <MaterialIcons name="access-time" size={24} color={COLORS.primary} />
                    <Text style={styles.dateTimeText}>{formatTime(time)}</Text>
                  </View>
                  <MaterialIcons name="keyboard-arrow-down" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Description (Optional) */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={styles.mintTextArea}
                placeholder="Enter Message"
                placeholderTextColor={COLORS.primary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={200}
              />
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>

          </ScrollView>
          
          {/* Save Button - Fixed at bottom */}
          <View style={styles.saveButtonContainer}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                (isLoading || !amount.trim() || !categoryId) && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={isLoading || !amount.trim() || !categoryId}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={handleDatePickerCancel}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={handleDatePickerCancel}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View style={styles.dateTimePickerContainer}>
                <View style={styles.dateTimePickerHeader}>
                  <TouchableOpacity onPress={handleDatePickerCancel}>
                    <Text style={styles.dateTimePickerCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.dateTimePickerTitle}>Select Date</Text>
                  <TouchableOpacity onPress={handleDatePickerDone}>
                    <Text style={styles.dateTimePickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                />
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Android Date Picker */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* Time Picker Modal */}
      {showTimePicker && Platform.OS === 'ios' && (
        <Modal
          visible={showTimePicker}
          transparent
          animationType="slide"
          onRequestClose={handleTimePickerCancel}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={handleTimePickerCancel}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View style={styles.dateTimePickerContainer}>
                <View style={styles.dateTimePickerHeader}>
                  <TouchableOpacity onPress={handleTimePickerCancel}>
                    <Text style={styles.dateTimePickerCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.dateTimePickerTitle}>Select Time</Text>
                  <TouchableOpacity onPress={handleTimePickerDone}>
                    <Text style={styles.dateTimePickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={tempTime}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                />
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Android Time Picker */}
      {showTimePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={time}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.categoryList}>
              {categories.length === 0 ? (
                <View style={styles.emptyCategoryContainer}>
                  <Text style={styles.emptyCategoryText}>
                    No categories available.{'\n'}
                    Please create categories in Settings first.
                  </Text>
                  <TouchableOpacity 
                    style={styles.settingsButton}
                    onPress={() => {
                      setShowCategoryPicker(false);
                      router.push('/settings/categories');
                    }}
                  >
                    <Text style={styles.settingsButtonText}>Go to Settings</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryItem,
                      categoryId === category.id && styles.categoryItemSelected
                    ]}
                    onPress={() => {
                      setCategoryId(category.id);
                      setCategoryError('');
                      setShowCategoryPicker(false);
                    }}
                  >
                    <MaterialIcons
                      name={category.icon_name as any}
                      size={24}
                      color="#007bff"
                    />
                    <Text style={styles.categoryName}>{category.name}</Text>
                    {categoryId === category.id && (
                      <MaterialIcons name="check" size={20} color="#007bff" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
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
  scrollView: {
    paddingHorizontal: SPACING.xl,
  },
  form: {
    gap: SPACING.xxl,
    paddingBottom: SPACING.huge,
  },
  formGroup: {
    gap: SPACING.sm,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
    textTransform: 'uppercase',
  },
  mintInput: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
    fontWeight: TYPOGRAPHY.weights.medium,
    minHeight: 41,
  },
  mintTextArea: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
    fontWeight: TYPOGRAPHY.weights.medium,
    minHeight: 166,
    textAlignVertical: 'top',
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
  categorySelector: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 41,
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  pickerText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  pickerPlaceholder: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textTertiary,
    fontFamily: 'Poppins',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  dateTimeButton: {
    flex: 1,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: COLORS.gray900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dateTimeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  dateTimeText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
    fontWeight: TYPOGRAPHY.weights.medium,
    flex: 1,
  },
  saveButtonContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.backgroundContent,
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
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    fontFamily: 'Poppins',
    textTransform: 'uppercase',
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  categoryList: {
    maxHeight: 400,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  categoryItemSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  categoryName: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textPrimary,
    flex: 1,
  },
  emptyCategoryContainer: {
    padding: SPACING.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCategoryText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  settingsButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  settingsButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  dateTimePickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    paddingBottom: 20,
    marginTop: 'auto',
  },
  dateTimePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  dateTimePickerTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
  },
  dateTimePickerCancel: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: 'Poppins',
  },
  dateTimePickerDone: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontFamily: 'Poppins',
  },
});