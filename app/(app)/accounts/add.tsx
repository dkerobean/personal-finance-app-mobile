import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';
import { router, Stack } from 'expo-router';
import { AccountTypeSelectionScreen } from '@/components/features/accounts/AccountTypeSelectionScreen';
import { MonoConnectWidget } from '@/components/features/accounts/MonoConnectWidget';
import MoMoAccountLink from '@/components/features/MoMoAccountLink';

type AccountLinkingStep = 'select' | 'bank' | 'momo';

export default function AddAccountScreen() {
  const [currentStep, setCurrentStep] = useState<AccountLinkingStep>('select');

  const handleBankAccountSelected = () => {
    setCurrentStep('bank');
  };

  const handleMTNMoMoSelected = () => {
    setCurrentStep('momo');
  };

  const handleCancel = () => {
    if (currentStep === 'select') {
      router.back();
    } else {
      setCurrentStep('select');
    }
  };

  const handleAccountLinked = () => {
    // Navigate back to accounts list after successful linking
    router.push('/accounts');
  };

  const handleLinkingError = (error: string) => {
    console.error('Account linking error:', error);
    // For now, just stay on the current step
    // In production, you might want to show an error message
  };

  const getHeaderTitle = () => {
    switch (currentStep) {
      case 'bank':
        return 'Link Bank Account';
      case 'momo':
        return 'Link MTN MoMo Account';
      default:
        return 'Add Account';
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: getHeaderTitle(),
          headerStyle: { backgroundColor: '#2563eb' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: '600' },
          headerShown: true,
        }} 
      />
      
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        {currentStep === 'select' && (
          <AccountTypeSelectionScreen
            onBankAccountSelected={handleBankAccountSelected}
            onMTNMoMoSelected={handleMTNMoMoSelected}
            onCancel={handleCancel}
          />
        )}

        {currentStep === 'bank' && (
          <MonoConnectWidget
            onSuccess={handleAccountLinked}
            onError={handleLinkingError}
            onCancel={handleCancel}
          />
        )}

        {currentStep === 'momo' && (
          <MoMoAccountLink
            onAccountLinked={handleAccountLinked}
          />
        )}
      </SafeAreaView>
    </>
  );
}