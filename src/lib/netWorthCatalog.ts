import type {
  Asset,
  AssetCategory,
  AssetType,
  AssetValuationMethod,
  Liability,
  LiabilityCategory,
  LiabilityType,
} from '@/types/models';

type AssetCategoryOption = {
  key: AssetCategory;
  label: string;
  description: string;
  icon: string;
  color: string;
};

type AssetTypeOption = {
  key: AssetType;
  label: string;
  category: AssetCategory;
  appreciating?: boolean;
  liquid?: boolean;
  supportsMarketTracking?: boolean;
};

type LiabilityCategoryOption = {
  key: LiabilityCategory;
  label: string;
  description: string;
  icon: string;
  color: string;
};

type LiabilityTypeOption = {
  key: LiabilityType;
  label: string;
  category: LiabilityCategory;
};

export const ASSET_CATEGORY_OPTIONS: AssetCategoryOption[] = [
  { key: 'property', label: 'Property', description: 'Homes, land, rentals, and commercial property.', icon: 'home', color: '#15803D' },
  { key: 'investments', label: 'Investments', description: 'Tradable portfolios, retirement assets, and long-term holdings.', icon: 'trending-up', color: '#2563EB' },
  { key: 'cash', label: 'Cash & Reserves', description: 'Liquid balances and short-term reserves.', icon: 'account-balance-wallet', color: '#0F766E' },
  { key: 'vehicles', label: 'Vehicles', description: 'Cars and other transport assets with resale value.', icon: 'directions-car', color: '#C2410C' },
  { key: 'personal', label: 'Personal Assets', description: 'Collectibles, precious items, and valuables.', icon: 'diamond', color: '#BE185D' },
  { key: 'business', label: 'Business Assets', description: 'Operating, equity, and working-capital assets.', icon: 'business', color: '#4F46E5' },
  { key: 'other', label: 'Other Assets', description: 'Anything else that contributes to net worth.', icon: 'category', color: '#6B7280' },
];

export const ASSET_TYPE_OPTIONS: AssetTypeOption[] = [
  { key: 'primary_home', label: 'Primary Home', category: 'property', appreciating: true },
  { key: 'real_estate', label: 'Residential Property', category: 'property', appreciating: true },
  { key: 'land', label: 'Land', category: 'property', appreciating: true },
  { key: 'rental_property', label: 'Rental Property', category: 'property', appreciating: true },
  { key: 'commercial_property', label: 'Commercial Property', category: 'property', appreciating: true },
  { key: 'stocks', label: 'Stocks', category: 'investments', appreciating: true, supportsMarketTracking: true },
  { key: 'bonds', label: 'Bonds', category: 'investments', appreciating: true, supportsMarketTracking: true },
  { key: 'mutual_funds', label: 'Mutual Funds', category: 'investments', appreciating: true, supportsMarketTracking: true },
  { key: 'etf', label: 'ETF', category: 'investments', appreciating: true, supportsMarketTracking: true },
  { key: 'cryptocurrency', label: 'Cryptocurrency', category: 'investments', appreciating: true, supportsMarketTracking: true },
  { key: 'retirement_account', label: 'Retirement Account', category: 'investments', appreciating: true },
  { key: 'treasury_bill', label: 'Treasury Bill', category: 'investments', appreciating: true, liquid: true },
  { key: 'pension_fund', label: 'Pension Fund', category: 'investments', appreciating: true },
  { key: 'brokerage_account', label: 'Brokerage Account', category: 'investments', appreciating: true, liquid: true },
  { key: 'reits', label: 'REITs', category: 'investments', appreciating: true, supportsMarketTracking: true },
  { key: 'private_equity', label: 'Private Equity', category: 'investments', appreciating: true },
  { key: 'savings', label: 'Savings Account', category: 'cash', liquid: true },
  { key: 'checking', label: 'Checking Account', category: 'cash', liquid: true },
  { key: 'money_market', label: 'Money Market', category: 'cash', liquid: true },
  { key: 'cd', label: 'Certificate of Deposit', category: 'cash', liquid: true },
  { key: 'foreign_currency', label: 'Foreign Currency', category: 'cash', liquid: true },
  { key: 'mobile_money_wallet', label: 'Mobile Money Wallet', category: 'cash', liquid: true },
  { key: 'emergency_fund', label: 'Emergency Fund', category: 'cash', liquid: true },
  { key: 'fixed_deposit', label: 'Fixed Deposit', category: 'cash', liquid: true },
  { key: 'cash_on_hand', label: 'Cash on Hand', category: 'cash', liquid: true },
  { key: 'car', label: 'Car', category: 'vehicles' },
  { key: 'motorcycle', label: 'Motorcycle', category: 'vehicles' },
  { key: 'boat', label: 'Boat', category: 'vehicles' },
  { key: 'rv', label: 'Recreational Vehicle', category: 'vehicles' },
  { key: 'commercial_vehicle', label: 'Commercial Vehicle', category: 'vehicles' },
  { key: 'jewelry', label: 'Jewelry', category: 'personal' },
  { key: 'art', label: 'Art', category: 'personal' },
  { key: 'collectibles', label: 'Collectibles', category: 'personal' },
  { key: 'electronics', label: 'Electronics', category: 'personal' },
  { key: 'precious_metals', label: 'Precious Metals', category: 'personal', appreciating: true },
  { key: 'business_equity', label: 'Business Equity', category: 'business', appreciating: true },
  { key: 'business_assets', label: 'Business Assets', category: 'business' },
  { key: 'intellectual_property', label: 'Intellectual Property', category: 'business', appreciating: true },
  { key: 'inventory', label: 'Inventory', category: 'business' },
  { key: 'accounts_receivable', label: 'Accounts Receivable', category: 'business', liquid: true },
  { key: 'equipment', label: 'Equipment', category: 'business' },
  { key: 'other', label: 'Custom Asset Type', category: 'other' },
];

export const LIABILITY_CATEGORY_OPTIONS: LiabilityCategoryOption[] = [
  { key: 'loans', label: 'Loans', description: 'Installment loans and other borrowed capital.', icon: 'account-balance', color: '#DC2626' },
  { key: 'credit_cards', label: 'Credit & Lines', description: 'Cards, overdrafts, and revolving balances.', icon: 'credit-card', color: '#B91C1C' },
  { key: 'mortgages', label: 'Mortgages', description: 'Property-backed debt and home equity obligations.', icon: 'home', color: '#991B1B' },
  { key: 'business_debt', label: 'Business Debt', description: 'Working-capital debt and operating obligations.', icon: 'business-center', color: '#7F1D1D' },
  { key: 'other', label: 'Other Liabilities', description: 'Taxes, medical debt, and anything outside the core list.', icon: 'category', color: '#6B7280' },
];

export const LIABILITY_TYPE_OPTIONS: LiabilityTypeOption[] = [
  { key: 'personal_loan', label: 'Personal Loan', category: 'loans' },
  { key: 'auto_loan', label: 'Auto Loan', category: 'loans' },
  { key: 'student_loan', label: 'Student Loan', category: 'loans' },
  { key: 'payday_loan', label: 'Payday Loan', category: 'loans' },
  { key: 'line_of_credit', label: 'Line of Credit', category: 'loans' },
  { key: 'family_loan', label: 'Family / Informal Loan', category: 'loans' },
  { key: 'credit_card', label: 'Credit Card', category: 'credit_cards' },
  { key: 'buy_now_pay_later', label: 'Buy Now Pay Later', category: 'credit_cards' },
  { key: 'overdraft', label: 'Overdraft', category: 'credit_cards' },
  { key: 'margin_loan', label: 'Margin Loan', category: 'credit_cards' },
  { key: 'mortgage', label: 'Mortgage', category: 'mortgages' },
  { key: 'home_equity_loan', label: 'Home Equity Loan', category: 'mortgages' },
  { key: 'business_loan', label: 'Business Loan', category: 'business_debt' },
  { key: 'vendor_payable', label: 'Vendor Payable', category: 'business_debt' },
  { key: 'medical_debt', label: 'Medical Debt', category: 'other' },
  { key: 'tax_debt', label: 'Tax Debt', category: 'other' },
  { key: 'utility_bill', label: 'Utility Arrears', category: 'other' },
  { key: 'legal_obligation', label: 'Legal Obligation', category: 'other' },
  { key: 'other', label: 'Custom Liability Type', category: 'other' },
];

const ASSET_CATEGORY_LABELS = Object.fromEntries(
  ASSET_CATEGORY_OPTIONS.map((item) => [item.key, item.label])
) as Record<AssetCategory, string>;

const LIABILITY_CATEGORY_LABELS = Object.fromEntries(
  LIABILITY_CATEGORY_OPTIONS.map((item) => [item.key, item.label])
) as Record<LiabilityCategory, string>;

const ASSET_TYPE_LABELS = Object.fromEntries(
  ASSET_TYPE_OPTIONS.map((item) => [item.key, item.label])
) as Record<AssetType, string>;

const LIABILITY_TYPE_LABELS = Object.fromEntries(
  LIABILITY_TYPE_OPTIONS.map((item) => [item.key, item.label])
) as Record<LiabilityType, string>;

export const APPRECIATING_ASSET_TYPES = new Set<AssetType>(
  ASSET_TYPE_OPTIONS.filter((item) => item.appreciating).map((item) => item.key)
);

export const LIQUID_ASSET_TYPES = new Set<AssetType>(
  ASSET_TYPE_OPTIONS.filter((item) => item.liquid).map((item) => item.key)
);

export const getAssetCategoryLabel = (category: AssetCategory): string =>
  ASSET_CATEGORY_LABELS[category] || category;

export const getLiabilityCategoryLabel = (category: LiabilityCategory): string =>
  LIABILITY_CATEGORY_LABELS[category] || category;

export const getAssetTypeLabel = (type: AssetType): string =>
  ASSET_TYPE_LABELS[type] || type;

export const getLiabilityTypeLabel = (type: LiabilityType): string =>
  LIABILITY_TYPE_LABELS[type] || type;

export const getAssetTypeOptions = (category: AssetCategory): AssetTypeOption[] =>
  ASSET_TYPE_OPTIONS.filter((item) => item.category === category || item.key === 'other');

export const getLiabilityTypeOptions = (category: LiabilityCategory): LiabilityTypeOption[] =>
  LIABILITY_TYPE_OPTIONS.filter((item) => item.category === category || item.key === 'other');

export const getAssetValuationMethodLabel = (method?: AssetValuationMethod): string => {
  switch (method) {
    case 'market':
      return 'Market-tracked';
    case 'appraisal':
      return 'Appraised';
    default:
      return 'Manual';
  }
};

export const calculateAssetCurrentValue = (asset: Pick<Asset, 'current_value' | 'valuation_method' | 'units_held' | 'unit_price'>): number => {
  if (asset.valuation_method === 'market' && asset.units_held && asset.unit_price) {
    return Number((asset.units_held * asset.unit_price).toFixed(2));
  }

  return Number(asset.current_value || 0);
};

export const calculateAssetChange = (asset: Pick<Asset, 'current_value' | 'original_value' | 'valuation_method' | 'units_held' | 'unit_price'>): {
  amount: number;
  percentage: number | null;
} => {
  const currentValue = calculateAssetCurrentValue(asset);
  const originalValue = Number(asset.original_value || 0);

  if (!originalValue) {
    return { amount: 0, percentage: null };
  }

  const amount = currentValue - originalValue;
  return {
    amount,
    percentage: originalValue !== 0 ? (amount / originalValue) * 100 : null,
  };
};

export const getAssetDisplayType = (asset: Pick<Asset, 'asset_type' | 'custom_type'>): string =>
  asset.custom_type?.trim() || getAssetTypeLabel(asset.asset_type);

export const getLiabilityDisplayType = (liability: Pick<Liability, 'liability_type' | 'custom_type'>): string =>
  liability.custom_type?.trim() || getLiabilityTypeLabel(liability.liability_type);
