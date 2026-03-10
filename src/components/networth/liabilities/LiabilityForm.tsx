import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/design';
import {
  LIABILITY_CATEGORY_OPTIONS,
  getLiabilityTypeLabel,
  getLiabilityTypeOptions,
} from '@/lib/netWorthCatalog';
import type {
  CreateLiabilityRequest,
  Liability,
  LiabilityCategory,
  LiabilityType,
  UpdateLiabilityRequest,
} from '@/types/models';

const CURRENCY_PREFIX = 'GH¢';
const CUSTOM_CATEGORY_REGEX = /\[\[custom_category:(.*?)\]\]/i;
const CUSTOM_TYPE_REGEX = /\[\[custom_type:(.*?)\]\]/i;

interface LiabilityFormProps {
  initialData?: Liability;
  onSave: (data: CreateLiabilityRequest | UpdateLiabilityRequest) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

const sanitizeCustomValue = (value: string): string => value.replace(/\]\]/g, '').trim();

const extractCustomMeta = (rawDescription?: string): {
  cleanDescription: string;
  customCategory: string;
  customType: string;
} => {
  if (!rawDescription) {
    return { cleanDescription: '', customCategory: '', customType: '' };
  }

  const customCategory = rawDescription.match(CUSTOM_CATEGORY_REGEX)?.[1]?.trim() || '';
  const customType = rawDescription.match(CUSTOM_TYPE_REGEX)?.[1]?.trim() || '';

  const cleanDescription = rawDescription
    .replace(/\[\[custom_category:.*?\]\]/gi, '')
    .replace(/\[\[custom_type:.*?\]\]/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { cleanDescription, customCategory, customType };
};

const normaliseNumberInput = (value: string): string => {
  const numericValue = value.replace(/[^0-9.]/g, '');
  const parts = numericValue.split('.');
  if (parts.length > 2) {
    return `${parts[0]}.${parts[1].slice(0, 4)}`;
  }
  return numericValue;
};

const formatDateValue = (date?: string): Date | null => (date ? new Date(date) : null);

export default function LiabilityForm({
  initialData,
  onSave,
  onCancel,
  onDelete,
  isLoading = false,
  mode,
}: LiabilityFormProps): React.ReactElement {
  const parsedMeta = useMemo(() => extractCustomMeta(initialData?.description), [initialData?.description]);

  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState<LiabilityCategory>(initialData?.category || 'loans');
  const [liabilityType, setLiabilityType] = useState<LiabilityType>(initialData?.liability_type || 'personal_loan');
  const [currentBalance, setCurrentBalance] = useState(initialData?.current_balance?.toString() || '');
  const [originalBalance, setOriginalBalance] = useState(initialData?.original_balance?.toString() || '');
  const [interestRate, setInterestRate] = useState(initialData?.interest_rate?.toString() || '');
  const [monthlyPayment, setMonthlyPayment] = useState(initialData?.monthly_payment?.toString() || '');
  const [dueDate, setDueDate] = useState<Date | null>(formatDateValue(initialData?.due_date));
  const [description, setDescription] = useState(parsedMeta.cleanDescription);
  const [customCategoryName, setCustomCategoryName] = useState(initialData?.custom_category || parsedMeta.customCategory);
  const [customLiabilityTypeName, setCustomLiabilityTypeName] = useState(initialData?.custom_type || parsedMeta.customType);

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentCategory = useMemo(
    () => LIABILITY_CATEGORY_OPTIONS.find((option) => option.key === category),
    [category]
  );
  const liabilityTypeOptions = useMemo(() => getLiabilityTypeOptions(category), [category]);

  useEffect(() => {
    if (!liabilityTypeOptions.some((option) => option.key === liabilityType)) {
      setLiabilityType(liabilityTypeOptions[0]?.key || 'other');
    }
  }, [liabilityTypeOptions, liabilityType]);

  const categoryDisplayLabel =
    category === 'other' && customCategoryName.trim()
      ? `Other • ${customCategoryName.trim()}`
      : currentCategory?.label || 'Select Category';
  const liabilityTypeDisplayLabel =
    liabilityType === 'other' && customLiabilityTypeName.trim()
      ? `Custom • ${customLiabilityTypeName.trim()}`
      : getLiabilityTypeLabel(liabilityType);

  const validateForm = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) nextErrors.name = 'Debt name is required';
    if (!currentBalance || Number(currentBalance) <= 0) nextErrors.current_balance = 'Enter the balance owed';
    if (originalBalance && Number(originalBalance) < 0) nextErrors.original_balance = 'Original balance cannot be negative';
    if (interestRate && (Number(interestRate) < 0 || Number(interestRate) > 100)) nextErrors.interest_rate = 'APR must be between 0 and 100';
    if (monthlyPayment && Number(monthlyPayment) < 0) nextErrors.monthly_payment = 'Monthly payment cannot be negative';
    if (category === 'other' && !customCategoryName.trim()) nextErrors.custom_category = 'Add your custom category';
    if (liabilityType === 'other' && !customLiabilityTypeName.trim()) nextErrors.custom_type = 'Add your custom debt type';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSave = (): void => {
    if (!validateForm()) {
      return;
    }

    const payload: CreateLiabilityRequest | UpdateLiabilityRequest = {
      name: name.trim(),
      category,
      liability_type: liabilityType,
      custom_category: category === 'other' ? sanitizeCustomValue(customCategoryName) : undefined,
      custom_type: liabilityType === 'other' ? sanitizeCustomValue(customLiabilityTypeName) : undefined,
      current_balance: Number(currentBalance),
      original_balance: originalBalance ? Number(originalBalance) : undefined,
      interest_rate: interestRate ? Number(interestRate) : undefined,
      monthly_payment: monthlyPayment ? Number(monthlyPayment) : undefined,
      due_date: dueDate ? dueDate.toISOString().split('T')[0] : undefined,
      description: description.trim() || undefined,
    };

    onSave(payload);
  };

  const renderDatePicker = () => {
    if (!showDatePicker) {
      return null;
    }

    const value = dueDate || new Date();

    const handleChange = (_event: unknown, selectedDate?: Date) => {
      if (Platform.OS !== 'ios') {
        setShowDatePicker(false);
      }

      if (selectedDate) {
        setDueDate(selectedDate);
      }
    };

    if (Platform.OS === 'ios') {
      return (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Due Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={value}
              mode="date"
              display="spinner"
              onChange={handleChange}
              style={styles.iosDatePicker}
            />
          </View>
        </View>
      );
    }

    return <DateTimePicker value={value} mode="date" display="default" onChange={handleChange} />;
  };

  const balanceChange = currentBalance && originalBalance ? Number(originalBalance) - Number(currentBalance) : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Debt Name*</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Brokerage Margin, Car Loan"
          placeholderTextColor={COLORS.textTertiary}
          editable={!isLoading}
        />
        {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Category*</Text>
        <TouchableOpacity
          style={[styles.picker, errors.category && styles.inputError]}
          onPress={() => setShowCategoryPicker(true)}
          disabled={isLoading}
        >
          <Text style={styles.pickerText}>{categoryDisplayLabel}</Text>
          <MaterialIcons name="arrow-drop-down" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {category === 'other' ? (
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Custom Category*</Text>
          <TextInput
            style={[styles.input, errors.custom_category && styles.inputError]}
            value={customCategoryName}
            onChangeText={setCustomCategoryName}
            placeholder="e.g., Court Settlements"
            placeholderTextColor={COLORS.textTertiary}
            editable={!isLoading}
          />
          {errors.custom_category ? <Text style={styles.errorText}>{errors.custom_category}</Text> : null}
        </View>
      ) : null}

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Debt Type*</Text>
        <TouchableOpacity
          style={[styles.picker, errors.liability_type && styles.inputError]}
          onPress={() => setShowTypePicker(true)}
          disabled={isLoading}
        >
          <Text style={styles.pickerText}>{liabilityTypeDisplayLabel}</Text>
          <MaterialIcons name="arrow-drop-down" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {liabilityType === 'other' ? (
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Custom Debt Type*</Text>
          <TextInput
            style={[styles.input, errors.custom_type && styles.inputError]}
            value={customLiabilityTypeName}
            onChangeText={setCustomLiabilityTypeName}
            placeholder="e.g., Partner Advance"
            placeholderTextColor={COLORS.textTertiary}
            editable={!isLoading}
          />
          <Text style={styles.helperInline}>Custom types still roll up under the selected category.</Text>
          {errors.custom_type ? <Text style={styles.errorText}>{errors.custom_type}</Text> : null}
        </View>
      ) : null}

      <View style={styles.helperCard}>
        <Text style={styles.helperTitle}>Track debt at the live balance</Text>
        <Text style={styles.helperDescription}>
          Net worth should use what you owe now. Keep original balance for payoff progress and add APR plus monthly payment for better debt planning.
        </Text>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Current Balance*</Text>
        <View style={styles.currencyInputContainer}>
          <Text style={styles.currencySymbol}>{CURRENCY_PREFIX}</Text>
          <TextInput
            style={[styles.currencyInput, errors.current_balance && styles.inputError]}
            value={currentBalance}
            onChangeText={(value) => setCurrentBalance(normaliseNumberInput(value))}
            placeholder="0.00"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="decimal-pad"
            editable={!isLoading}
          />
        </View>
        {errors.current_balance ? <Text style={styles.errorText}>{errors.current_balance}</Text> : null}
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Original Balance</Text>
        <View style={styles.currencyInputContainer}>
          <Text style={styles.currencySymbol}>{CURRENCY_PREFIX}</Text>
          <TextInput
            style={[styles.currencyInput, errors.original_balance && styles.inputError]}
            value={originalBalance}
            onChangeText={(value) => setOriginalBalance(normaliseNumberInput(value))}
            placeholder="0.00"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="decimal-pad"
            editable={!isLoading}
          />
        </View>
        {errors.original_balance ? <Text style={styles.errorText}>{errors.original_balance}</Text> : null}
      </View>

      <View style={styles.twoColumnRow}>
        <View style={[styles.fieldContainer, styles.halfField]}>
          <Text style={styles.label}>Interest Rate</Text>
          <View style={styles.currencyInputContainer}>
            <TextInput
              style={[styles.currencyInput, errors.interest_rate && styles.inputError]}
              value={interestRate}
              onChangeText={(value) => setInterestRate(normaliseNumberInput(value))}
              placeholder="0.00"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="decimal-pad"
              editable={!isLoading}
            />
            <Text style={styles.percentageSymbol}>% APR</Text>
          </View>
          {errors.interest_rate ? <Text style={styles.errorText}>{errors.interest_rate}</Text> : null}
        </View>

        <View style={[styles.fieldContainer, styles.halfField]}>
          <Text style={styles.label}>Monthly Payment</Text>
          <View style={styles.currencyInputContainer}>
            <Text style={styles.currencySymbol}>{CURRENCY_PREFIX}</Text>
            <TextInput
              style={[styles.currencyInput, errors.monthly_payment && styles.inputError]}
              value={monthlyPayment}
              onChangeText={(value) => setMonthlyPayment(normaliseNumberInput(value))}
              placeholder="0.00"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="decimal-pad"
              editable={!isLoading}
            />
          </View>
          {errors.monthly_payment ? <Text style={styles.errorText}>{errors.monthly_payment}</Text> : null}
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Next Payment Due</Text>
        <TouchableOpacity style={styles.picker} onPress={() => setShowDatePicker(true)} disabled={isLoading}>
          <Text style={styles.pickerText}>{dueDate ? dueDate.toLocaleDateString() : 'Select date'}</Text>
          <MaterialIcons name="event" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        {dueDate ? (
          <TouchableOpacity style={styles.clearDateButton} onPress={() => setDueDate(null)}>
            <Text style={styles.clearDateText}>Clear due date</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {(balanceChange !== 0 || monthlyPayment || interestRate) ? (
        <View style={[styles.helperCard, balanceChange >= 0 ? styles.gainCard : styles.lossCard]}>
          <Text style={styles.helperTitle}>
            {balanceChange >= 0 ? 'Paydown progress' : 'Balance growth warning'}
          </Text>
          <Text style={styles.helperDescription}>
            {balanceChange >= 0 ? '-' : '+'}
            {CURRENCY_PREFIX}
            {Math.abs(balanceChange).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            {monthlyPayment ? ` • Payment ${CURRENCY_PREFIX}${Number(monthlyPayment).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo` : ''}
            {interestRate ? ` • APR ${Number(interestRate).toFixed(2)}%` : ''}
          </Text>
        </View>
      ) : null}

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={styles.textArea}
          value={description}
          onChangeText={setDescription}
          placeholder="Add lender details, payoff notes, or collateral information."
          placeholderTextColor={COLORS.textTertiary}
          multiline
          numberOfLines={3}
          editable={!isLoading}
        />
      </View>

      <View style={styles.buttonContainer}>
        {mode === 'edit' && onDelete ? (
          <TouchableOpacity style={styles.deleteButton} onPress={onDelete} disabled={isLoading}>
            <MaterialIcons name="delete-outline" size={22} color={COLORS.white} />
            <Text style={styles.deleteButtonText}>Delete Debt</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel} disabled={isLoading}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>{mode === 'create' ? 'Add Liability' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showCategoryPicker ? (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.optionsList}>
              {LIABILITY_CATEGORY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.optionItem, category === option.key && styles.optionItemSelected]}
                  onPress={() => {
                    setCategory(option.key);
                    setShowCategoryPicker(false);
                  }}
                >
                  <View style={styles.optionCopy}>
                    <Text style={[styles.optionText, category === option.key && styles.optionTextSelected]}>{option.label}</Text>
                    <Text style={styles.optionMeta}>{option.description}</Text>
                  </View>
                  {category === option.key ? <MaterialIcons name="check" size={24} color={COLORS.error} /> : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      ) : null}

      {showTypePicker ? (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Debt Type</Text>
              <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.optionsList}>
              {liabilityTypeOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.optionItem, liabilityType === option.key && styles.optionItemSelected]}
                  onPress={() => {
                    setLiabilityType(option.key);
                    setShowTypePicker(false);
                  }}
                >
                  <View style={styles.optionCopy}>
                    <Text style={[styles.optionText, liabilityType === option.key && styles.optionTextSelected]}>{option.label}</Text>
                    <Text style={styles.optionMeta}>
                      {option.key === 'other' ? 'Create a custom subtype under this category.' : 'Included in this liability category.'}
                    </Text>
                  </View>
                  {liabilityType === option.key ? <MaterialIcons name="check" size={24} color={COLORS.error} /> : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      ) : null}

      {renderDatePicker()}
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
  halfField: {
    flex: 1,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: SPACING.md,
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
  },
  picker: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: 'Poppins',
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.error,
    fontFamily: 'Poppins',
  },
  helperInline: {
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    fontFamily: 'Poppins',
  },
  helperCard: {
    borderRadius: 22,
    padding: SPACING.lg,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: SPACING.lg,
  },
  gainCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  lossCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  helperTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
    marginBottom: 6,
  },
  helperDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: 'Poppins',
    lineHeight: 20,
  },
  currencyInputContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    color: COLORS.textTertiary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: 'Poppins',
    marginRight: SPACING.sm,
  },
  percentageSymbol: {
    color: COLORS.textTertiary,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: 'Poppins',
  },
  currencyInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
  },
  clearDateButton: {
    marginTop: SPACING.sm,
  },
  clearDateText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: 'Poppins',
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  textArea: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    minHeight: 110,
    textAlignVertical: 'top',
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
  },
  buttonContainer: {
    paddingBottom: SPACING.xxxl,
  },
  deleteButton: {
    borderRadius: 18,
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  deleteButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontFamily: 'Poppins',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontFamily: 'Poppins',
  },
  saveButton: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    fontFamily: 'Poppins',
  },
  modal: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    maxHeight: '72%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
  },
  doneText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontFamily: 'Poppins',
  },
  iosDatePicker: {
    alignSelf: 'center',
  },
  optionsList: {
    maxHeight: 420,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    gap: SPACING.md,
  },
  optionItemSelected: {
    backgroundColor: '#FEF2F2',
  },
  optionCopy: {
    flex: 1,
  },
  optionText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
    fontWeight: TYPOGRAPHY.weights.medium,
    marginBottom: 4,
  },
  optionTextSelected: {
    color: COLORS.error,
  },
  optionMeta: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    fontFamily: 'Poppins',
    lineHeight: 18,
  },
});
