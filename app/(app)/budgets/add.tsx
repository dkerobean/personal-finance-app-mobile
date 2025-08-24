import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import CategorySelector from '@/components/CategorySelector';
import { Category, CreateBudgetRequest } from '@/types/models';
import { useBudgetStore } from '@/stores/budgetStore';
import { useCategoryStore } from '@/stores/categoryStore';

export default function AddBudgetScreen(): React.ReactElement {
  const { createBudget, isLoading, error, clearError } = useBudgetStore();
  const { categories, loadCategories, isLoading: categoriesLoading, error: categoriesError } = useCategoryStore();
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [month, setMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [amountError, setAmountError] = useState<string>('');
  const [categoryError, setCategoryError] = useState<string>('');

  // Show all categories (both user-specific and default/shared categories)
  const availableCategories = categories;

  useEffect(() => {
    const loadData = async () => {
      console.log('AddBudget: Loading categories...');
      await loadCategories();
      clearError();
      console.log('AddBudget: Categories loaded:', categories.length);
    };
    
    loadData();
  }, []);
  
  // Debug: Log categories when they change
  useEffect(() => {
    console.log('AddBudget: Categories updated:', {
      count: categories.length,
      availableCount: availableCategories.length,
      categoriesLoading,
      categories: categories.map(c => ({ id: c.id, name: c.name, user_id: c.user_id }))
    });
  }, [categories, categoriesLoading]);

  const validateForm = (): boolean => {
    let isValid = true;

    // Validate category selection
    if (!selectedCategoryId) {
      setCategoryError('Please select a category');
      isValid = false;
    } else {
      setCategoryError('');
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (!amount.trim()) {
      setAmountError('Amount is required');
      isValid = false;
    } else if (isNaN(amountNum) || amountNum <= 0) {
      setAmountError('Amount must be a positive number');
      isValid = false;
    } else if (amountNum > 1000000) {
      setAmountError('Amount cannot exceed ₵1,000,000');
      isValid = false;
    } else {
      setAmountError('');
    }

    return isValid;
  };

  const handleCreate = async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }

    const monthString = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-01`;
    
    const request: CreateBudgetRequest = {
      category_id: selectedCategoryId,
      amount: parseFloat(amount),
      month: monthString,
    };

    const success = await createBudget(request);
    
    if (success) {
      Alert.alert('Success', 'Budget created successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    }
  };

  const handleCancel = (): void => {
    router.back();
  };

  const handleDateChange = (event: any, selectedDate?: Date): void => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Set to first day of the selected month
      const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      setMonth(firstDay);
    }
  };

  const formatCurrency = (value: string): string => {
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    return numericValue;
  };


  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Budget</Text>
        <TouchableOpacity 
          style={[styles.createButton, isLoading && styles.createButtonDisabled]} 
          onPress={handleCreate}
          disabled={isLoading}
        >
          <Text style={styles.createButtonText}>
            {isLoading ? 'Creating...' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Category *</Text>
          <CategorySelector
            categories={availableCategories}
            selectedCategoryId={selectedCategoryId}
            onSelect={(categoryId) => {
              setSelectedCategoryId(categoryId);
              setCategoryError('');
              console.log('AddBudget: Category selected:', categoryId);
            }}
            placeholder={
              categoriesLoading 
                ? "Loading categories..." 
                : availableCategories.length === 0 
                ? "No categories available" 
                : "Select a category..."
            }
            error={!!categoryError}
            disabled={categoriesLoading}
          />
          
          {/* Loading state */}
          {categoriesLoading && (
            <View style={styles.loadingContainer}>
              <MaterialIcons name="hourglass-empty" size={16} color="#6b7280" />
              <Text style={styles.loadingText}>Loading categories...</Text>
            </View>
          )}
          
          {/* Categories error */}
          {categoriesError && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={16} color="#dc3545" />
              <Text style={styles.errorText}>{categoriesError}</Text>
            </View>
          )}
          
          {/* Form validation error */}
          {categoryError && (
            <Text style={styles.errorText}>{categoryError}</Text>
          )}
          
          {/* Debug info */}
          {!categoriesLoading && availableCategories.length === 0 && !categoriesError && (
            <Text style={styles.debugText}>
              Debug: No categories found. Available count: {categories.length}
            </Text>
          )}
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Monthly Budget Amount *</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>₵</Text>
            <TextInput
              style={[styles.amountInput, amountError && styles.inputError]}
              value={amount}
              onChangeText={(text) => {
                const formatted = formatCurrency(text);
                setAmount(formatted);
                setAmountError('');
              }}
              placeholder="0.00"
              keyboardType="decimal-pad"
              autoCapitalize="none"
            />
          </View>
          {amountError && (
            <Text style={styles.errorText}>{amountError}</Text>
          )}
        </View>

        {/* Month Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Budget Month</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {month.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </Text>
            <MaterialIcons name="calendar-today" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={20} color="#dc3545" />
            <Text style={styles.errorMessage}>{error}</Text>
          </View>
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <MaterialIcons name="info-outline" size={20} color="#3b82f6" />
          <Text style={styles.infoText}>
            Set a monthly spending limit for this category. You'll be notified when you approach or exceed this limit.
          </Text>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={month}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  cancelButton: {
    padding: 8,
  },
  createButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 18,
    color: '#111827',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#111827',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorMessage: {
    color: '#dc3545',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    color: '#3b82f6',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  bottomSpacing: {
    height: 50,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  debugText: {
    fontSize: 12,
    color: '#f59e0b',
    marginTop: 8,
    fontStyle: 'italic',
  },
});