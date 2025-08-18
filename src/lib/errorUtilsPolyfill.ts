// Error utility functions for MTN MoMo integration
// This provides standardized error handling across the application

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  context?: string;
}

export class MoMoError extends Error {
  public code: string;
  public details?: any;
  public context?: string;

  constructor(code: string, message: string, details?: any, context?: string) {
    super(message);
    this.name = 'MoMoError';
    this.code = code;
    this.details = details;
    this.context = context;
  }

  toAppError(): AppError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: new Date().toISOString(),
      context: this.context,
    };
  }
}

export class ValidationError extends Error {
  public field: string;
  public value: any;

  constructor(field: string, message: string, value?: any) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

// Error codes for MTN MoMo operations
export const ERROR_CODES = {
  // Network and API errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_TIMEOUT: 'API_TIMEOUT',
  API_UNAUTHORIZED: 'API_UNAUTHORIZED',
  API_FORBIDDEN: 'API_FORBIDDEN',
  API_NOT_FOUND: 'API_NOT_FOUND',
  API_SERVER_ERROR: 'API_SERVER_ERROR',
  
  // MTN MoMo specific errors
  MOMO_INVALID_CREDENTIALS: 'MOMO_INVALID_CREDENTIALS',
  MOMO_INSUFFICIENT_FUNDS: 'MOMO_INSUFFICIENT_FUNDS',
  MOMO_INVALID_PHONE_NUMBER: 'MOMO_INVALID_PHONE_NUMBER',
  MOMO_TRANSACTION_FAILED: 'MOMO_TRANSACTION_FAILED',
  MOMO_SERVICE_UNAVAILABLE: 'MOMO_SERVICE_UNAVAILABLE',
  
  // Account linking errors
  ACCOUNT_ALREADY_LINKED: 'ACCOUNT_ALREADY_LINKED',
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  
  // Synchronization errors
  SYNC_IN_PROGRESS: 'SYNC_IN_PROGRESS',
  SYNC_FAILED: 'SYNC_FAILED',
  SYNC_PARTIAL: 'SYNC_PARTIAL',
  
  // Validation errors
  VALIDATION_REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  VALIDATION_INVALID_RANGE: 'VALIDATION_INVALID_RANGE',
  
  // Authorization errors
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  AUTH_PERMISSION_DENIED: 'AUTH_PERMISSION_DENIED',
} as const;

// User-friendly error messages
export const ERROR_MESSAGES = {
  [ERROR_CODES.NETWORK_ERROR]: 'Unable to connect to the server. Please check your internet connection.',
  [ERROR_CODES.API_TIMEOUT]: 'The request timed out. Please try again.',
  [ERROR_CODES.API_UNAUTHORIZED]: 'Your session has expired. Please log in again.',
  [ERROR_CODES.API_FORBIDDEN]: 'You do not have permission to perform this action.',
  [ERROR_CODES.API_NOT_FOUND]: 'The requested resource was not found.',
  [ERROR_CODES.API_SERVER_ERROR]: 'A server error occurred. Please try again later.',
  
  [ERROR_CODES.MOMO_INVALID_CREDENTIALS]: 'Invalid MTN MoMo credentials. Please check your account details.',
  [ERROR_CODES.MOMO_INSUFFICIENT_FUNDS]: 'Insufficient funds in your MTN MoMo account.',
  [ERROR_CODES.MOMO_INVALID_PHONE_NUMBER]: 'Please enter a valid MTN phone number.',
  [ERROR_CODES.MOMO_TRANSACTION_FAILED]: 'Transaction failed. Please try again.',
  [ERROR_CODES.MOMO_SERVICE_UNAVAILABLE]: 'MTN MoMo service is temporarily unavailable.',
  
  [ERROR_CODES.ACCOUNT_ALREADY_LINKED]: 'This MTN MoMo account is already linked to your profile.',
  [ERROR_CODES.ACCOUNT_NOT_FOUND]: 'MTN MoMo account not found.',
  [ERROR_CODES.ACCOUNT_INACTIVE]: 'This MTN MoMo account is inactive.',
  
  [ERROR_CODES.SYNC_IN_PROGRESS]: 'A sync operation is already in progress.',
  [ERROR_CODES.SYNC_FAILED]: 'Failed to sync transactions. Please try again.',
  [ERROR_CODES.SYNC_PARTIAL]: 'Some transactions could not be synced.',
  
  [ERROR_CODES.VALIDATION_REQUIRED_FIELD]: 'This field is required.',
  [ERROR_CODES.VALIDATION_INVALID_FORMAT]: 'Please enter a valid format.',
  [ERROR_CODES.VALIDATION_INVALID_RANGE]: 'Value is outside the allowed range.',
  
  [ERROR_CODES.AUTH_TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
  [ERROR_CODES.AUTH_USER_NOT_FOUND]: 'User account not found.',
  [ERROR_CODES.AUTH_PERMISSION_DENIED]: 'You do not have permission to access this resource.',
} as const;

// Validation functions
export const validators = {
  phoneNumber: (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    // Ghana phone numbers: 10 digits starting with 2 (for country code 233)
    // or 9 digits for local format
    return (cleaned.length === 10 && cleaned.startsWith('2')) || 
           (cleaned.length === 9);
  },

  amount: (amount: string | number): boolean => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return !isNaN(num) && num > 0 && num <= 100000; // Max 100,000 GHS
  },

  accountName: (name: string): boolean => {
    return name.trim().length >= 2 && name.trim().length <= 50;
  },

  description: (desc: string): boolean => {
    return desc.trim().length <= 255;
  },
};

// Error handling utilities
export const handleMoMoApiError = (error: any): MoMoError => {
  // Handle different types of errors from MTN MoMo API
  if (error?.response) {
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        return new MoMoError(
          ERROR_CODES.VALIDATION_INVALID_FORMAT,
          data?.message || ERROR_MESSAGES[ERROR_CODES.VALIDATION_INVALID_FORMAT],
          data,
          'MTN MoMo API'
        );
      case 401:
        return new MoMoError(
          ERROR_CODES.API_UNAUTHORIZED,
          ERROR_MESSAGES[ERROR_CODES.API_UNAUTHORIZED],
          data,
          'MTN MoMo API'
        );
      case 403:
        return new MoMoError(
          ERROR_CODES.API_FORBIDDEN,
          ERROR_MESSAGES[ERROR_CODES.API_FORBIDDEN],
          data,
          'MTN MoMo API'
        );
      case 404:
        return new MoMoError(
          ERROR_CODES.API_NOT_FOUND,
          ERROR_MESSAGES[ERROR_CODES.API_NOT_FOUND],
          data,
          'MTN MoMo API'
        );
      case 500:
      case 502:
      case 503:
        return new MoMoError(
          ERROR_CODES.MOMO_SERVICE_UNAVAILABLE,
          ERROR_MESSAGES[ERROR_CODES.MOMO_SERVICE_UNAVAILABLE],
          data,
          'MTN MoMo API'
        );
      default:
        return new MoMoError(
          ERROR_CODES.API_SERVER_ERROR,
          ERROR_MESSAGES[ERROR_CODES.API_SERVER_ERROR],
          data,
          'MTN MoMo API'
        );
    }
  }

  if (error?.code === 'NETWORK_ERR' || error?.message?.includes('Network')) {
    return new MoMoError(
      ERROR_CODES.NETWORK_ERROR,
      ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR],
      error,
      'Network'
    );
  }

  if (error?.code === 'TIMEOUT' || error?.message?.includes('timeout')) {
    return new MoMoError(
      ERROR_CODES.API_TIMEOUT,
      ERROR_MESSAGES[ERROR_CODES.API_TIMEOUT],
      error,
      'Request Timeout'
    );
  }

  // Generic error
  return new MoMoError(
    ERROR_CODES.API_SERVER_ERROR,
    error?.message || ERROR_MESSAGES[ERROR_CODES.API_SERVER_ERROR],
    error,
    'Unknown'
  );
};

// Validation helper
export const validateInput = (
  field: string, 
  value: any, 
  validator: (val: any) => boolean,
  customMessage?: string
): void => {
  if (!validator(value)) {
    throw new ValidationError(
      field,
      customMessage || ERROR_MESSAGES[ERROR_CODES.VALIDATION_INVALID_FORMAT],
      value
    );
  }
};

// Error logging utility
export const logError = (error: Error | MoMoError, context?: string): void => {
  const errorData = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context: context || 'Unknown',
  };

  if (error instanceof MoMoError) {
    Object.assign(errorData, {
      code: error.code,
      details: error.details,
      momoContext: error.context,
    });
  }

  console.error('Application Error:', errorData);
  
  // In production, you might want to send this to a logging service
  // like Sentry, LogRocket, or your own logging endpoint
};

// Helper to get user-friendly error message
export const getUserFriendlyErrorMessage = (error: Error | MoMoError): string => {
  if (error instanceof MoMoError) {
    return ERROR_MESSAGES[error.code as keyof typeof ERROR_MESSAGES] || error.message;
  }

  if (error instanceof ValidationError) {
    return error.message;
  }

  // Fallback for unknown errors
  return 'An unexpected error occurred. Please try again.';
};