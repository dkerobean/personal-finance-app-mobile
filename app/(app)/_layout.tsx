import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, router, usePathname } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import { COLORS } from '@/constants/design';

export default function AppLayout(): React.ReactElement {
  const { isAuthenticated, isLoading, hydrated, initialize } = useAuthStore();
  const pathname = usePathname();

  useEffect(() => {
    // Initialize auth store on mount with timeout
    if (!hydrated) {
      const initTimeout = setTimeout(() => {
        console.warn('Auth initialization taking longer than expected');
      }, 5000);

      initialize().finally(() => {
        clearTimeout(initTimeout);
      });
    }
  }, [hydrated, initialize]);

  useEffect(() => {
    // Redirect to login if not authenticated and store is hydrated
    if (hydrated && !isAuthenticated && !isLoading) {
      console.log('User not authenticated, redirecting to login');
      const redirectTimeout = setTimeout(() => {
        try {
          router.replace('/(auth)/login');
        } catch (error) {
          console.error('Navigation error:', error);
          // Fallback navigation
          router.push('/(auth)/login');
        }
      }, 100); // Small delay to ensure smooth transition

      return () => clearTimeout(redirectTimeout);
    }
  }, [isAuthenticated, isLoading, hydrated]);

  // Show loading while auth is being initialized or while navigating
  if (!hydrated || (isLoading && !isAuthenticated)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // If hydrated but not authenticated and not loading, show loading briefly before redirect
  if (hydrated && !isAuthenticated && !isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Redirecting...</Text>
      </View>
    );
  }

  // Check if current route should show bottom navigation
  const shouldShowBottomNav = !pathname?.includes('/create') && 
                              !pathname?.includes('/edit') && 
                              !pathname?.includes('/add') &&
                              !pathname?.match(/\/\[id\]/);

  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Expo Router auto-discovers routes based on file structure */}
      </Stack>
      {shouldShowBottomNav && <BottomNavigation />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundMain,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundMain,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
});