export interface User {
  id: string;
  email: string;
  emailConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  icon_name: string;
  created_at: string;
  updated_at: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  user_id: string;
  account_id?: string; // UUID - Links to accounts table for synced transactions
  amount: number;
  type: TransactionType;
  category_id: string;
  transaction_date: string;
  description?: string;
  created_at: string;
  updated_at: string;
  category?: Category;
  // Platform-specific identifiers
  mono_transaction_id?: string; // For bank transactions via Mono
  mtn_reference_id?: string; // For MTN MoMo transactions
  // Legacy MTN MoMo fields (maintained for backward compatibility)
  momo_external_id?: string;
  momo_transaction_id?: string;
  momo_reference_id?: string;
  momo_status?: string;
  momo_payer_info?: string;
  momo_financial_transaction_id?: string;
  merchant_name?: string;
  // Transaction metadata
  institution_name?: string; // e.g., 'GCB Bank' OR 'MTN Mobile Money'
  is_synced?: boolean; // Set to true for all synced transactions
  auto_categorized?: boolean;
  categorization_confidence?: number;
  sync_log_id?: string; // Links to transaction_sync_log table
  platform_source?: 'mono' | 'mtn_momo' | 'manual'; // Platform transparency
  // Account information (for backward compatibility)
  account?: MoMoAccountInfo;
}

// Extended transaction interface for unified display
export interface TransactionWithAccount extends Omit<Transaction, 'account'> {
  account?: {
    id: string;
    account_name: string;
    account_type: 'bank' | 'mobile_money';
    institution_name: string; // e.g., 'GCB Bank', 'Access Bank' for Mono OR 'MTN Mobile Money' for MTN MoMo
    platform_source?: 'mono' | 'mtn_momo'; // Platform identifier for transparency
  };
}

export interface Account {
  id: string; // UUID
  user_id: string; // UUID
  account_name: string;
  account_type: 'bank' | 'mobile_money';
  institution_name: string; // e.g., 'GCB Bank', 'Access Bank' OR 'MTN Mobile Money'
  balance: number;
  // Platform-specific identifiers (only one will be populated)
  mono_account_id?: string; // For bank accounts via Mono
  mtn_reference_id?: string; // For MTN MoMo accounts
  mtn_phone_number?: string; // MTN MoMo phone number
  last_synced_at: string; // ISO 8601 Timestamp
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MoMoAccountInfo {
  id: string;
  phone_number: string;
  account_name: string;
  is_active: boolean;
}

// Mono API Types
export interface MonoConnectResponse {
  code: string;
  id: string;
}

export interface MonoAccountData {
  id: string;
  account: {
    id: string;
    name: string;
    accountNumber: string;
    type: string;
    balance: number;
    currency: string;
  };
  institution: {
    name: string;
    bankCode: string;
    type: string;
  };
}

export interface MonoLinkingResult {
  success: boolean;
  account?: Account;
  error?: string;
}

// MTN MoMo API Types  
export interface MTNMoMoLinkingResult {
  success: boolean;
  account?: Account;
  error?: string;
}

// Budget Types
export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: string; // Format: 'YYYY-MM-01'
  created_at: string;
  updated_at: string;
  category_name?: string;
  category_icon_name?: string;
}

export interface CreateBudgetRequest {
  category_id: string;
  amount: number;
  month: string; // Format: 'YYYY-MM-01'
}

export interface UpdateBudgetRequest {
  amount: number;
}

export type BudgetStatus = 'on_track' | 'warning' | 'over_budget';

export interface BudgetWithSpending extends Budget {
  spent: number; // Total spent in category for the month
  percentage: number; // (spent / amount) * 100
  remaining: number; // amount - spent
  status: BudgetStatus;
  transaction_count: number; // Number of transactions in category/month
}

// Alert Types
export interface AlertSettings {
  id: string;
  user_id: string;
  budget_alerts_enabled: boolean;
  warning_threshold: number; // Default 90
  over_budget_alerts_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAlertSettingsRequest {
  budget_alerts_enabled?: boolean;
  warning_threshold?: number;
  over_budget_alerts_enabled?: boolean;
}

export interface UpdateAlertSettingsRequest {
  budget_alerts_enabled?: boolean;
  warning_threshold?: number;
  over_budget_alerts_enabled?: boolean;
}

export type AlertType = 'warning' | 'over_budget';

export interface AlertHistory {
  id: string;
  user_id: string;
  budget_id: string;
  alert_type: AlertType;
  sent_at: string;
  notification_id: string | null;
  status: 'sent' | 'failed' | 'pending';
  error_message: string | null;
  spent_amount: number;
  budget_amount: number;
  percentage: number;
  category_name?: string;
  budget_month?: string;
}

// Report Types
export interface MonthlyReport {
  month: string; // 'YYYY-MM' format
  totalIncome: number;
  totalExpenses: number;
  netIncome: number; // totalIncome - totalExpenses
  transactionCount: number;
  incomeTransactionCount: number;
  expenseTransactionCount: number;
  categoryBreakdown: CategorySpending[];
  topCategories: CategorySpending[]; // Top 5 spending categories
  avgTransactionAmount: number;
  largestExpense?: {
    amount: number;
    description?: string;
    category_name?: string;
    date: string;
  };
  largestIncome?: {
    amount: number;
    description?: string;
    category_name?: string;
    date: string;
  };
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  totalAmount: number;
  percentage: number; // percentage of total expenses
  transactionCount: number;
  avgTransactionAmount: number;
  type: 'income' | 'expense';
}

export interface MonthlyReportRequest {
  month: string; // 'YYYY-MM' format
  includeBudgets?: boolean; // Include budget comparison data
}

export interface MonthlyReportSummary {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
}

export interface ReportComparison {
  currentMonth: MonthlyReportSummary;
  previousMonth: MonthlyReportSummary;
  changeIncome: number; // percentage change
  changeExpenses: number; // percentage change
  changeNet: number; // percentage change
}

// Net Worth Types
export type AssetCategory = 'property' | 'investments' | 'cash' | 'vehicles' | 'personal' | 'business' | 'other';
export type AssetType = 
  | 'real_estate' | 'land' | 'rental_property'
  | 'stocks' | 'bonds' | 'mutual_funds' | 'etf' | 'cryptocurrency' | 'retirement_account'
  | 'savings' | 'checking' | 'money_market' | 'cd' | 'foreign_currency'
  | 'car' | 'motorcycle' | 'boat' | 'rv'
  | 'jewelry' | 'art' | 'collectibles' | 'electronics'
  | 'business_equity' | 'business_assets' | 'intellectual_property'
  | 'other';

export type LiabilityCategory = 'loans' | 'credit_cards' | 'mortgages' | 'business_debt' | 'other';
export type LiabilityType = 'mortgage' | 'auto_loan' | 'personal_loan' | 'credit_card' | 'student_loan' | 'business_loan' | 'other';

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  category: AssetCategory;
  asset_type: AssetType;
  current_value: number;
  original_value?: number;
  purchase_date?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Liability {
  id: string;
  user_id: string;
  name: string;
  category: LiabilityCategory;
  liability_type: LiabilityType;
  current_balance: number;
  original_balance?: number;
  interest_rate?: number;
  monthly_payment?: number;
  due_date?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NetWorthSnapshot {
  id: string;
  user_id: string;
  snapshot_date: string;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  connected_accounts_value: number;
  manual_assets_value: number;
  manual_liabilities_value: number;
  created_at: string;
}

export interface NetWorthCalculation {
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  connected_accounts_balance: number;
  manual_assets_total: number;
  manual_liabilities_total: number;
  calculation_date: string;
  assets_breakdown: {
    category: AssetCategory;
    total: number;
    count: number;
  }[];
  liabilities_breakdown: {
    category: LiabilityCategory;
    total: number;
    count: number;
  }[];
}

// Net Worth Request Types
export interface CreateAssetRequest {
  name: string;
  category: AssetCategory;
  asset_type: AssetType;
  current_value: number;
  original_value?: number;
  purchase_date?: string;
  description?: string;
}

export interface UpdateAssetRequest {
  name?: string;
  category?: AssetCategory;
  asset_type?: AssetType;
  current_value?: number;
  original_value?: number;
  purchase_date?: string;
  description?: string;
  is_active?: boolean;
}

export interface CreateLiabilityRequest {
  name: string;
  category: LiabilityCategory;
  liability_type: LiabilityType;
  current_balance: number;
  original_balance?: number;
  interest_rate?: number;
  monthly_payment?: number;
  due_date?: string;
  description?: string;
}

export interface UpdateLiabilityRequest {
  name?: string;
  category?: LiabilityCategory;
  liability_type?: LiabilityType;
  current_balance?: number;
  original_balance?: number;
  interest_rate?: number;
  monthly_payment?: number;
  due_date?: string;
  description?: string;
  is_active?: boolean;
}