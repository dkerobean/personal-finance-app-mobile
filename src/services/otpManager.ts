import { secureStorage } from '@/lib';
import { OTPData, OTPValidationResult, RateLimitInfo } from '@/types/email';

const OTP_STORAGE_PREFIX = 'otp_';
const RATE_LIMIT_PREFIX = 'rate_limit_';

const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRATION_MINUTES: 10,
  MAX_ATTEMPTS: 3,
  RATE_LIMIT_MINUTES: 1, // 1 minute between requests
  MAX_DAILY_REQUESTS: 5, // Max 5 OTP requests per day per email
};

export const otpManager = {
  /**
   * Generate a new OTP code for the given email
   */
  generateOTP(email: string): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return code;
  },

  /**
   * Store OTP data securely
   */
  async storeOTP(email: string, code: string): Promise<void> {
    const otpData: OTPData = {
      code,
      email,
      expiresAt: Date.now() + (OTP_CONFIG.EXPIRATION_MINUTES * 60 * 1000),
      attempts: 0,
      createdAt: Date.now(),
    };

    await secureStorage.setItem(
      `${OTP_STORAGE_PREFIX}${email}`,
      JSON.stringify(otpData)
    );
  },

  /**
   * Validate an OTP code
   */
  async validateOTP(email: string, inputCode: string): Promise<OTPValidationResult> {
    try {
      const storedData = await secureStorage.getItem(`${OTP_STORAGE_PREFIX}${email}`);
      
      if (!storedData) {
        return {
          success: false,
          message: 'No verification code found. Please request a new one.',
        };
      }

      const otpData: OTPData = JSON.parse(storedData);

      // Check if code has expired
      if (Date.now() > otpData.expiresAt) {
        await this.clearOTP(email);
        return {
          success: false,
          message: 'Verification code has expired. Please request a new one.',
          isExpired: true,
        };
      }

      // Check if max attempts exceeded
      if (otpData.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
        await this.clearOTP(email);
        return {
          success: false,
          message: 'Too many failed attempts. Please request a new verification code.',
          attemptsExceeded: true,
        };
      }

      // Increment attempts
      otpData.attempts++;
      await secureStorage.setItem(
        `${OTP_STORAGE_PREFIX}${email}`,
        JSON.stringify(otpData)
      );

      // Validate code
      if (inputCode.trim() !== otpData.code) {
        const remainingAttempts = OTP_CONFIG.MAX_ATTEMPTS - otpData.attempts;
        return {
          success: false,
          message: `Invalid verification code. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`,
        };
      }

      // Success - clear the OTP
      await this.clearOTP(email);
      return {
        success: true,
        message: 'Email verified successfully!',
      };

    } catch (error) {
      console.error('Error validating OTP:', error);
      return {
        success: false,
        message: 'Error validating verification code. Please try again.',
      };
    }
  },

  /**
   * Clear OTP data for an email
   */
  async clearOTP(email: string): Promise<void> {
    await secureStorage.removeItem(`${OTP_STORAGE_PREFIX}${email}`);
  },

  /**
   * Check rate limiting for OTP requests
   */
  async checkRateLimit(email: string): Promise<RateLimitInfo> {
    try {
      const rateLimitKey = `${RATE_LIMIT_PREFIX}${email}`;
      const storedData = await secureStorage.getItem(rateLimitKey);
      
      const now = Date.now();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayStartTime = todayStart.getTime();

      if (!storedData) {
        // First request
        const rateLimitData = {
          lastRequestTime: now,
          dailyCount: 1,
          lastResetDate: todayStartTime,
        };
        
        await secureStorage.setItem(rateLimitKey, JSON.stringify(rateLimitData));
        
        return {
          canSend: true,
          remainingAttempts: OTP_CONFIG.MAX_DAILY_REQUESTS - 1,
        };
      }

      const rateLimitData = JSON.parse(storedData);

      // Reset daily count if it's a new day
      if (rateLimitData.lastResetDate < todayStartTime) {
        rateLimitData.dailyCount = 0;
        rateLimitData.lastResetDate = todayStartTime;
      }

      // Check if enough time has passed since last request
      const timeSinceLastRequest = now - rateLimitData.lastRequestTime;
      const rateLimitMs = OTP_CONFIG.RATE_LIMIT_MINUTES * 60 * 1000;

      if (timeSinceLastRequest < rateLimitMs) {
        const nextAllowedTime = rateLimitData.lastRequestTime + rateLimitMs;
        return {
          canSend: false,
          nextAllowedTime,
          remainingAttempts: Math.max(0, OTP_CONFIG.MAX_DAILY_REQUESTS - rateLimitData.dailyCount),
        };
      }

      // Check daily limit
      if (rateLimitData.dailyCount >= OTP_CONFIG.MAX_DAILY_REQUESTS) {
        return {
          canSend: false,
          remainingAttempts: 0,
        };
      }

      // Update rate limit data
      rateLimitData.lastRequestTime = now;
      rateLimitData.dailyCount++;
      
      await secureStorage.setItem(rateLimitKey, JSON.stringify(rateLimitData));

      return {
        canSend: true,
        remainingAttempts: OTP_CONFIG.MAX_DAILY_REQUESTS - rateLimitData.dailyCount,
      };

    } catch (error) {
      console.error('Error checking rate limit:', error);
      // In case of error, allow the request but with caution
      return {
        canSend: true,
        remainingAttempts: 1,
      };
    }
  },

  /**
   * Get remaining time until next OTP request is allowed
   */
  async getTimeUntilNextRequest(email: string): Promise<number> {
    try {
      const rateLimitKey = `${RATE_LIMIT_PREFIX}${email}`;
      const storedData = await secureStorage.getItem(rateLimitKey);
      
      if (!storedData) {
        return 0;
      }

      const rateLimitData = JSON.parse(storedData);
      const now = Date.now();
      const timeSinceLastRequest = now - rateLimitData.lastRequestTime;
      const rateLimitMs = OTP_CONFIG.RATE_LIMIT_MINUTES * 60 * 1000;

      if (timeSinceLastRequest >= rateLimitMs) {
        return 0;
      }

      return rateLimitMs - timeSinceLastRequest;
    } catch (error) {
      console.error('Error getting time until next request:', error);
      return 0;
    }
  },

  /**
   * Clear all rate limit data (useful for testing or admin functions)
   */
  async clearRateLimit(email: string): Promise<void> {
    await secureStorage.removeItem(`${RATE_LIMIT_PREFIX}${email}`);
  },

  /**
   * Get OTP configuration
   */
  getConfig() {
    return { ...OTP_CONFIG };
  },

  /**
   * Check if an OTP exists for the given email
   */
  async hasValidOTP(email: string): Promise<boolean> {
    try {
      const storedData = await secureStorage.getItem(`${OTP_STORAGE_PREFIX}${email}`);
      
      if (!storedData) {
        return false;
      }

      const otpData: OTPData = JSON.parse(storedData);
      
      // Check if expired
      if (Date.now() > otpData.expiresAt) {
        await this.clearOTP(email);
        return false;
      }

      // Check if max attempts exceeded
      if (otpData.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
        await this.clearOTP(email);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking for valid OTP:', error);
      return false;
    }
  },
};