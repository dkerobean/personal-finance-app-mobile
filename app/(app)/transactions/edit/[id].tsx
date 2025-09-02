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
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { useTransactionStore } from '@/stores/transactionStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { transactionsApi, isSyncedTransaction } from '@/services/api/transactions';
import SyncedTransactionBadge from '@/components/SyncedTransactionBadge';
import CategorySuggestionBadge from '@/components/transactions/CategorySuggestionBadge';
import BulkCategorizeModal from '@/components/features/BulkCategorizeModal';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/ui/CustomAlert';
import SegmentedControl from '@/components/ui/SegmentedControl';
import GradientHeader from '@/components/budgets/GradientHeader';
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY, SHADOWS, BUDGET } from '@/constants/design';
import type { Transaction, TransactionType } from '@/types/models';

export default function EditTransactionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateTransaction, isLoading: updating } = useTransactionStore();
  const { categories, loadCategories } = useCategoryStore();
  const { alert, alertProps } = useCustomAlert();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Form validation errors
  const [amountError, setAmountError] = useState('');
  const [categoryError, setCategoryError] = useState('');

  useEffect(() => {
    if (id) {
      loadTransaction();
    }
    loadCategories();
  }, [id]);

  const loadTransaction = async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await transactionsApi.getById(id);
      
      if (response.error) {
        setError(response.error.message);
      } else if (response.data) {
        const txn = response.data;
        setTransaction(txn);
        
        // Populate form fields
        setAmount(txn.amount.toString());
        setType(txn.type);
        setCategoryId(txn.category_id);
        const transactionDate = new Date(txn.transaction_date);
        setDate(transactionDate);
        setTime(transactionDate);
        setDescription(txn.description || '');
      }
    } catch (error) {
      setError('Failed to load transaction');
      console.error('Error loading transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
    if (!validateForm() || !transaction) return;

    // Combine date and time into a single datetime
    const combinedDateTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes(),
      time.getSeconds()
    );

    const success = await updateTransaction(
      transaction.id,
      parseFloat(amount),
      type,
      categoryId,
      combinedDateTime.toISOString(), // Full ISO datetime string
      description.trim() || undefined
    );
    
    if (success) {
      alert('Success', 'Transaction updated successfully');
      router.back();
    } else {
      alert('Error', 'Failed to update transaction');
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
  const isSync = transaction ? isSyncedTransaction(transaction) : false;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading transaction...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#dc3545" />
          <Text style={styles.errorTitle}>Transaction Not Found</Text>
          <Text style={styles.errorText}>
            {error || 'The transaction you\'re trying to edit could not be found.'}
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Green Header Section */}
      <View style={styles.greenHeader}>
        <TouchableOpacity style={styles.headerBackButton} onPress={handleCancel}>
          <MaterialIcons name="arrow-back" size={24} color="#093030" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Transaction</Text>
      </View>

      {/* Curved White Content Section */}
      <ScrollView style={styles.whiteContent} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {isSync && (
            <View style={styles.syncNotice}>
              <SyncedTransactionBadge accountName={transaction?.account?.account_name} />
              <Text style={styles.syncNoticeText}>
                This transaction was synced from your MTN MoMo account. Only the category can be changed.
              </Text>
            </View>
          )}
          
          <View style={styles.form}>
            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, amountError ? styles.inputError : null, isSync && styles.disabledInput]}
                  placeholder="0"
                  placeholderTextColor="#999"
                  value={amount}
                  onChangeText={(text) => {
                    if (isSync) return; // Prevent editing for synced transactions
                    // Only allow numbers and decimal point
                    const cleanedText = text.replace(/[^0-9.]/g, '');
                    setAmount(cleanedText);
                    if (amountError) setAmountError('');
                  }}
                  keyboardType="decimal-pad"
                  autoCapitalize="none"
                  editable={!isSync}
                />
              </View>
              {amountError && (
                <Text style={styles.errorText}>{amountError}</Text>
              )}
            </View>

            {/* Type Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type</Text>
              <View style={[isSync && styles.disabledControl]}>
                <SegmentedControl
                  options={[
                    { label: 'Income', value: 'income' },
                    { label: 'Expense', value: 'expense' }
                  ]}
                  selectedValue={type}
                  onValueChange={(value) => !isSync && setType(value as TransactionType)}
                />
                {isSync && (
                  <Text style={styles.disabledText}>Type cannot be changed for synced transactions</Text>
                )}
              </View>
            </View>

            {/* Category Picker */}
            <View style={styles.inputGroup}>
              <View style={styles.categoryHeader}>
                <Text style={styles.label}>Category</Text>
                {transaction && (
                  <CategorySuggestionBadge 
                    isAutoCategorized={transaction.auto_categorized || false}
                    confidence={transaction.categorization_confidence ? transaction.categorization_confidence * 100 : 0}
                    size="small"
                    showConfidence={transaction.auto_categorized}
                  />
                )}
              </View>
              
              {transaction?.auto_categorized && (
                <View style={styles.categorizationInfo}>
                  <MaterialIcons name="info-outline" size={16} color="#6366f1" />
                  <Text style={styles.categorizationText}>
                    This category was automatically suggested based on the transaction details. 
                    Confidence: {transaction.categorization_confidence ? Math.round(transaction.categorization_confidence * 100) : 0}%
                  </Text>
                </View>
              )}
              
              <TouchableOpacity
                style={[styles.input, categoryError ? styles.inputError : null]}
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
              
              {/* Categorization Actions */}
              {transaction && (
                <View style={styles.categorizationActions}>
                  {transaction.auto_categorized && (
                    <TouchableOpacity
                      style={styles.feedbackButton}
                      onPress={() => setShowFeedbackModal(true)}
                    >
                      <MaterialIcons name="feedback" size={16} color="#6366f1" />
                      <Text style={styles.feedbackButtonText}>Improve Categorization</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.bulkButton}
                    onPress={() => setShowBulkModal(true)}
                  >
                    <MaterialIcons name="layers" size={16} color="#059669" />
                    <Text style={styles.bulkButtonText}>Categorize Similar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Date & Time Pickers */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date & Time</Text>
              <View style={styles.dateTimeContainer}>
                <TouchableOpacity
                  style={[styles.dateTimeButton, isSync && styles.disabledInput]}
                  onPress={() => !isSync && handleDatePickerOpen()}
                  disabled={isSync}
                  activeOpacity={0.7}
                >
                  <View style={styles.dateTimeContent}>
                    <MaterialIcons name="event" size={24} color={COLORS.primary} />
                    <Text style={styles.dateTimeText}>{formatDate(date)}</Text>
                  </View>
                  <MaterialIcons name="keyboard-arrow-down" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dateTimeButton, isSync && styles.disabledInput]}
                  onPress={() => !isSync && handleTimePickerOpen()}
                  disabled={isSync}
                  activeOpacity={0.7}
                >
                  <View style={styles.dateTimeContent}>
                    <MaterialIcons name="access-time" size={24} color={COLORS.primary} />
                    <Text style={styles.dateTimeText}>{formatTime(time)}</Text>
                  </View>
                  <MaterialIcons name="keyboard-arrow-down" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              {isSync && (
                <Text style={styles.disabledText}>Date and time cannot be changed for synced transactions</Text>
              )}
            </View>

            {/* Description (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.textAreaInput, isSync && styles.disabledInput]}
                placeholder={isSync ? "Description cannot be edited for synced transactions" : "Add a note about this transaction"}
                placeholderTextColor="#999"
                value={description}
                onChangeText={(text) => !isSync && setDescription(text)}
                multiline
                numberOfLines={4}
                maxLength={200}
                editable={!isSync}
              />
            </View>
          </View>

          {/* Update Button */}
          <TouchableOpacity
            style={[
              styles.updateButton,
              (updating || !amount.trim() || !categoryId) && styles.buttonDisabled
            ]}
            onPress={handleSubmit}
            disabled={updating || !amount.trim() || !categoryId}
          >
            <Text style={styles.updateButtonText}>
              {updating ? 'Updating...' : 'Update Transaction'}
            </Text>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={updating}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
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
          onRequestClose={() => setShowTimePicker(false)}
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
              {categories.map((category) => (
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
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bulk Categorization Modal */}
      {transaction && (
        <BulkCategorizeModal
          visible={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          referenceTransaction={transaction}
        />
      )}

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.feedbackModalContainer}>
          <View style={styles.feedbackModalHeader}>
            <TouchableOpacity onPress={() => setShowFeedbackModal(false)}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.feedbackModalTitle}>Improve Categorization</Text>
            <TouchableOpacity
              onPress={() => {
                setShowFeedbackModal(false);
                alert('Thank you!', 'Your feedback helps improve our categorization system.');
              }}
            >
              <Text style={styles.feedbackSubmitText}>Submit</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.feedbackModalContent}>
            <Text style={styles.feedbackQuestion}>
              Why was this transaction incorrectly categorized?
            </Text>
            
            <View style={styles.feedbackOptions}>
              <TouchableOpacity style={styles.feedbackOption}>
                <MaterialIcons name="radio-button-unchecked" size={20} color="#666" />
                <Text style={styles.feedbackOptionText}>Wrong merchant recognition</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.feedbackOption}>
                <MaterialIcons name="radio-button-unchecked" size={20} color="#666" />
                <Text style={styles.feedbackOptionText}>Amount-based categorization error</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.feedbackOption}>
                <MaterialIcons name="radio-button-unchecked" size={20} color="#666" />
                <Text style={styles.feedbackOptionText}>Description keywords not recognized</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.feedbackOption}>
                <MaterialIcons name="radio-button-unchecked" size={20} color="#666" />
                <Text style={styles.feedbackOptionText}>Personal preference (this is correct category for me)</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.feedbackNote}>
              Your feedback helps our AI learn better categorization patterns for future transactions.
            </Text>
          </ScrollView>
        </View>
      </Modal>
      
      <CustomAlert {...alertProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00D09E',
  },
  greenHeader: {
    paddingTop: 68,
    paddingBottom: 40,
    paddingHorizontal: 37,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#093030',
    fontFamily: 'Poppins',
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // Account for back button width
  },
  whiteContent: {
    flex: 1,
    backgroundColor: '#F1FFF3',
    borderTopLeftRadius: 70,
    borderTopRightRadius: 70,
  },
  contentContainer: {
    paddingTop: 40,
    paddingHorizontal: 37,
    paddingBottom: 40,
  },
  syncNotice: {
    backgroundColor: '#fff3e0',
    borderColor: '#ff6b00',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  syncNoticeText: {
    fontSize: 14,
    color: '#cc5500',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  backButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#093030',
    fontFamily: 'Poppins',
    marginBottom: 8,
    marginLeft: 16,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#DFF7E2',
    borderRadius: 18,
    paddingHorizontal: 34,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Poppins',
    color: '#093030',
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textAreaInput: {
    backgroundColor: '#DFF7E2',
    borderRadius: 18,
    paddingHorizontal: 34,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Poppins',
    color: '#093030',
    borderWidth: 0,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  datePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    color: '#093030',
    fontFamily: 'Poppins',
    flex: 1,
    marginLeft: 12,
  },
  inputError: {
    borderColor: '#ef4444',
    borderWidth: 1,
  },
  disabledInput: {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
    opacity: 0.7,
  },
  disabledControl: {
    opacity: 0.5,
    pointerEvents: 'none',
  },
  disabledText: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'Poppins',
    fontStyle: 'italic',
    marginTop: 4,
    marginLeft: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontFamily: 'Poppins',
    marginTop: 4,
    marginLeft: 16,
  },
  categorySelector: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 60,
  },
  dateTimeButton: {
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
  updateButton: {
    backgroundColor: '#00D09E',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#00D09E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  updateButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#093030',
    fontFamily: 'Poppins',
  },
  cancelButton: {
    backgroundColor: '#DFF7E2',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  cancelButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0E3E3E',
    fontFamily: 'Poppins',
  },
  buttonDisabled: {
    opacity: 0.6,
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
    borderBottomColor: COLORS.gray100,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
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
    fontFamily: 'Poppins',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categorizationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
  },
  categorizationText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    flex: 1,
  },
  categorizationActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  feedbackButtonText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
  bulkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#059669',
  },
  bulkButtonText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  feedbackModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  feedbackModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  feedbackModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  feedbackSubmitText: {
    color: '#007bff',
    fontWeight: '600',
    fontSize: 16,
  },
  feedbackModalContent: {
    flex: 1,
    padding: 16,
  },
  feedbackQuestion: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 20,
  },
  feedbackOptions: {
    gap: 16,
    marginBottom: 24,
  },
  feedbackOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  feedbackOptionText: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
  },
  feedbackNote: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    fontStyle: 'italic',
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
  dateTimeContainer: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
});