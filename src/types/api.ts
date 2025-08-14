export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError['error'];
}

export interface SignUpRequest {
  email: string;
  password: string;
}

export interface VerifyOtpRequest {
  email: string;
  token: string;
}

export interface CreateCategoryRequest {
  name: string;
  icon_name: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  icon_name?: string;
}

export interface CategoryResponse {
  id: string;
  user_id: string | null;
  name: string;
  icon_name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionRequest {
  amount: number;
  type: 'income' | 'expense';
  category_id: string;
  transaction_date: string;
  description?: string;
}

export interface UpdateTransactionRequest {
  amount?: number;
  type?: 'income' | 'expense';
  category_id?: string;
  transaction_date?: string;
  description?: string;
}

export interface TransactionResponse {
  id: string;
  user_id: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: string;
  transaction_date: string;
  description?: string;
  created_at: string;
  updated_at: string;
}