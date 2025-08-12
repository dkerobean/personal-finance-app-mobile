import { supabase } from './supabaseClient';
import { handleApiError } from './apiClient';
import { secureStorage, STORAGE_KEYS } from '@/lib';

export interface AuthResult {
  success: boolean;
  message?: string;
  needsVerification?: boolean;
}

export const authService = {
  async signUp(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      if (data.user && !data.user.email_confirmed_at) {
        return {
          success: true,
          needsVerification: true,
          message: 'Verification email sent. Please check your inbox.',
        };
      }

      return {
        success: true,
        message: 'Account created successfully.',
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
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      });

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      if (data.session) {
        await secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.session.access_token);
        await secureStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(data.session));
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