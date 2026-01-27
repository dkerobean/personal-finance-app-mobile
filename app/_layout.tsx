import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyledProvider } from '@gluestack-style/react';
import { config } from '../gluestack.config';
import ErrorBoundary from '../src/components/ErrorBoundary';
import { ClerkAuthProvider } from '../src/providers/ClerkProvider';
import { ToastProvider } from '../src/hooks/useAppToast';
import SplashScreen from '../src/components/SplashScreen';
import { 
  useFonts,
  PlusJakartaSans_300Light,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';

export default function RootLayout(): React.ReactElement {
  const [showSplash, setShowSplash] = useState(true);
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_300Light,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  if (!fontsLoaded || showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <ErrorBoundary>
      <ClerkAuthProvider>
        <StyledProvider config={config}>
          <ToastProvider>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(app)" />
            </Stack>
          </ToastProvider>
        </StyledProvider>
      </ClerkAuthProvider>
    </ErrorBoundary>
  );
}