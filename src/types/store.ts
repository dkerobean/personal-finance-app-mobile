import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import type { Category, Transaction, TransactionType } from './models';

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