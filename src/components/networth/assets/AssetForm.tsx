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
import type { Asset, AssetCategory, AssetType, CreateAssetRequest, UpdateAssetRequest } from '@/types/models';
import { validateAsset } from '@/lib/validators';

interface AssetFormProps {
  initialData?: Asset;
  onSave: (data: CreateAssetRequest | UpdateAssetRequest) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

const ASSET_CATEGORIES: { key: AssetCategory; label: string; types: AssetType[] }[] = [
  {
    key: 'property',
    label: 'Property',
    types: ['real_estate', 'land', 'rental_property']
  },
  {
    key: 'investments',
    label: 'Investments',
    types: ['stocks', 'bonds', 'mutual_funds', 'etf', 'cryptocurrency', 'retirement_account']
  },
  {
    key: 'cash',
    label: 'Cash & Savings',
    types: ['savings', 'checking', 'money_market', 'cd', 'foreign_currency']
  },
  {
    key: 'vehicles',
    label: 'Vehicles',
    types: ['car', 'motorcycle', 'boat', 'rv']
  },
  {
    key: 'personal',
    label: 'Personal Assets',
    types: ['jewelry', 'art', 'collectibles', 'electronics']
  },
  {
    key: 'business',
    label: 'Business Assets',
    types: ['business_equity', 'business_assets', 'intellectual_property']
  },
  {
    key: 'other',
    label: 'Other Assets',
    types: ['other']
  },
];

export default function AssetForm({
  initialData,
  onSave,
  onCancel,
  onDelete,
  isLoading = false,
  mode,
}: AssetFormProps): React.ReactElement {
  
  // Form state
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState<AssetCategory>(initialData?.category || 'property');
  const [assetType, setAssetType] = useState<AssetType>(initialData?.asset_type || 'real_estate');
  const [currentValue, setCurrentValue] = useState(initialData?.current_value?.toString() || '');
  const [originalValue, setOriginalValue] = useState(initialData?.original_value?.toString() || '');
  const [purchaseDate, setPurchaseDate] = useState<Date | null>(
    initialData?.purchase_date ? new Date(initialData.purchase_date) : null
  );
  const [description, setDescription] = useState(initialData?.description || '');
  
  // UI state
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update asset types when category changes
  useEffect(() => {
    const categoryData = ASSET_CATEGORIES.find(cat => cat.key === category);
    if (categoryData && !categoryData.types.includes(assetType)) {
      setAssetType(categoryData.types[0]);
    }
  }, [category, assetType]);

  const getAssetTypeLabel = (type: AssetType): string => {
    const labels: Record<AssetType, string> = {
      real_estate: 'Real Estate',
      land: 'Land',
      rental_property: 'Rental Property',
      stocks: 'Stocks',
      bonds: 'Bonds',
      mutual_funds: 'Mutual Funds',
      etf: 'ETF',
      cryptocurrency: 'Cryptocurrency',
      retirement_account: 'Retirement Account',
      savings: 'Savings Account',
      checking: 'Checking Account',
      money_market: 'Money Market',
      cd: 'Certificate of Deposit',
      foreign_currency: 'Foreign Currency',
      car: 'Car',
      motorcycle: 'Motorcycle',
      boat: 'Boat',
      rv: 'RV',
      jewelry: 'Jewelry',
      art: 'Art',
      collectibles: 'Collectibles',
      electronics: 'Electronics',
      business_equity: 'Business Equity',
      business_assets: 'Business Assets',
      intellectual_property: 'Intellectual Property',
      other: 'Other',
    };
    return labels[type] || type;
  };

  const validateForm = (): boolean => {
    const validation = validateAsset({
      name: name.trim(),
      category,
      asset_type: assetType,
      current_value: parseFloat(currentValue) || 0,
      original_value: originalValue ? parseFloat(originalValue) : undefined,
      purchase_date: purchaseDate?.toISOString().split('T')[0],
      description: description.trim() || undefined,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
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
      asset_type: assetType,
      current_value: parseFloat(currentValue),
      original_value: originalValue ? parseFloat(originalValue) : undefined,
      purchase_date: purchaseDate?.toISOString().split('T')[0],
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

  const currentCategory = ASSET_CATEGORIES.find(cat => cat.key === category);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Asset Name */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Asset Name*</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={name}
          onChangeText={setName}
          placeholder="e.g., My House, Tesla Stock"
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

      {/* Asset Type Selection */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Asset Type*</Text>
        <TouchableOpacity
          style={[styles.picker, errors.asset_type && styles.inputError]}
          onPress={() => setShowTypePicker(true)}
          disabled={isLoading}
        >
          <Text style={styles.pickerText}>{getAssetTypeLabel(assetType)}</Text>
          <MaterialIcons name="arrow-drop-down" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        {errors.asset_type && <Text style={styles.errorText}>{errors.asset_type}</Text>}
      </View>

      {/* Current Value */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Current Value*</Text>
        <View style={styles.currencyInputContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={[styles.currencyInput, errors.current_value && styles.inputError]}
            value={currentValue}
            onChangeText={(value) => setCurrentValue(formatCurrency(value))}
            placeholder="0.00"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="decimal-pad"
            editable={!isLoading}
          />
        </View>
        {errors.current_value && <Text style={styles.errorText}>{errors.current_value}</Text>}
      </View>

      {/* Original Value (Optional) */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Original Value (Optional)</Text>
        <View style={styles.currencyInputContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={[styles.currencyInput, errors.original_value && styles.inputError]}
            value={originalValue}
            onChangeText={(value) => setOriginalValue(formatCurrency(value))}
            placeholder="0.00"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="decimal-pad"
            editable={!isLoading}
          />
        </View>
        {errors.original_value && <Text style={styles.errorText}>{errors.original_value}</Text>}
      </View>

      {/* Purchase Date (Optional) */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Purchase Date (Optional)</Text>
        <TouchableOpacity
          style={[styles.picker, errors.purchase_date && styles.inputError]}
          onPress={() => setShowDatePicker(true)}
          disabled={isLoading}
        >
          <Text style={styles.pickerText}>
            {purchaseDate ? purchaseDate.toLocaleDateString() : 'Select Date'}
          </Text>
          <MaterialIcons name="event" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        {purchaseDate && (
          <TouchableOpacity
            style={styles.clearDateButton}
            onPress={() => setPurchaseDate(null)}
          >
            <Text style={styles.clearDateText}>Clear Date</Text>
          </TouchableOpacity>
        )}
        {errors.purchase_date && <Text style={styles.errorText}>{errors.purchase_date}</Text>}
      </View>

      {/* Description (Optional) */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={[styles.textArea, errors.description && styles.inputError]}
          value={description}
          onChangeText={setDescription}
          placeholder="Additional notes about this asset..."
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
            <Text style={styles.deleteButtonText}>Delete Asset</Text>
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
              {mode === 'create' ? 'Add Asset' : 'Save Changes'}
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
              {ASSET_CATEGORIES.map((cat) => (
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
                    <MaterialIcons name="check" size={24} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Asset Type Picker Modal */}
      {showTypePicker && currentCategory && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Asset Type</Text>
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
                    assetType === type && styles.optionItemSelected
                  ]}
                  onPress={() => {
                    setAssetType(type);
                    setShowTypePicker(false);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    assetType === type && styles.optionTextSelected
                  ]}>
                    {getAssetTypeLabel(type)}
                  </Text>
                  {assetType === type && (
                    <MaterialIcons name="check" size={24} color={COLORS.primary} />
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
          value={purchaseDate || new Date()}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setPurchaseDate(selectedDate);
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
  currencyInput: {
    flex: 1,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
  },
  clearDateButton: {
    marginTop: SPACING.xs,
  },
  clearDateText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
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
    backgroundColor: COLORS.primary,
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
    backgroundColor: '#eff6ff',
  },
  optionText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});