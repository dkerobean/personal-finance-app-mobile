import { create } from 'zustand';
import type { AuthState, AuthActions } from '@/types/store';
import { supabase } from '@/services/supabaseClient';
import { secureStorage, STORAGE_KEYS } from '@/lib';

interface AuthStore extends AuthState, AuthActions {
  hydrated: boolean;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  isLoading: false,
  isAuthenticated: false,
  hydrated: false,

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
    });
  },

  initialize: async () => {
    set({ isLoading: true });

    try {
      // Check for existing session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session && !error) {
        set({
          session,
          user: session.user,
          isAuthenticated: true,
        });
      } else {
        // Clear any stale data
        await secureStorage.clear();
      }

      // Set up auth state listener
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        if (session) {
          // Only store the access token, not the entire session (which can exceed SecureStore limits)
          await secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, session.access_token);
          
          set({
            session,
            user: session.user,
            isAuthenticated: true,
          });
        } else {
          // Handle logout/expired session
          await secureStorage.clear();
          set({
            session: null,
            user: null,
            isAuthenticated: false,
          });
        }
      });

    } catch (error) {
      console.error('Auth initialization error:', error);
      await secureStorage.clear();
      set({
        session: null,
        user: null,
        isAuthenticated: false,
      });
    } finally {
      set({ 
        isLoading: false,
        hydrated: true,
      });
    }
  },
}));