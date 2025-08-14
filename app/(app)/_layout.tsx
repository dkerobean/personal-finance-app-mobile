import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function AppLayout(): React.ReactElement {
  const { isAuthenticated, isLoading, hydrated, initialize } = useAuthStore();

  useEffect(() => {
    // Initialize auth store on mount
    if (!hydrated) {
      initialize();
    }
  }, [hydrated, initialize]);

  useEffect(() => {
    // Redirect to login if not authenticated and store is hydrated
    if (hydrated && !isAuthenticated && !isLoading) {
      router.replace('/(auth)/login');
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

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="transactions" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});