import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from './constants';

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error getting item from secure storage:', error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('Error setting item in secure storage:', error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error removing item from secure storage:', error);
    }
  },

  async clear(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.SESSION_CREATED_AT);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ONBOARDING_COMPLETED);
    } catch (error) {
      console.error('Error clearing secure storage:', error);
    }
  },

  async clearAuthData(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.SESSION_CREATED_AT);
    } catch (error) {
      console.error('Error clearing auth data from secure storage:', error);
    }
  },

  async storeSession(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }
      await SecureStore.setItemAsync(STORAGE_KEYS.SESSION_CREATED_AT, Date.now().toString());
    } catch (error) {
      console.error('Error storing session data:', error);
    }
  },

  async getStoredSession(): Promise<{ accessToken: string | null, refreshToken: string | null, createdAt: number | null }> {
    try {
      const [accessToken, refreshToken, createdAtStr] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN),
        SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.getItemAsync(STORAGE_KEYS.SESSION_CREATED_AT),
      ]);

      return {
        accessToken,
        refreshToken,
        createdAt: createdAtStr ? parseInt(createdAtStr, 10) : null,
      };
    } catch (error) {
      console.error('Error getting stored session:', error);
      return { accessToken: null, refreshToken: null, createdAt: null };
    }
  },

  async validateStorageIntegrity(): Promise<boolean> {
    try {
      const { accessToken, createdAt } = await this.getStoredSession();
      
      // Basic integrity checks
      if (accessToken && !createdAt) {
        console.warn('Storage integrity issue: token exists but no creation timestamp');
        await this.clearAuthData();
        return false;
      }

      // Check if token is suspiciously old (> 7 days)
      if (createdAt && Date.now() - createdAt > 7 * 24 * 60 * 60 * 1000) {
        console.warn('Storage integrity issue: token is older than 7 days');
        await this.clearAuthData();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating storage integrity:', error);
      await this.clearAuthData();
      return false;
    }
  },
};