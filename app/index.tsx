import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import SplashScreen from '@/components/launch/SplashScreen';
import OnboardingContainer from '@/components/launch/OnboardingContainer';
import WelcomeScreen from '@/components/launch/WelcomeScreen';

type LaunchStep = 'splash' | 'onboarding' | 'welcome' | 'navigating';

export default function Index() {
  const [currentStep, setCurrentStep] = useState<LaunchStep>('splash');
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, hasCompletedOnboarding, hydrated, initialize, setOnboardingCompleted } = useAuthStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Starting app initialization...');
        
        // Show splash screen for at least 2 seconds
        const splashTimer = setTimeout(() => {
          setCurrentStep('onboarding');
        }, 2000);
        
        // Initialize auth store
        await initialize();
        
        // Ensure splash screen shows for at least 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return () => clearTimeout(splashTimer);
        
      } catch (initError) {
        console.error('App initialization error:', initError);
        setError(initError instanceof Error ? initError.message : 'Failed to start app');
        
        // Fallback to welcome screen even if there's an error
        setTimeout(() => {
          setCurrentStep('welcome');
        }, 2000);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    // Handle navigation after hydration
    if (hydrated && currentStep === 'navigating') {
      if (isAuthenticated) {
        console.log('User authenticated, navigating to app');
        router.replace('/(app)');
      } else {
        console.log('User not authenticated, navigating to register');
        router.replace('/(auth)/register');
      }
    }
  }, [hydrated, isAuthenticated, currentStep]);

  const handleOnboardingComplete = async () => {
    await setOnboardingCompleted();
    setCurrentStep('welcome');
  };

  const handleWelcomeScreenReady = () => {
    setCurrentStep('navigating');
  };

  if (error) {
    return <WelcomeScreen />;
  }

  if (currentStep === 'splash') {
    return <SplashScreen />;
  }

  if (currentStep === 'onboarding' && !hasCompletedOnboarding) {
    return <OnboardingContainer onComplete={handleOnboardingComplete} />;
  }

  if (currentStep === 'welcome' || currentStep === 'navigating') {
    // Show welcome screen and trigger navigation when component is ready
    setTimeout(() => {
      if (currentStep === 'welcome') {
        handleWelcomeScreenReady();
      }
    }, 100);
    
    return <WelcomeScreen />;
  }

  // Fallback
  return <SplashScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});