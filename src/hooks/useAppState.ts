import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '@/stores/authStore';

export const useAppState = () => {
  const appState = useRef(AppState.currentState);
  const { validateSession, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // If app is coming to foreground and user is authenticated
      if (appState.current && appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App came to foreground, validating session...');
        
        if (isAuthenticated) {
          const isValid = await validateSession();
          if (!isValid) {
            console.warn('Session validation failed on app foreground');
          }
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => subscription?.remove();
  }, [isAuthenticated, validateSession]);

  return appState.current;
};