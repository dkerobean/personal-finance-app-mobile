import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MonoProvider, MonoConnectButton, useMonoConnect } from '@mono.co/connect-react-native';
import { useAuth } from '@clerk/clerk-expo';
import { LinkIcon } from 'lucide-react-native';
import { accountsApi } from '../../services/api/accounts';
import { useAppToast } from '../../hooks/useAppToast';
import { COLORS, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../../constants/design';

interface MonoConnectProps {
  onSuccess?: () => void;
}

export const MonoConnect: React.FC<MonoConnectProps> = ({ onSuccess }) => {
  const { userId } = useAuth();
  const toast = useAppToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const MONO_PUBLIC_KEY = process.env.EXPO_PUBLIC_MONO_PUBLIC_KEY || 'test_pk_...'; 

  const handleSuccess = async (payload: { code: string }) => {
    const code = payload.code;
    if (!userId) return;

    setIsLoading(true);
    try {
      await accountsApi.linkMonoAccount(code, userId);
      toast.success('Account Linked', 'Your account has been successfully linked via Mono.');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Link Error:', error);
      toast.error('Linking Failed', 'Failed to link account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    console.log('Mono Widget Closed');
  };

  return (
    <View style={styles.container}>
      <MonoProvider
        publicKey={MONO_PUBLIC_KEY}
        onSuccess={handleSuccess}
        onClose={handleClose}
      >
        <MonoConnectButtonRender isLoading={isLoading} />
      </MonoProvider>
    </View>
  );
};

// Custom button renderer using Design System
const MonoConnectButtonRender = ({ isLoading }: { isLoading: boolean }) => {
  const { init } = useMonoConnect();

  return (
    <TouchableOpacity
      style={[styles.button, isLoading && styles.buttonDisabled]}
      onPress={() => init()}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={COLORS.white} style={{ marginRight: 8 }} />
      ) : (
        <LinkIcon size={20} color={COLORS.white} style={{ marginRight: 8 }} />
      )}
      <Text style={styles.buttonText}>
        {isLoading ? 'Connecting...' : 'Link Bank or Mobile Money'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
  },
  button: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: BORDER_RADIUS.pill, // Modern rounded pill shape
    ...SHADOWS.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
