import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import type { Category, Transaction, TransactionType, Budget, CreateBudgetRequest, UpdateBudgetRequest, BudgetWithSpending, AlertSettings, CreateAlertSettingsRequest, UpdateAlertSettingsRequest, AlertHistory, MonthlyReport, MonthlyReportRequest, ReportComparison } from './models';

export interface AuthState {
  user: SupabaseUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hydrated: boolean;
}

export interface AuthActions {
  setUser: (user: SupabaseUser | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
}

export interface CategoryActions {
  loadCategories: () => Promise<void>;
  createCategory: (name: string, iconName: string) => Promise<boolean>;
  updateCategory: (id: string, name?: string, iconName?: string) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  seedDefaults: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  sortOrder: 'asc' | 'desc';
}

export interface TransactionActions {
  loadTransactions: () => Promise<void>;
  createTransaction: (
    amount: number,
    type: TransactionType,
    categoryId: string,
    date: string,
    description?: string
  ) => Promise<boolean>;
  updateTransaction: (
    id: string,
    amount?: number,
    type?: TransactionType,
    categoryId?: string,
    date?: string,
    description?: string
  ) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export interface BudgetState {
  budgets: Budget[];
  budgetsWithSpending: BudgetWithSpending[];
  isLoading: boolean;
  isTrackingLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export interface BudgetActions {
  loadBudgets: () => Promise<void>;
  createBudget: (request: CreateBudgetRequest) => Promise<boolean>;
  updateBudget: (id: string, request: UpdateBudgetRequest) => Promise<boolean>;
  deleteBudget: (id: string) => Promise<boolean>;
  getBudgetsForMonth: (month: string) => Budget[];
  getBudgetByCategory: (categoryId: string, month: string) => Budget | undefined;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  // Tracking-specific actions
  fetchBudgetTracking: (month?: string) => Promise<void>;
  refreshBudgetSpending: () => Promise<void>;
  getBudgetProgress: (budgetId: string) => BudgetWithSpending | undefined;
  getBudgetsWithSpendingForMonth: (month: string) => BudgetWithSpending[];
  setTrackingLoading: (loading: boolean) => void;
  onTransactionChanged: () => void;
  subscribeToTransactionChanges: () => () => void;
}

export interface AlertState {
  alertSettings: AlertSettings | null;
  alertHistory: AlertHistory[];
  isLoading: boolean;
  error: string | null;
}

export interface AlertActions {
  fetchAlertSettings: () => Promise<void>;
  updateAlertSettings: (request: UpdateAlertSettingsRequest) => Promise<boolean>;
  sendTestNotification: () => Promise<boolean>;
  fetchAlertHistory: (limit?: number) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export interface ReportsState {
  currentReport: MonthlyReport | null;
  reportHistory: Map<string, MonthlyReport>; // month -> report cache
  selectedMonth: string; // 'YYYY-MM' format
  availableMonths: string[]; // Last 12 months
  comparison: ReportComparison | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export interface ReportsActions {
  fetchMonthlyReport: (month: string) => Promise<void>;
  setSelectedMonth: (month: string) => void;
  refreshCurrentReport: () => Promise<void>;
  fetchReportComparison: (currentMonth: string, previousMonth: string) => Promise<void>;
  clearReportData: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Selectors
  getCurrentReport: () => MonthlyReport | null;
  getReportForMonth: (month: string) => MonthlyReport | null;
  getAvailableMonths: () => string[];
  getCachedReports: () => Map<string, MonthlyReport>;
}