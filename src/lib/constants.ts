export const APP_NAME = 'Personal Finance App';

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_SESSION: 'user_session',
} as const;

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;