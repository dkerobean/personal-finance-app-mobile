import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useSegments } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import SplashScreen from '@/components/launch/SplashScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/clerk-expo';

const ONBOARDING_KEY = 'kippo_onboarding_completed';

export default function Index() {
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const { hydrated, initialize } = useAuthStore();
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initialize();
        const hasCompletedOnboarding = await AsyncStorage.getItem(ONBOARDING_KEY);
        // setOnboardingCompleted(hasCompletedOnboarding === 'true');
        setOnboardingCompleted(hasCompletedOnboarding === 'true');
      } catch (error) {
        console.error('[INDEX] Initialization error:', error);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    console.log('[INDEX] Check Navigation - State:', { hydrated, isLoaded, isSignedIn, onboardingCompleted });
    
    if (hydrated && isLoaded && onboardingCompleted !== null) {
      if (!onboardingCompleted) {
        console.log('[INDEX] -> /onboarding');
        router.replace('/onboarding');
      } else if (isSignedIn) {
        console.log('[INDEX] -> /(app)');
        router.replace('/(app)');
      } else {
        console.log('[INDEX] -> /(auth)/login');
        router.replace('/(auth)/login');
      }
    } else {
        console.log('[INDEX] Waiting for state to settle...');
    }
  }, [hydrated, isLoaded, isSignedIn, onboardingCompleted]);

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});