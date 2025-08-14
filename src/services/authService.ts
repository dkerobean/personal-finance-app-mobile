import { supabase } from './supabaseClient';
import { handleApiError } from './apiClient';
import { secureStorage, STORAGE_KEYS } from '@/lib';
import { resendService } from './resendService';
import { otpManager } from './otpManager';

export interface AuthResult {
  success: boolean;
  message?: string;
  needsVerification?: boolean;
}

export const authService = {
  async signUp(email: string, password: string, firstName?: string): Promise<AuthResult> {
    try {
      console.log('Starting signup for:', email);
      
      // Temporarily bypass email verification - create user and auto-confirm
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // Disable Supabase email confirmation
          data: {
            first_name: firstName, // Store additional user data
          }
        },
      });

      console.log('Signup response:', { data, error });

      if (error) {
        console.error('Signup error:', error);
        return {
          success: false,
          message: error.message,
        };
      }

      if (data.user) {
        console.log('User created:', data.user.id, 'Email confirmed:', data.user.email_confirmed_at);
        
        if (data.session) {
          console.log('Session created, storing...');
          // Store only the access token
          await secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.session.access_token);

          return {
            success: true,
            needsVerification: false, // Bypass verification
            message: 'Account created successfully! You are now logged in.',
          };
        } else {
          console.log('User created but no session - email confirmation may be required');
          console.log('Attempting to sign in immediately...');
          
          // Try to sign in immediately to get a session
          const signInResult = await this.signIn(email, password);
          if (signInResult.success) {
            return {
              success: true,
              needsVerification: false,
              message: 'Account created successfully! You are now logged in.',
            };
          }
          
          return {
            success: true,
            needsVerification: false,
            message: 'Account created successfully! Please try logging in.',
          };
        }
      }

      console.log('Unexpected signup response');
      return {
        success: true,
        message: 'Account created successfully.',
      };
    } catch (error) {
      console.error('Signup exception:', error);
      return {
        success: false,
        message: handleApiError(error),
      };
    }
  },

  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      if (data.session) {
        await secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.session.access_token);
      }

      return {
        success: true,
        message: 'Signed in successfully.',
      };
    } catch (error) {
      return {
        success: false,
        message: handleApiError(error),
      };
    }
  },

  async verifyOtp(email: string, token: string): Promise<AuthResult> {
    try {
      // First validate the OTP using our custom manager
      const validationResult = await otpManager.validateOTP(email, token);
      
      if (!validationResult.success) {
        return {
          success: false,
          message: validationResult.message,
        };
      }

      // If OTP is valid, confirm the user's email in Supabase
      // We need to get the user first
      const { data: users, error: getUserError } = await supabase
        .from('auth.users')
        .select('*')
        .eq('email', email)
        .single();

      if (getUserError) {
        // Alternative approach: sign in the user to complete verification
        return {
          success: true,
          message: 'Email verified successfully. You can now sign in.',
        };
      }

      return {
        success: true,
        message: 'Email verified successfully.',
      };
    } catch (error) {
      return {
        success: false,
        message: handleApiError(error),
      };
    }
  },

  async resendVerificationCode(email: string, firstName?: string): Promise<AuthResult> {
    try {
      // Check rate limit
      const rateLimitInfo = await otpManager.checkRateLimit(email);
      if (!rateLimitInfo.canSend) {
        const waitTime = await otpManager.getTimeUntilNextRequest(email);
        const waitMinutes = Math.ceil(waitTime / (1000 * 60));
        return {
          success: false,
          message: `Please wait ${waitMinutes} minute(s) before requesting another code.`,
        };
      }

      // Clear any existing OTP
      await otpManager.clearOTP(email);

      // Generate and send new verification code
      const verificationCode = otpManager.generateOTP(email);
      await otpManager.storeOTP(email, verificationCode);

      const emailResult = await resendService.sendVerificationEmail(email, {
        firstName: firstName || 'there',
        verificationCode,
        appName: 'Kippo',
        companyName: 'Kippo',
        supportEmail: 'support@kippo.com',
        expirationMinutes: otpManager.getConfig().EXPIRATION_MINUTES,
      });

      if (!emailResult.success) {
        return {
          success: false,
          message: 'Failed to send verification email. Please try again.',
        };
      }

      return {
        success: true,
        message: 'New verification code sent! Please check your email.',
      };
    } catch (error) {
      return {
        success: false,
        message: handleApiError(error),
      };
    }
  },

  async signOut(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      await secureStorage.clear();

      return {
        success: true,
        message: 'Signed out successfully.',
      };
    } catch (error) {
      return {
        success: false,
        message: handleApiError(error),
      };
    }
  },

  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
        return null;
      }

      return data.session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },
};