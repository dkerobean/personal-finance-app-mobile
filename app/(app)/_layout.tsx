import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, router, usePathname } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import BottomNavigation from '@/components/navigation/BottomNavigation';

export default function AppLayout(): React.ReactElement {
  const { isAuthenticated, isLoading, hydrated, initialize } = useAuthStore();
  const pathname = usePathname();

  useEffect(() => {
    // Initialize auth store on mount
    if (!hydrated) {
      initialize();
    }
  }, [hydrated, initialize]);

  useEffect(() => {
    // Redirect to login if not authenticated and store is hydrated
    if (hydrated && !isAuthenticated && !isLoading) {
      console.log('User not authenticated, redirecting to login');
      try {
        router.replace('/(auth)/login');
      } catch (error) {
        console.error('Navigation error:', error);
      }
    }
  }, [isAuthenticated, isLoading, hydrated]);

  // Show loading while auth is being initialized or while navigating
  if (!hydrated || isLoading || !isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});