import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useAppState } from '@/hooks/useAppState';
import SplashScreen from '@/components/launch/SplashScreen';
import OnboardingContainer from '@/components/launch/OnboardingContainer';
import WelcomeScreen from '@/components/launch/WelcomeScreen';

type LaunchStep = 'splash' | 'onboarding' | 'welcome' | 'navigating';

export default function Index() {
  const [currentStep, setCurrentStep] = useState<LaunchStep>('splash');
  const [error, setError] = useState<string | null>(null);
  const [initRetries, setInitRetries] = useState(0);
  const { isAuthenticated, hasCompletedOnboarding, hydrated, initialize, setOnboardingCompleted } = useAuthStore();
  
  // Enable app state monitoring for session validation
  useAppState();

  useEffect(() => {
    const initializeApp = async () => {
      const maxRetries = 3;
      let currentRetry = initRetries;
      
      try {
        console.log(`Starting app initialization... (attempt ${currentRetry + 1}/${maxRetries})`);
        
        // Show splash screen for at least 2 seconds
        const splashTimer = setTimeout(() => {
          if (currentStep === 'splash') {
            setCurrentStep('onboarding');
          }
        }, 2000);
        
        // Initialize auth store with retry logic
        await initialize();
        
        // Ensure splash screen shows for at least 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Success - clear any previous errors and reset retry count
        setError(null);
        setInitRetries(0);
        
        return () => clearTimeout(splashTimer);
        
      } catch (initError) {
        console.error('App initialization error:', initError);
        const errorMessage = initError instanceof Error ? initError.message : 'Failed to start app';
        
        // Retry logic
        if (currentRetry < maxRetries - 1) {
          console.log(`Retrying initialization in 2 seconds... (${currentRetry + 1}/${maxRetries})`);
          setInitRetries(currentRetry + 1);
          
          setTimeout(() => {
            initializeApp();
          }, 2000);
          return;
        }
        
        // Max retries reached
        console.error('Max initialization retries reached');
        setError(`${errorMessage} (Failed after ${maxRetries} attempts)`);
        
        // Fallback to welcome screen even if there's an error
        setTimeout(() => {
          setCurrentStep('welcome');
        }, 2000);
      }
    };

    // Only initialize if we haven't started yet or if we're retrying
    if (currentStep === 'splash' || initRetries > 0) {
      initializeApp();
    }
  }, [initRetries]);

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