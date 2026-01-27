/**
 * Auth Store - Zustand store for app-specific auth state
 * 
 * Note: User authentication state (user, session, isSignedIn) comes from 
 * Clerk's useAuth and useUser hooks. This store only manages app-specific
 * state like onboarding completion.
 */

import { create } from 'zustand';
import { secureStorage, STORAGE_KEYS } from '@/lib';

interface AuthStore {
  // App state
  hydrated: boolean;
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  
  // Actions
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  setOnboardingCompleted: () => Promise<void>;
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  hydrated: false,
  hasCompletedOnboarding: false,
  isLoading: false,

  // Actions
  setLoading: (isLoading) => set({ isLoading }),
  
  setHydrated: (hydrated) => set({ hydrated }),

  setOnboardingCompleted: async () => {
    try {
      await secureStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
      set({ hasCompletedOnboarding: true });
    } catch (error) {
      console.warn('Failed to save onboarding state:', error);
    }
  },

  initialize: async () => {
    if (get().hydrated) {
      return;
    }

    set({ isLoading: true });

    try {
      console.log('Initializing auth store...');
      
      // Validate storage integrity
      const storageValid = await secureStorage.validateStorageIntegrity();
      if (!storageValid) {
        console.warn('Storage integrity failed, cleared corrupted data');
      }
      
      // Check onboarding completion status
      try {
        const onboardingCompleted = await secureStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
        set({ hasCompletedOnboarding: onboardingCompleted === 'true' });
      } catch (error) {
        console.warn('Failed to read onboarding state:', error);
        set({ hasCompletedOnboarding: false });
      }

      console.log('Auth store initialization completed');
      
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      set({ 
        isLoading: false,
        hydrated: true,
      });
    }
  },

  logout: async () => {
    try {
      // Clear local storage
      await secureStorage.clear();
      
      set({
        hasCompletedOnboarding: false,
        isLoading: false,
      });
      
      console.log('Auth store reset complete');
    } catch (error) {
      console.warn('Error during logout:', error);
    }
  },
}));

// Export types for use in components
export type { AuthStore };