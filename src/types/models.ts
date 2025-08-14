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
}