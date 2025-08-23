import 'react-native-gesture-handler';
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyledProvider } from '@gluestack-style/react';
import { config } from '../gluestack.config';
import ErrorBoundary from '../src/components/ErrorBoundary';

export default function RootLayout(): React.ReactElement {
  return (
    <ErrorBoundary>
      <StyledProvider config={config}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </StyledProvider>
    </ErrorBoundary>
  );
}