import { create } from 'zustand';
import type { AuthState, AuthActions } from '@/types/store';
import { supabase } from '@/services/supabaseClient';
import { secureStorage, STORAGE_KEYS } from '@/lib';

interface AuthStore extends AuthState, AuthActions {
  hydrated: boolean;
  hasCompletedOnboarding: boolean;
  initialize: () => Promise<void>;
  setOnboardingCompleted: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  isLoading: false,
  isAuthenticated: false,
  hydrated: false,
  hasCompletedOnboarding: false,

  setUser: (user) =>
    set((state) => ({
      user,
      isAuthenticated: !!user,
    })),

  setSession: (session) =>
    set((state) => ({
      session,
      user: session?.user || null,
      isAuthenticated: !!session,
    })),

  setLoading: (isLoading) => set({ isLoading }),

  logout: async () => {
    await secureStorage.clear();
    set({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      hasCompletedOnboarding: false,
    });
  },

  setOnboardingCompleted: async () => {
    try {
      await secureStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
      set({ hasCompletedOnboarding: true });
    } catch (error) {
      console.warn('Failed to save onboarding state:', error);
    }
  },

  initialize: async () => {
    set({ isLoading: true });

    try {
      console.log('Initializing auth store...');
      
      // Check onboarding completion status
      try {
        const onboardingCompleted = await secureStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
        set({ hasCompletedOnboarding: onboardingCompleted === 'true' });
      } catch (error) {
        console.warn('Failed to read onboarding state:', error);
        set({ hasCompletedOnboarding: false });
      }
      
      // Check for existing session with timeout
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session check timeout')), 10000)
      );
      
      const { data: { session }, error } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]) as any;
      
      if (error) {
        console.warn('Session check error:', error.message);
      }
      
      if (session && !error) {
        console.log('Found existing session for:', session.user?.email);
        set({
          session,
          user: session.user,
          isAuthenticated: true,
        });
      } else {
        console.log('No existing session found, clearing storage');
        // Clear any stale data
        try {
          await secureStorage.clear();
        } catch (storageError) {
          console.warn('Storage clear error:', storageError);
        }
      }

      // Set up auth state listener with error handling
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        try {
          if (session) {
            // Only store the access token, not the entire session (which can exceed SecureStore limits)
            try {
              await secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, session.access_token);
            } catch (storageError) {
              console.warn('Failed to store auth token:', storageError);
            }
            
            set({
              session,
              user: session.user,
              isAuthenticated: true,
            });
          } else {
            // Handle logout/expired session
            try {
              await secureStorage.clear();
            } catch (storageError) {
              console.warn('Failed to clear storage:', storageError);
            }
            
            set({
              session: null,
              user: null,
              isAuthenticated: false,
            });
          }
        } catch (authStateError) {
          console.error('Auth state change error:', authStateError);
        }
      });

    } catch (error) {
      console.error('Auth initialization error:', error);
      
      // Try to clear storage, but don't fail if it doesn't work
      try {
        await secureStorage.clear();
      } catch (storageError) {
        console.warn('Failed to clear storage after init error:', storageError);
      }
      
      set({
        session: null,
        user: null,
        isAuthenticated: false,
      });
    } finally {
      console.log('Auth initialization completed');
      set({ 
        isLoading: false,
        hydrated: true,
      });
    }
  },
}));