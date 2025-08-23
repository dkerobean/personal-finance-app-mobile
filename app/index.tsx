import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function Index() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, hydrated, initialize } = useAuthStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Starting app initialization...');
        
        // Initialize auth store
        await initialize();
        
        // Small delay to ensure initialization is complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setIsInitializing(false);
        
        // Navigate based on auth state
        if (isAuthenticated) {
          console.log('User authenticated, navigating to app');
          router.replace('/(app)');
        } else {
          console.log('User not authenticated, navigating to register');
          router.replace('/(auth)/register');
        }
        
      } catch (initError) {
        console.error('App initialization error:', initError);
        setError(initError instanceof Error ? initError.message : 'Failed to start app');
        setIsInitializing(false);
        
        // Fallback to register screen even if there's an error
        setTimeout(() => {
          router.replace('/(auth)/register');
        }, 2000);
      }
    };

    initializeApp();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Initialization Error</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Text style={styles.fallbackText}>Redirecting to registration...</Text>
      </View>
    );
  }

  if (isInitializing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Starting Kippo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2563eb" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  fallbackText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});