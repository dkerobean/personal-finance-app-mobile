export interface EmailTemplate {
  firstName?: string;
  verificationCode: string;
  appName: string;
  companyName?: string;
  supportEmail?: string;
  expirationMinutes: number;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  id?: string;
  error?: string;
}

export interface OTPData {
  code: string;
  email: string;
  expiresAt: number;
  attempts: number;
  createdAt: number;
}

export interface OTPValidationResult {
  success: boolean;
  message: string;
  isExpired?: boolean;
  attemptsExceeded?: boolean;
}

export interface ResendEmailOptions {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
}

export interface RateLimitInfo {
  canSend: boolean;
  nextAllowedTime?: number;
  remainingAttempts: number;
}