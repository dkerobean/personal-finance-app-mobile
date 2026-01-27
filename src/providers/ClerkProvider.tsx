import React from 'react';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import Constants from 'expo-constants';

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
    // Return children without Clerk if publishable key is missing
    // This allows the app to run in development without Clerk
    console.warn('Running without Clerk authentication - publishable key missing');
    return <>{children}</>;
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
