import { TransactionType } from './models';

// Re-export TransactionType for use in other modules
export { TransactionType } from './models';

// MTN MoMo API Request/Response Types
export interface MoMoApiUser {
  referenceId: string;
  callbackHost?: string;
  providerCallbackHost?: string;
}

export interface MoMoApiKey {
  apiKey: string;
}

export interface MoMoAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface MoMoPayerInfo {
  partyIdType: 'MSISDN' | 'EMAIL';
  partyId: string;
}

export interface MoMoPaymentRequest {
  amount: string;
  currency: string;
  externalId: string;
  payer: MoMoPayerInfo;
  payerMessage: string;
  payeeNote: string;
}

export enum MoMoTransactionStatus {
  PENDING = 'PENDING',
  SUCCESSFUL = 'SUCCESSFUL',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT'
}

export interface MoMoTransactionStatusResponse {
  amount: string;
  currency: string;
  externalId: string;
  payer: MoMoPayerInfo;
  payerMessage: string;
  payeeNote: string;
  status: MoMoTransactionStatus;
  reason?: string;
  errorCategory?: string;
  errorCode?: string;
  errorDescription?: string;
  partyId: string;
  financialTransactionId?: string;
}

export interface MoMoAccountBalance {
  availableBalance: string;
  currency: string;
}

// Enhanced Transaction Types for MTN MoMo Integration
export interface MoMoTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  category_id: string;
  transaction_date: string;
  description?: string;
  created_at: string;
  updated_at: string;
  
  // MTN MoMo specific fields
  momo_transaction_id?: string;
  momo_external_id?: string;
  momo_reference_id?: string;
  momo_status: MoMoTransactionStatus;
  momo_payer_info?: MoMoPayerInfo;
  momo_financial_transaction_id?: string;
  merchant_name?: string;
  location?: string;
  auto_categorized: boolean;
  categorization_confidence?: number;
  
  // Related data
  category?: {
    id: string;
    name: string;
    icon_name?: string;
  };
}

// Transaction Categorization Types
export interface TransactionCategory {
  id: string;
  name: string;
  type: TransactionType;
  subcategories?: string[];
  keywords: string[];
  merchant_patterns?: RegExp[];
}

export interface CategoryClassificationResult {
  category_id: string;
  confidence: number;
  reasons: string[];
  suggested_type: TransactionType;
}

// MTN MoMo Service Configuration
export interface MoMoServiceConfig {
  subscriptionKey: string;
  baseUrl: string;
  targetEnvironment: string;
  callbackHost?: string;
  currency: string;
}

// Error Types
export interface MoMoApiError {
  code: string;
  message: string;
  details?: any;
  timestamp?: string;
}

export interface MoMoServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: MoMoApiError;
}

// User Account Link for MTN MoMo
export interface MoMoAccountLink {
  id: string;
  user_id: string;
  phone_number: string;
  account_name: string;
  is_active: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}