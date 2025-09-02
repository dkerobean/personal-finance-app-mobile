import { create } from 'zustand';
import type { AuthState, AuthActions } from '@/types/store';
import { supabase } from '@/services/supabaseClient';
import { secureStorage, STORAGE_KEYS } from '@/lib';

interface AuthStore extends AuthState, AuthActions {
  hydrated: boolean;
  hasCompletedOnboarding: boolean;
  initialize: () => Promise<void>;
  setOnboardingCompleted: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  validateSession: () => Promise<boolean>;
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
    try {
      // Sign out from Supabase first
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('Error signing out from Supabase:', error);
      }
    } catch (error) {
      console.warn('Exception during Supabase signout:', error);
    }

    // Clear storage regardless of Supabase signout result
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
    const retrySession = async (attempt: number = 1): Promise<{ session: any; error?: any }> => {
      const maxRetries = 3;
      const baseDelay = 1000; // 1 second
      
      try {
        console.log(`Session check attempt ${attempt}/${maxRetries}`);
        
        // Check for existing session with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 10000)
        );
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        return { session, error };
      } catch (error) {
        console.warn(`Session check attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return retrySession(attempt + 1);
        }
        
        throw error;
      }
    };

    set({ isLoading: true });

    try {
      console.log('Initializing auth store...');
      
      // Validate storage integrity first
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
      
      // Try to get session with retries
      let session = null;
      let sessionError = null;
      
      try {
        const result = await retrySession();
        session = result.session;
        sessionError = result.error;
      } catch (error) {
        console.error('All session check attempts failed:', error);
        sessionError = error;
      }
      
      if (session && !sessionError) {
        console.log('Found existing session for:', session.user?.email);
        
        // Validate session before trusting it
        const isSessionValid = await get().validateSession();
        if (isSessionValid) {
          await secureStorage.storeSession(session.access_token, session.refresh_token);
          set({
            session,
            user: session.user,
            isAuthenticated: true,
          });
        } else {
          console.log('Session validation failed, clearing...');
          await secureStorage.clearAuthData();
          session = null;
        }
      }
      
      // Fallback: try token-based recovery if session check failed
      if (!session) {
        console.log('No valid session found, attempting token-based recovery...');
        const storedSession = await secureStorage.getStoredSession();
        
        if (storedSession.accessToken) {
          console.log('Found stored token, attempting recovery...');
          
          try {
            // Try to get user info with stored token
            const { data: { user }, error: userError } = await supabase.auth.getUser(storedSession.accessToken);
            
            if (user && !userError) {
              console.log('Token-based recovery successful for:', user.email);
              
              // Create a minimal session object for internal use
              const recoveredSession = {
                access_token: storedSession.accessToken,
                refresh_token: storedSession.refreshToken,
                token_type: 'bearer',
                expires_in: 3600,
                expires_at: Math.floor(Date.now() / 1000) + 3600,
                user,
              };
              
              set({
                session: recoveredSession,
                user,
                isAuthenticated: true,
              });
              
              // Try to refresh for a proper session
              setTimeout(() => {
                get().refreshSession().catch(console.warn);
              }, 1000);
            } else {
              console.log('Token-based recovery failed, clearing storage');
              await secureStorage.clearAuthData();
            }
          } catch (recoveryError) {
            console.warn('Token recovery attempt failed:', recoveryError);
            await secureStorage.clearAuthData();
          }
        } else {
          console.log('No stored tokens found');
        }
      }

      // Set up auth state listener with error handling
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        try {
          if (session) {
            // Store session data using enhanced storage
            try {
              await secureStorage.storeSession(session.access_token, session.refresh_token);
            } catch (storageError) {
              console.warn('Failed to store session data:', storageError);
            }
            
            set({
              session,
              user: session.user,
              isAuthenticated: true,
            });
          } else {
            // Handle logout/expired session
            try {
              await secureStorage.clearAuthData();
            } catch (storageError) {
              console.warn('Failed to clear auth storage:', storageError);
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
        await secureStorage.clearAuthData();
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

  refreshSession: async (): Promise<boolean> => {
    try {
      console.log('Attempting to refresh session...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        console.warn('Session refresh failed:', error?.message);
        return false;
      }
      
      console.log('Session refreshed successfully');
      await secureStorage.storeSession(data.session.access_token, data.session.refresh_token);
      
      set({
        session: data.session,
        user: data.session.user,
        isAuthenticated: true,
      });
      
      return true;
    } catch (error) {
      console.error('Exception during session refresh:', error);
      return false;
    }
  },

  validateSession: async (): Promise<boolean> => {
    try {
      const { session } = get();
      
      if (!session) {
        console.log('No session to validate');
        return false;
      }
      
      // Check if session is expired
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        console.log('Session expired, attempting refresh...');
        return await get().refreshSession();
      }
      
      // Check if session is close to expiring (< 5 minutes)
      if (session.expires_at && (session.expires_at - now) < 300) {
        console.log('Session expiring soon, preemptively refreshing...');
        return await get().refreshSession();
      }
      
      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  },
}));