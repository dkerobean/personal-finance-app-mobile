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
  ASSET_CATEGORY_OPTIONS,
  APPRECIATING_ASSET_TYPES,
  calculateAssetChange,
  getAssetTypeLabel,
  getAssetTypeOptions,
} from '@/lib/netWorthCatalog';
import type {
  Asset,
  AssetCategory,
  AssetType,
  AssetValuationMethod,
  CreateAssetRequest,
  UpdateAssetRequest,
} from '@/types/models';

const CURRENCY_PREFIX = 'GH¢';
const CUSTOM_CATEGORY_REGEX = /\[\[custom_category:(.*?)\]\]/i;
const CUSTOM_TYPE_REGEX = /\[\[custom_type:(.*?)\]\]/i;

interface AssetFormProps {
  initialData?: Asset;
  onSave: (data: CreateAssetRequest | UpdateAssetRequest) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

type DateField = 'purchase' | 'valuation' | null;

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

export default function AssetForm({
  initialData,
  onSave,
  onCancel,
  onDelete,
  isLoading = false,
  mode,
}: AssetFormProps): React.ReactElement {
  const parsedMeta = useMemo(() => extractCustomMeta(initialData?.description), [initialData?.description]);

  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState<AssetCategory>(initialData?.category || 'property');
  const [assetType, setAssetType] = useState<AssetType>(initialData?.asset_type || 'primary_home');
  const [currentValue, setCurrentValue] = useState(initialData?.current_value?.toString() || '');
  const [originalValue, setOriginalValue] = useState(initialData?.original_value?.toString() || '');
  const [purchaseDate, setPurchaseDate] = useState<Date | null>(formatDateValue(initialData?.purchase_date));
  const [valuationMethod, setValuationMethod] = useState<AssetValuationMethod>(initialData?.valuation_method || 'manual');
  const [tickerSymbol, setTickerSymbol] = useState(initialData?.ticker_symbol || '');
  const [unitsHeld, setUnitsHeld] = useState(initialData?.units_held?.toString() || '');
  const [unitPrice, setUnitPrice] = useState(initialData?.unit_price?.toString() || '');
  const [lastValuationDate, setLastValuationDate] = useState<Date | null>(formatDateValue(initialData?.last_valuation_date));
  const [description, setDescription] = useState(parsedMeta.cleanDescription);
  const [customCategoryName, setCustomCategoryName] = useState(initialData?.custom_category || parsedMeta.customCategory);
  const [customAssetTypeName, setCustomAssetTypeName] = useState(initialData?.custom_type || parsedMeta.customType);

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [activeDateField, setActiveDateField] = useState<DateField>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentCategory = useMemo(
    () => ASSET_CATEGORY_OPTIONS.find((option) => option.key === category),
    [category]
  );
  const assetTypeOptions = useMemo(() => getAssetTypeOptions(category), [category]);
  const usesMarketTracking = valuationMethod === 'market';
  const supportsMarketTracking = useMemo(
    () => assetTypeOptions.find((option) => option.key === assetType)?.supportsMarketTracking ?? false,
    [assetTypeOptions, assetType]
  );

  useEffect(() => {
    if (!assetTypeOptions.some((option) => option.key === assetType)) {
      setAssetType(assetTypeOptions[0]?.key || 'other');
    }
  }, [assetTypeOptions, assetType]);

  useEffect(() => {
    if (usesMarketTracking) {
      const units = Number(unitsHeld || 0);
      const price = Number(unitPrice || 0);
      if (units > 0 && price > 0) {
        setCurrentValue((units * price).toFixed(2));
      }
    }
  }, [usesMarketTracking, unitsHeld, unitPrice]);

  useEffect(() => {
    if (valuationMethod === 'market' && !supportsMarketTracking) {
      setValuationMethod('manual');
      setTickerSymbol('');
      setUnitsHeld('');
      setUnitPrice('');
    }
  }, [supportsMarketTracking, valuationMethod]);

  const gainPreview = useMemo(() => {
    const previewAsset = {
      current_value: Number(currentValue || 0),
      original_value: Number(originalValue || 0),
      valuation_method: valuationMethod,
      units_held: Number(unitsHeld || 0) || undefined,
      unit_price: Number(unitPrice || 0) || undefined,
    };
    return calculateAssetChange(previewAsset);
  }, [currentValue, originalValue, valuationMethod, unitsHeld, unitPrice]);

  const isAppreciatingAsset = APPRECIATING_ASSET_TYPES.has(assetType);
  const categoryDisplayLabel =
    category === 'other' && customCategoryName.trim()
      ? `Other • ${customCategoryName.trim()}`
      : currentCategory?.label || 'Select Category';
  const assetTypeDisplayLabel =
    assetType === 'other' && customAssetTypeName.trim()
      ? `Custom • ${customAssetTypeName.trim()}`
      : getAssetTypeLabel(assetType);

  const validateForm = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) nextErrors.name = 'Asset name is required';
    if (!currentValue || Number(currentValue) <= 0) nextErrors.current_value = 'Enter the current value';
    if (category === 'other' && !customCategoryName.trim()) nextErrors.custom_category = 'Add your custom category';
    if (assetType === 'other' && !customAssetTypeName.trim()) nextErrors.custom_type = 'Add your custom asset type';

    if (usesMarketTracking) {
      if (!tickerSymbol.trim()) nextErrors.ticker_symbol = 'Add a symbol or market reference';
      if (!unitsHeld || Number(unitsHeld) <= 0) nextErrors.units_held = 'Enter units or quantity held';
      if (!unitPrice || Number(unitPrice) <= 0) nextErrors.unit_price = 'Enter the latest unit price';
      if (!lastValuationDate) nextErrors.last_valuation_date = 'Pick the last valuation date';
    }

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

    const payload: CreateAssetRequest | UpdateAssetRequest = {
      name: name.trim(),
      category,
      asset_type: assetType,
      custom_category: category === 'other' ? sanitizeCustomValue(customCategoryName) : undefined,
      custom_type: assetType === 'other' ? sanitizeCustomValue(customAssetTypeName) : undefined,
      current_value: Number(currentValue),
      original_value: originalValue ? Number(originalValue) : undefined,
      purchase_date: purchaseDate ? purchaseDate.toISOString().split('T')[0] : undefined,
      valuation_method: valuationMethod,
      ticker_symbol: usesMarketTracking ? tickerSymbol.trim().toUpperCase() : undefined,
      units_held: usesMarketTracking ? Number(unitsHeld) : undefined,
      unit_price: usesMarketTracking ? Number(unitPrice) : undefined,
      last_valuation_date: lastValuationDate ? lastValuationDate.toISOString().split('T')[0] : undefined,
      description: description.trim() || undefined,
    };

    onSave(payload);
  };

  const renderDatePicker = () => {
    if (!activeDateField) {
      return null;
    }

    const value =
      activeDateField === 'purchase'
        ? purchaseDate || new Date()
        : lastValuationDate || new Date();

    const handleChange = (_event: unknown, selectedDate?: Date) => {
      if (Platform.OS !== 'ios') {
        setActiveDateField(null);
      }
      if (!selectedDate) {
        return;
      }

      if (activeDateField === 'purchase') {
        setPurchaseDate(selectedDate);
      } else {
        setLastValuationDate(selectedDate);
      }
    };

    if (Platform.OS === 'ios') {
      return (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setActiveDateField(null)}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={value}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              onChange={handleChange}
              style={styles.iosDatePicker}
            />
          </View>
        </View>
      );
    }

    return (
      <DateTimePicker
        value={value}
        mode="date"
        display="default"
        maximumDate={new Date()}
        onChange={handleChange}
      />
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Asset Name*</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Apple Shares, East Legon Duplex"
          placeholderTextColor={COLORS.textTertiary}
          editable={!isLoading}
        />
        {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Category*</Text>
        <TouchableOpacity style={[styles.picker, errors.category && styles.inputError]} onPress={() => setShowCategoryPicker(true)} disabled={isLoading}>
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
            placeholder="e.g., Farm Assets"
            placeholderTextColor={COLORS.textTertiary}
            editable={!isLoading}
          />
          {errors.custom_category ? <Text style={styles.errorText}>{errors.custom_category}</Text> : null}
        </View>
      ) : null}

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Asset Type*</Text>
        <TouchableOpacity style={[styles.picker, errors.asset_type && styles.inputError]} onPress={() => setShowTypePicker(true)} disabled={isLoading}>
          <Text style={styles.pickerText}>{assetTypeDisplayLabel}</Text>
          <MaterialIcons name="arrow-drop-down" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {assetType === 'other' ? (
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Custom Asset Type*</Text>
          <TextInput
            style={[styles.input, errors.custom_type && styles.inputError]}
            value={customAssetTypeName}
            onChangeText={setCustomAssetTypeName}
            placeholder="e.g., Private Syndicate Units"
            placeholderTextColor={COLORS.textTertiary}
            editable={!isLoading}
          />
          {errors.custom_type ? <Text style={styles.errorText}>{errors.custom_type}</Text> : null}
        </View>
      ) : null}

      <View style={styles.helperCard}>
        <Text style={styles.helperTitle}>Valuation approach</Text>
        <Text style={styles.helperDescription}>
          Net worth works best when assets are recorded at current value, not original cost. Use market tracking for quoted assets and appraisal for property-style assets.
        </Text>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Tracking Method*</Text>
        <View style={styles.segmentedControl}>
          {([
            { key: 'manual', label: 'Manual' },
            { key: 'market', label: 'Market' },
            { key: 'appraisal', label: 'Appraisal' },
          ] as Array<{ key: AssetValuationMethod; label: string }>).map((option) => {
            const disabled = option.key === 'market' && !supportsMarketTracking;
            const active = valuationMethod === option.key;

            return (
              <TouchableOpacity
                key={option.key}
                style={[styles.segmentButton, active && styles.segmentButtonActive, disabled && styles.segmentButtonDisabled]}
                onPress={() => !disabled && setValuationMethod(option.key)}
                disabled={disabled || isLoading}
              >
                <Text style={[styles.segmentButtonText, active && styles.segmentButtonTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {usesMarketTracking ? (
        <>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Ticker / Market Reference*</Text>
            <TextInput
              style={[styles.input, errors.ticker_symbol && styles.inputError]}
              value={tickerSymbol}
              onChangeText={setTickerSymbol}
              placeholder="e.g., AAPL, GOOG, BTC"
              placeholderTextColor={COLORS.textTertiary}
              autoCapitalize="characters"
              editable={!isLoading}
            />
            {errors.ticker_symbol ? <Text style={styles.errorText}>{errors.ticker_symbol}</Text> : null}
          </View>

          <View style={styles.twoColumnRow}>
            <View style={[styles.fieldContainer, styles.halfField]}>
              <Text style={styles.label}>Units Held*</Text>
              <TextInput
                style={[styles.input, errors.units_held && styles.inputError]}
                value={unitsHeld}
                onChangeText={(value) => setUnitsHeld(normaliseNumberInput(value))}
                placeholder="0"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="decimal-pad"
                editable={!isLoading}
              />
              {errors.units_held ? <Text style={styles.errorText}>{errors.units_held}</Text> : null}
            </View>

            <View style={[styles.fieldContainer, styles.halfField]}>
              <Text style={styles.label}>Unit Price*</Text>
              <View style={styles.currencyInputContainer}>
                <Text style={styles.currencySymbol}>{CURRENCY_PREFIX}</Text>
                <TextInput
                  style={[styles.currencyInput, errors.unit_price && styles.inputError]}
                  value={unitPrice}
                  onChangeText={(value) => setUnitPrice(normaliseNumberInput(value))}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="decimal-pad"
                  editable={!isLoading}
                />
              </View>
              {errors.unit_price ? <Text style={styles.errorText}>{errors.unit_price}</Text> : null}
            </View>
          </View>
        </>
      ) : null}

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{usesMarketTracking ? 'Computed Current Value*' : 'Current Value*'}</Text>
        <View style={styles.currencyInputContainer}>
          <Text style={styles.currencySymbol}>{CURRENCY_PREFIX}</Text>
          <TextInput
            style={[styles.currencyInput, errors.current_value && styles.inputError]}
            value={currentValue}
            onChangeText={(value) => setCurrentValue(normaliseNumberInput(value))}
            placeholder="0.00"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="decimal-pad"
            editable={!isLoading && !usesMarketTracking}
          />
        </View>
        {usesMarketTracking ? <Text style={styles.helperInline}>Automatically calculated from units × price.</Text> : null}
        {errors.current_value ? <Text style={styles.errorText}>{errors.current_value}</Text> : null}
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{isAppreciatingAsset ? 'Cost Basis / Original Value' : 'Original Value'}</Text>
        <View style={styles.currencyInputContainer}>
          <Text style={styles.currencySymbol}>{CURRENCY_PREFIX}</Text>
          <TextInput
            style={styles.currencyInput}
            value={originalValue}
            onChangeText={(value) => setOriginalValue(normaliseNumberInput(value))}
            placeholder="0.00"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="decimal-pad"
            editable={!isLoading}
          />
        </View>
      </View>

      {(valuationMethod === 'appraisal' || usesMarketTracking) ? (
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Last Valuation Date*</Text>
          <TouchableOpacity style={[styles.picker, errors.last_valuation_date && styles.inputError]} onPress={() => setActiveDateField('valuation')} disabled={isLoading}>
            <Text style={styles.pickerText}>{lastValuationDate ? lastValuationDate.toLocaleDateString() : 'Select valuation date'}</Text>
            <MaterialIcons name="event" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
          {lastValuationDate ? (
            <TouchableOpacity style={styles.clearDateButton} onPress={() => setLastValuationDate(null)}>
              <Text style={styles.clearDateText}>Clear valuation date</Text>
            </TouchableOpacity>
          ) : null}
          {errors.last_valuation_date ? <Text style={styles.errorText}>{errors.last_valuation_date}</Text> : null}
        </View>
      ) : null}

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Purchase Date</Text>
        <TouchableOpacity style={styles.picker} onPress={() => setActiveDateField('purchase')} disabled={isLoading}>
          <Text style={styles.pickerText}>{purchaseDate ? purchaseDate.toLocaleDateString() : 'Select date'}</Text>
          <MaterialIcons name="event" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        {purchaseDate ? (
          <TouchableOpacity style={styles.clearDateButton} onPress={() => setPurchaseDate(null)}>
            <Text style={styles.clearDateText}>Clear purchase date</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {(gainPreview.amount !== 0 || gainPreview.percentage !== null) ? (
        <View style={[styles.helperCard, gainPreview.amount >= 0 ? styles.gainCard : styles.lossCard]}>
          <Text style={styles.helperTitle}>
            {gainPreview.amount >= 0 ? 'Unrealized gain preview' : 'Value drawdown preview'}
          </Text>
          <Text style={styles.helperDescription}>
            {gainPreview.amount >= 0 ? '+' : ''}
            {CURRENCY_PREFIX}
            {Math.abs(gainPreview.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            {gainPreview.percentage !== null ? ` (${gainPreview.amount >= 0 ? '+' : ''}${gainPreview.percentage.toFixed(1)}%)` : ''}
          </Text>
        </View>
      ) : null}

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={styles.textArea}
          value={description}
          onChangeText={setDescription}
          placeholder="Add notes, valuation basis, or anything you want to remember."
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
            <Text style={styles.deleteButtonText}>Delete Asset</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel} disabled={isLoading}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} onPress={handleSave} disabled={isLoading}>
            <Text style={styles.saveButtonText}>{mode === 'create' ? 'Add Asset' : 'Save Changes'}</Text>
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
              {ASSET_CATEGORY_OPTIONS.map((option) => (
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
                  {category === option.key ? <MaterialIcons name="check" size={24} color={COLORS.primary} /> : null}
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
              <Text style={styles.modalTitle}>Select Asset Type</Text>
              <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.optionsList}>
              {assetTypeOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.optionItem, assetType === option.key && styles.optionItemSelected]}
                  onPress={() => {
                    setAssetType(option.key);
                    setShowTypePicker(false);
                  }}
                >
                  <View style={styles.optionCopy}>
                    <Text style={[styles.optionText, assetType === option.key && styles.optionTextSelected]}>{option.label}</Text>
                    <Text style={styles.optionMeta}>
                      {option.supportsMarketTracking ? 'Supports unit-price updates' : option.appreciating ? 'Good candidate for periodic value updates' : 'Manual value updates'}
                    </Text>
                  </View>
                  {assetType === option.key ? <MaterialIcons name="check" size={24} color={COLORS.primary} /> : null}
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
    borderWidth: 1,
    borderColor: COLORS.backgroundInput,
    borderRadius: 14,
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
    borderRadius: 14,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 90,
    textAlignVertical: 'top',
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
  },
  picker: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.backgroundInput,
    borderRadius: 14,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    flex: 1,
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
    borderRadius: 14,
  },
  currencySymbol: {
    minWidth: 42,
    paddingLeft: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: 'Poppins',
  },
  currencyInput: {
    flex: 1,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
  },
  helperCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  gainCard: {
    backgroundColor: '#ECFDF5',
  },
  lossCard: {
    backgroundColor: '#FEF2F2',
  },
  helperTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
    fontFamily: 'Poppins',
  },
  helperDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    fontFamily: 'Poppins',
  },
  helperInline: {
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    fontFamily: 'Poppins',
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.backgroundInput,
    backgroundColor: COLORS.white,
    paddingVertical: 10,
  },
  segmentButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  segmentButtonDisabled: {
    opacity: 0.4,
  },
  segmentButtonText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontFamily: 'Poppins',
  },
  segmentButtonTextActive: {
    color: COLORS.white,
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
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.error,
    fontFamily: 'Poppins',
  },
  buttonContainer: {
    marginTop: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
    borderRadius: 14,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: COLORS.backgroundInput,
    borderRadius: 14,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontFamily: 'Poppins',
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: SPACING.md,
    alignItems: 'center',
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    maxHeight: '80%',
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  optionsList: {
    flexGrow: 0,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.backgroundInput,
  },
  optionItemSelected: {
    backgroundColor: 'rgba(0, 109, 79, 0.06)',
  },
  optionCopy: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  optionText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  optionTextSelected: {
    color: COLORS.primary,
  },
  optionMeta: {
    marginTop: 2,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    fontFamily: 'Poppins',
  },
  iosDatePicker: {
    height: 200,
  },
});
