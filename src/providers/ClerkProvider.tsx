import React from 'react';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import Constants from 'expo-constants';
import { StyleSheet, Text, View } from 'react-native';

const publishableKey = Constants.expoConfig?.extra?.clerkPublishableKey 
  || process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  console.error('Clerk Configuration Error: EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is missing');
}

interface ClerkAuthProviderProps {
  children: React.ReactNode;
}

/**
 * Clerk Authentication Provider
 * Wraps the app with Clerk's authentication context
 * 
 * Features:
 * - Secure token caching with expo-secure-store
 * - Automatic session management
 * - OAuth support for social logins
 */
export function ClerkAuthProvider({ children }: ClerkAuthProviderProps): React.ReactElement {
  if (!publishableKey) {
    console.warn('Clerk publishable key missing. Rendering configuration error screen.');
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Authentication is not configured</Text>
        <Text style={styles.body}>
          Add `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` to your environment before starting Expo.
        </Text>
      </View>
    );
  }

  return (
    <ClerkProvider 
      publishableKey={publishableKey} 
      tokenCache={tokenCache}
    >
      <ClerkLoaded>
        {children}
      </ClerkLoaded>
    </ClerkProvider>
  );
}

export default ClerkAuthProvider;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
    textAlign: 'center',
  },
});
