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
  amount: number;
  type: TransactionType;
  category_id: string;
  transaction_date: string;
  description?: string;
  created_at: string;
  updated_at: string;
  category?: Category;
  momo_external_id?: string;
  momo_transaction_id?: string;
  momo_reference_id?: string;
  momo_status?: string;
  momo_payer_info?: string;
  momo_financial_transaction_id?: string;
  merchant_name?: string;
  auto_categorized?: boolean;
  categorization_confidence?: number;
  account?: MoMoAccountInfo;
}

export interface MoMoAccountInfo {
  id: string;
  phone_number: string;
  account_name: string;
  is_active: boolean;
}