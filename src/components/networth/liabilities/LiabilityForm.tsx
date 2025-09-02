import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/design';
import type { Liability, LiabilityCategory, LiabilityType, CreateLiabilityRequest, UpdateLiabilityRequest } from '@/types/models';
import { validateLiability } from '@/lib/validators';

interface LiabilityFormProps {
  initialData?: Liability;
  onSave: (data: CreateLiabilityRequest | UpdateLiabilityRequest) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

const LIABILITY_CATEGORIES: { key: LiabilityCategory; label: string; types: LiabilityType[] }[] = [
  {
    key: 'loans',
    label: 'Loans',
    types: ['personal_loan', 'auto_loan', 'student_loan']
  },
  {
    key: 'credit_cards',
    label: 'Credit Cards',
    types: ['credit_card']
  },
  {
    key: 'mortgages',
    label: 'Mortgages',
    types: ['mortgage']
  },
  {
    key: 'business_debt',
    label: 'Business Debt',
    types: ['business_loan']
  },
  {
    key: 'other',
    label: 'Other Debts',
    types: ['other']
  },
];

export default function LiabilityForm({
  initialData,
  onSave,
  onCancel,
  onDelete,
  isLoading = false,
  mode,
}: LiabilityFormProps): React.ReactElement {
  
  // Form state
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState<LiabilityCategory>(initialData?.category || 'loans');
  const [liabilityType, setLiabilityType] = useState<LiabilityType>(initialData?.liability_type || 'personal_loan');
  const [currentBalance, setCurrentBalance] = useState(initialData?.current_balance?.toString() || '');
  const [originalBalance, setOriginalBalance] = useState(initialData?.original_balance?.toString() || '');
  const [interestRate, setInterestRate] = useState(initialData?.interest_rate?.toString() || '');
  const [monthlyPayment, setMonthlyPayment] = useState(initialData?.monthly_payment?.toString() || '');
  const [dueDate, setDueDate] = useState<Date | null>(
    initialData?.due_date ? new Date(initialData.due_date) : null
  );
  const [description, setDescription] = useState(initialData?.description || '');
  
  // UI state
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update liability types when category changes
  useEffect(() => {
    const categoryData = LIABILITY_CATEGORIES.find(cat => cat.key === category);
    if (categoryData && !categoryData.types.includes(liabilityType)) {
      setLiabilityType(categoryData.types[0]);
    }
  }, [category, liabilityType]);

  const getLiabilityTypeLabel = (type: LiabilityType): string => {
    const labels: Record<LiabilityType, string> = {
      mortgage: 'Mortgage',
      auto_loan: 'Auto Loan',
      personal_loan: 'Personal Loan',
      credit_card: 'Credit Card',
      student_loan: 'Student Loan',
      business_loan: 'Business Loan',
      other: 'Other',
    };
    return labels[type] || type;
  };

  const validateForm = (): boolean => {
    const validation = validateLiability({
      name: name.trim(),
      category,
      liability_type: liabilityType,
      current_balance: parseFloat(currentBalance) || 0,
      original_balance: originalBalance ? parseFloat(originalBalance) : undefined,
      interest_rate: interestRate ? parseFloat(interestRate) : undefined,
      monthly_payment: monthlyPayment ? parseFloat(monthlyPayment) : undefined,
      due_date: dueDate?.toISOString().split('T')[0],
      description: description.trim() || undefined,
    });

    if (!validation.isValid) {
      // Convert error array to error object
      const errorObj: Record<string, string> = {};
      validation.errors.forEach((error, index) => {
        errorObj[`error_${index}`] = error;
      });
      setErrors(errorObj);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const formData = {
      name: name.trim(),
      category,
      liability_type: liabilityType,
      current_balance: parseFloat(currentBalance),
      original_balance: originalBalance ? parseFloat(originalBalance) : undefined,
      interest_rate: interestRate ? parseFloat(interestRate) : undefined,
      monthly_payment: monthlyPayment ? parseFloat(monthlyPayment) : undefined,
      due_date: dueDate?.toISOString().split('T')[0],
      description: description.trim() || undefined,
    };

    onSave(formData);
  };

  const formatCurrency = (value: string): string => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return `${parts[0]}.${parts[1].slice(0, 2)}`;
    }
    return numericValue;
  };

  const formatPercentage = (value: string): string => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return `${parts[0]}.${parts[1].slice(0, 2)}`;
    }
    return numericValue;
  };

  const currentCategory = LIABILITY_CATEGORIES.find(cat => cat.key === category);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Liability Name */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Debt Name*</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Chase Credit Card, Car Loan"
          placeholderTextColor={COLORS.textTertiary}
          editable={!isLoading}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      {/* Category Selection */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Category*</Text>
        <TouchableOpacity
          style={[styles.picker, errors.category && styles.inputError]}
          onPress={() => setShowCategoryPicker(true)}
          disabled={isLoading}
        >
          <Text style={styles.pickerText}>{currentCategory?.label || 'Select Category'}</Text>
          <MaterialIcons name="arrow-drop-down" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
      </View>

      {/* Liability Type Selection */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Debt Type*</Text>
        <TouchableOpacity
          style={[styles.picker, errors.liability_type && styles.inputError]}
          onPress={() => setShowTypePicker(true)}
          disabled={isLoading}
        >
          <Text style={styles.pickerText}>{getLiabilityTypeLabel(liabilityType)}</Text>
          <MaterialIcons name="arrow-drop-down" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        {errors.liability_type && <Text style={styles.errorText}>{errors.liability_type}</Text>}
      </View>

      {/* Current Balance */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Current Balance*</Text>
        <View style={styles.currencyInputContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={[styles.currencyInput, errors.current_balance && styles.inputError]}
            value={currentBalance}
            onChangeText={(value) => setCurrentBalance(formatCurrency(value))}
            placeholder="0.00"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="decimal-pad"
            editable={!isLoading}
          />
        </View>
        {errors.current_balance && <Text style={styles.errorText}>{errors.current_balance}</Text>}
      </View>

      {/* Original Balance (Optional) */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Original Balance (Optional)</Text>
        <View style={styles.currencyInputContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={[styles.currencyInput, errors.original_balance && styles.inputError]}
            value={originalBalance}
            onChangeText={(value) => setOriginalBalance(formatCurrency(value))}
            placeholder="0.00"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="decimal-pad"
            editable={!isLoading}
          />
        </View>
        {errors.original_balance && <Text style={styles.errorText}>{errors.original_balance}</Text>}
      </View>

      {/* Interest Rate (Optional) */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Interest Rate (Optional)</Text>
        <View style={styles.currencyInputContainer}>
          <TextInput
            style={[styles.currencyInput, errors.interest_rate && styles.inputError]}
            value={interestRate}
            onChangeText={(value) => setInterestRate(formatPercentage(value))}
            placeholder="0.00"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="decimal-pad"
            editable={!isLoading}
          />
          <Text style={styles.percentageSymbol}>% APR</Text>
        </View>
        <Text style={styles.fieldHint}>Annual Percentage Rate</Text>
        {errors.interest_rate && <Text style={styles.errorText}>{errors.interest_rate}</Text>}
      </View>

      {/* Monthly Payment (Optional) */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Monthly Payment (Optional)</Text>
        <View style={styles.currencyInputContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={[styles.currencyInput, errors.monthly_payment && styles.inputError]}
            value={monthlyPayment}
            onChangeText={(value) => setMonthlyPayment(formatCurrency(value))}
            placeholder="0.00"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="decimal-pad"
            editable={!isLoading}
          />
        </View>
        <Text style={styles.fieldHint}>Minimum monthly payment amount</Text>
        {errors.monthly_payment && <Text style={styles.errorText}>{errors.monthly_payment}</Text>}
      </View>

      {/* Due Date (Optional) */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Next Payment Due (Optional)</Text>
        <TouchableOpacity
          style={[styles.picker, errors.due_date && styles.inputError]}
          onPress={() => setShowDatePicker(true)}
          disabled={isLoading}
        >
          <Text style={styles.pickerText}>
            {dueDate ? dueDate.toLocaleDateString() : 'Select Date'}
          </Text>
          <MaterialIcons name="event" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        {dueDate && (
          <TouchableOpacity
            style={styles.clearDateButton}
            onPress={() => setDueDate(null)}
          >
            <Text style={styles.clearDateText}>Clear Date</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.fieldHint}>When is your next payment due?</Text>
        {errors.due_date && <Text style={styles.errorText}>{errors.due_date}</Text>}
      </View>

      {/* Description (Optional) */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={[styles.textArea, errors.description && styles.inputError]}
          value={description}
          onChangeText={setDescription}
          placeholder="Additional notes about this debt..."
          placeholderTextColor={COLORS.textTertiary}
          multiline
          numberOfLines={3}
          editable={!isLoading}
        />
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {mode === 'edit' && onDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={onDelete}
            disabled={isLoading}
          >
            <MaterialIcons name="delete-outline" size={24} color={COLORS.white} />
            <Text style={styles.deleteButtonText}>Delete Debt</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {mode === 'create' ? 'Add Debt' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Picker Modal */}
      {showCategoryPicker && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.optionsList}>
              {LIABILITY_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.optionItem,
                    category === cat.key && styles.optionItemSelected
                  ]}
                  onPress={() => {
                    setCategory(cat.key);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    category === cat.key && styles.optionTextSelected
                  ]}>
                    {cat.label}
                  </Text>
                  {category === cat.key && (
                    <MaterialIcons name="check" size={24} color={COLORS.error} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Liability Type Picker Modal */}
      {showTypePicker && currentCategory && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Debt Type</Text>
              <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.optionsList}>
              {currentCategory.types.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.optionItem,
                    liabilityType === type && styles.optionItemSelected
                  ]}
                  onPress={() => {
                    setLiabilityType(type);
                    setShowTypePicker(false);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    liabilityType === type && styles.optionTextSelected
                  ]}>
                    {getLiabilityTypeLabel(type)}
                  </Text>
                  {liabilityType === type && (
                    <MaterialIcons name="check" size={24} color={COLORS.error} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDueDate(selectedDate);
            }
          }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.backgroundInput,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
  },
  inputError: {
    borderColor: COLORS.error,
  },
  textArea: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.backgroundInput,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  picker: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.backgroundInput,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
  },
  currencyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.backgroundInput,
    borderRadius: 12,
  },
  currencySymbol: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: 'Poppins',
    paddingLeft: SPACING.md,
  },
  percentageSymbol: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: 'Poppins',
    paddingRight: SPACING.md,
  },
  currencyInput: {
    flex: 1,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
  },
  fieldHint: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    fontFamily: 'Poppins',
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  clearDateButton: {
    marginTop: SPACING.xs,
  },
  clearDateText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.error,
    fontFamily: 'Poppins',
  },
  errorText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.error,
    fontFamily: 'Poppins',
    marginTop: SPACING.xs,
  },
  buttonContainer: {
    marginTop: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  deleteButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontFamily: 'Poppins',
    marginLeft: SPACING.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.backgroundInput,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontFamily: 'Poppins',
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.error, // Red for debt actions
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontFamily: 'Poppins',
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '90%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.backgroundInput,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.backgroundInput,
  },
  optionItemSelected: {
    backgroundColor: '#fef2f2', // Light red background for debt
  },
  optionText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
  },
  optionTextSelected: {
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});