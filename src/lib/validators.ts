import { VALIDATION_RULES } from './constants';

export const validateEmail = (email: string): boolean => {
  return VALIDATION_RULES.EMAIL_REGEX.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
    return {
      isValid: false,
      message: `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters long`,
    };
  }

  if (!/(?=.*[a-z])/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter',
    };
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter',
    };
  }

  if (!/(?=.*\d)/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number',
    };
  }

  return { isValid: true };
};

// Net Worth Validation Functions
export const validateMonetaryValue = (value: number | string): { isValid: boolean; message?: string } => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return {
      isValid: false,
      message: 'Value must be a valid number',
    };
  }

  if (numValue < 0) {
    return {
      isValid: false,
      message: 'Value must be positive',
    };
  }

  if (numValue > 999999999.99) {
    return {
      isValid: false,
      message: 'Value cannot exceed 999,999,999.99',
    };
  }

  // Check decimal places
  const decimalPlaces = (numValue.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    return {
      isValid: false,
      message: 'Value cannot have more than 2 decimal places',
    };
  }

  return { isValid: true };
};

export const validateLiabilityBalance = (value: number | string): { isValid: boolean; message?: string } => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  const baseValidation = validateMonetaryValue(value);
  if (!baseValidation.isValid) {
    return baseValidation;
  }

  // For liabilities, ensure minimum meaningful amount
  if (numValue < 0.01) {
    return {
      isValid: false,
      message: 'Liability balance must be at least $0.01',
    };
  }

  return { isValid: true };
};

export const validateInterestRate = (rate: number | string): { isValid: boolean; message?: string } => {
  const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;
  
  if (isNaN(numRate)) {
    return {
      isValid: false,
      message: 'Interest rate must be a valid number',
    };
  }

  if (numRate < 0) {
    return {
      isValid: false,
      message: 'Interest rate must be positive',
    };
  }

  if (numRate > 100) {
    return {
      isValid: false,
      message: 'Interest rate cannot exceed 100%',
    };
  }

  // Check decimal places (up to 4 for interest rates)
  const decimalPlaces = (numRate.toString().split('.')[1] || '').length;
  if (decimalPlaces > 4) {
    return {
      isValid: false,
      message: 'Interest rate cannot have more than 4 decimal places',
    };
  }

  return { isValid: true };
};

export const validateAssetName = (name: string): { isValid: boolean; message?: string } => {
  if (!name || name.trim().length === 0) {
    return {
      isValid: false,
      message: 'Asset name is required',
    };
  }

  if (name.trim().length > 255) {
    return {
      isValid: false,
      message: 'Asset name cannot exceed 255 characters',
    };
  }

  return { isValid: true };
};

export const validateLiabilityName = (name: string): { isValid: boolean; message?: string } => {
  if (!name || name.trim().length === 0) {
    return {
      isValid: false,
      message: 'Liability name is required',
    };
  }

  if (name.trim().length > 255) {
    return {
      isValid: false,
      message: 'Liability name cannot exceed 255 characters',
    };
  }

  return { isValid: true };
};

export const validateDescription = (description?: string): { isValid: boolean; message?: string } => {
  if (description && description.length > 500) {
    return {
      isValid: false,
      message: 'Description cannot exceed 500 characters',
    };
  }

  return { isValid: true };
};

export const validateDate = (dateString: string): { isValid: boolean; message?: string } => {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      message: 'Invalid date format',
    };
  }

  // Check if date is in the future
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  
  if (date > today) {
    return {
      isValid: false,
      message: 'Date cannot be in the future',
    };
  }

  return { isValid: true };
};

export const validateDueDate = (dateString: string): { isValid: boolean; message?: string } => {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      message: 'Invalid date format',
    };
  }

  // Due dates can be in the future, but not too far in the past or future
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  const tenYearsFromNow = new Date();
  tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10);
  
  if (date < oneYearAgo) {
    return {
      isValid: false,
      message: 'Due date cannot be more than one year in the past',
    };
  }
  
  if (date > tenYearsFromNow) {
    return {
      isValid: false,
      message: 'Due date cannot be more than 10 years in the future',
    };
  }

  return { isValid: true };
};

// Category validation arrays
const ASSET_CATEGORIES = ['property', 'investments', 'cash', 'vehicles', 'personal', 'business', 'other'] as const;
const ASSET_TYPES = ['real_estate', 'stocks', 'bonds', 'savings', 'checking', 'cryptocurrency', 'car', 'jewelry', 'art', 'other'] as const;
const LIABILITY_CATEGORIES = ['loans', 'credit_cards', 'mortgages', 'business_debt', 'other'] as const;
const LIABILITY_TYPES = ['mortgage', 'auto_loan', 'personal_loan', 'credit_card', 'student_loan', 'business_loan', 'other'] as const;

export const validateAssetCategory = (category: string): { isValid: boolean; message?: string } => {
  if (!ASSET_CATEGORIES.includes(category as any)) {
    return {
      isValid: false,
      message: `Invalid asset category. Must be one of: ${ASSET_CATEGORIES.join(', ')}`,
    };
  }

  return { isValid: true };
};

export const validateAssetType = (type: string): { isValid: boolean; message?: string } => {
  if (!ASSET_TYPES.includes(type as any)) {
    return {
      isValid: false,
      message: `Invalid asset type. Must be one of: ${ASSET_TYPES.join(', ')}`,
    };
  }

  return { isValid: true };
};

export const validateLiabilityCategory = (category: string): { isValid: boolean; message?: string } => {
  if (!LIABILITY_CATEGORIES.includes(category as any)) {
    return {
      isValid: false,
      message: `Invalid liability category. Must be one of: ${LIABILITY_CATEGORIES.join(', ')}`,
    };
  }

  return { isValid: true };
};

export const validateLiabilityType = (type: string): { isValid: boolean; message?: string } => {
  if (!LIABILITY_TYPES.includes(type as any)) {
    return {
      isValid: false,
      message: `Invalid liability type. Must be one of: ${LIABILITY_TYPES.join(', ')}`,
    };
  }

  return { isValid: true };
};

// Comprehensive asset validation
export const validateAsset = (asset: {
  name: string;
  category: string;
  asset_type: string;
  current_value: number;
  original_value?: number;
  purchase_date?: string;
  description?: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  const nameValidation = validateAssetName(asset.name);
  if (!nameValidation.isValid) errors.push(nameValidation.message!);

  const categoryValidation = validateAssetCategory(asset.category);
  if (!categoryValidation.isValid) errors.push(categoryValidation.message!);

  const typeValidation = validateAssetType(asset.asset_type);
  if (!typeValidation.isValid) errors.push(typeValidation.message!);

  const valueValidation = validateMonetaryValue(asset.current_value);
  if (!valueValidation.isValid) errors.push(`Current value: ${valueValidation.message}`);

  if (asset.original_value !== undefined) {
    const originalValueValidation = validateMonetaryValue(asset.original_value);
    if (!originalValueValidation.isValid) errors.push(`Original value: ${originalValueValidation.message}`);
  }

  if (asset.purchase_date) {
    const dateValidation = validateDate(asset.purchase_date);
    if (!dateValidation.isValid) errors.push(`Purchase date: ${dateValidation.message}`);
  }

  if (asset.description) {
    const descValidation = validateDescription(asset.description);
    if (!descValidation.isValid) errors.push(descValidation.message!);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Comprehensive liability validation
export const validateLiability = (liability: {
  name: string;
  category: string;
  liability_type: string;
  current_balance: number;
  original_balance?: number;
  interest_rate?: number;
  monthly_payment?: number;
  due_date?: string;
  description?: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  const nameValidation = validateLiabilityName(liability.name);
  if (!nameValidation.isValid) errors.push(nameValidation.message!);

  const categoryValidation = validateLiabilityCategory(liability.category);
  if (!categoryValidation.isValid) errors.push(categoryValidation.message!);

  const typeValidation = validateLiabilityType(liability.liability_type);
  if (!typeValidation.isValid) errors.push(typeValidation.message!);

  const balanceValidation = validateLiabilityBalance(liability.current_balance);
  if (!balanceValidation.isValid) errors.push(`Current balance: ${balanceValidation.message}`);

  if (liability.original_balance !== undefined) {
    const originalBalanceValidation = validateLiabilityBalance(liability.original_balance);
    if (!originalBalanceValidation.isValid) errors.push(`Original balance: ${originalBalanceValidation.message}`);
  }

  if (liability.interest_rate !== undefined) {
    const rateValidation = validateInterestRate(liability.interest_rate);
    if (!rateValidation.isValid) errors.push(`Interest rate: ${rateValidation.message}`);
  }

  if (liability.monthly_payment !== undefined) {
    const paymentValidation = validateMonetaryValue(liability.monthly_payment);
    if (!paymentValidation.isValid) errors.push(`Monthly payment: ${paymentValidation.message}`);
  }

  if (liability.due_date) {
    const dueDateValidation = validateDueDate(liability.due_date);
    if (!dueDateValidation.isValid) errors.push(`Due date: ${dueDateValidation.message}`);
  }

  if (liability.description) {
    const descValidation = validateDescription(liability.description);
    if (!descValidation.isValid) errors.push(descValidation.message!);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};