export const APP_NAME = 'FinWise';

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  MTN_MOMO_API_USER: 'mtn_momo_api_user',
  MTN_MOMO_API_KEY: 'mtn_momo_api_key',
  ONBOARDING_COMPLETED: 'onboarding_completed',
} as const;

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

export const MTN_MOMO_CONFIG = {
  SUBSCRIPTION_KEY: process.env.EXPO_PUBLIC_MTN_MOMO_SUBSCRIPTION_KEY || '',
  BASE_URL_SANDBOX: process.env.EXPO_PUBLIC_MTN_MOMO_BASE_URL_SANDBOX || 'https://sandbox.momodeveloper.mtn.com',
  BASE_URL_PRODUCTION: process.env.EXPO_PUBLIC_MTN_MOMO_BASE_URL_PRODUCTION || 'https://api.momodeveloper.mtn.com',
  TARGET_ENVIRONMENT: process.env.EXPO_PUBLIC_MTN_MOMO_TARGET_ENVIRONMENT || 'sandbox',
  CALLBACK_HOST: process.env.EXPO_PUBLIC_MTN_MOMO_CALLBACK_HOST || '',
  CURRENCY: 'GHS', // Ghana Cedis
} as const;