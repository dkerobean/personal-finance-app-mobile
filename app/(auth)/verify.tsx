import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';

export default function VerifyScreen(): React.ReactElement {
  const params = useLocalSearchParams<{ email: string; firstName?: string }>();
  const email = params.email || '';
  const firstName = params.firstName || '';
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setSession = useAuthStore((state) => state.setSession);
  const setUser = useAuthStore((state) => state.setUser);

  const handleVerifyCode = async (): Promise<void> => {
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.verifyOtp(email, verificationCode);

      if (!result.success) {
        setError(result.message || 'Verification failed');
        Alert.alert('Error', result.message || 'Verification failed');
        return;
      }

      // Email verified successfully, redirect to login
      Alert.alert(
        'Success', 
        'Email verified successfully! You can now sign in.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(auth)/login');
            },
          },
        ]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed';
      setError(message);
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async (): Promise<void> => {
    setIsResending(true);
    setError(null);

    try {
      const result = await authService.resendVerificationCode(email, firstName);
      
      if (result.success) {
        Alert.alert('Success', result.message || 'Verification code resent to your email!');
      } else {
        setError(result.message || 'Failed to resend verification code');
        Alert.alert('Error', result.message || 'Failed to resend verification code');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resend verification code';
      setError(message);
      Alert.alert('Error', message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a verification code to {email}. Enter it below to complete your registration.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Verification Code</Text>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="Enter verification code"
              value={verificationCode}
              onChangeText={(text) => {
                setVerificationCode(text);
                setError(null);
              }}
              keyboardType="numeric"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={6}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleVerifyCode}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.resendButton, isResending && styles.buttonDisabled]} 
            onPress={handleResendCode}
            disabled={isResending}
          >
            <Text style={styles.resendButtonText}>
              {isResending ? 'Resending...' : "Didn't receive the code? Resend"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    textAlign: 'center',
    letterSpacing: 4,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendButtonText: {
    color: '#2563eb',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});