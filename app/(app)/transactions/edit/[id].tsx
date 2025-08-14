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
  Alert,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { useTransactionStore } from '@/stores/transactionStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { transactionsApi } from '@/services/api/transactions';
import type { Transaction, TransactionType } from '@/types/models';

export default function EditTransactionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateTransaction, isLoading: updating } = useTransactionStore();
  const { categories, loadCategories } = useCategoryStore();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

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
        setDate(new Date(txn.transaction_date));
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

    const success = await updateTransaction(
      transaction.id,
      parseFloat(amount),
      type,
      categoryId,
      date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      description.trim() || undefined
    );
    
    if (success) {
      Alert.alert('Success', 'Transaction updated successfully');
      router.back();
    } else {
      Alert.alert('Error', 'Failed to update transaction');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const selectedCategory = categories.find(cat => cat.id === categoryId);

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
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.form}>
            {/* Amount Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={[styles.input, amountError ? styles.inputError : null]}
                placeholder="0.00"
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
              <View style={styles.segmentedControl}>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    styles.leftSegment,
                    type === 'income' && styles.segmentButtonActive
                  ]}
                  onPress={() => setType('income')}
                >
                  <Text style={[
                    styles.segmentText,
                    type === 'income' && styles.segmentTextActive
                  ]}>
                    Income
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    styles.rightSegment,
                    type === 'expense' && styles.segmentButtonActive
                  ]}
                  onPress={() => setType('expense')}
                >
                  <Text style={[
                    styles.segmentText,
                    type === 'expense' && styles.segmentTextActive
                  ]}>
                    Expense
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Category Picker */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Category</Text>
              <TouchableOpacity
                style={[styles.pickerButton, categoryError ? styles.inputError : null]}
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

            {/* Date Picker */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <View style={styles.pickerContent}>
                  <MaterialIcons name="event" size={20} color="#007bff" />
                  <Text style={styles.pickerText}>{formatDate(date)}</Text>
                </View>
                <MaterialIcons name="keyboard-arrow-down" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Description (Optional) */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add a note about this transaction"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                (updating || !amount.trim() || !categoryId) && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={updating || !amount.trim() || !categoryId}
            >
              <Text style={styles.primaryButtonText}>
                {updating ? 'Updating...' : 'Update Transaction'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleCancel}
              disabled={updating}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
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
  errorText: {
    fontSize: 14,
    color: '#dc3545',
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
    gap: 24,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  leftSegment: {
    borderRightWidth: 0.5,
    borderRightColor: '#d1d5db',
  },
  rightSegment: {
    borderLeftWidth: 0.5,
    borderLeftColor: '#d1d5db',
  },
  segmentButtonActive: {
    backgroundColor: '#007bff',
  },
  segmentText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  segmentTextActive: {
    color: '#fff',
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerText: {
    fontSize: 16,
    color: '#374151',
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 48,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007bff',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  categoryList: {
    maxHeight: 400,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  categoryItemSelected: {
    backgroundColor: '#eff6ff',
  },
  categoryName: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
});