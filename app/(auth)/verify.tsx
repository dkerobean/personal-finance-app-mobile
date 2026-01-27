import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSignUp } from '@clerk/clerk-expo';
import { authService } from '@/services/authService';

export default function VerifyScreen(): React.ReactElement {
  const params = useLocalSearchParams<{ email: string; firstName?: string }>();
  const email = params.email || '';
  const firstName = params.firstName || '';
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isLoaded, signUp, setActive } = useSignUp();

  const handleVerifyCode = async (): Promise<void> => {
    if (!isLoaded) return;
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (completeSignUp.status === 'complete') {
        const userId = completeSignUp.createdUserId;
        if (userId) {
            // Sync to MongoDB
             try {
                // We might need full name here, but we only have params.
                // Assuming register.tsx passed them or we sync later.
                // For now, sync with available info.
                await authService.syncUserToDatabase(
                   userId, 
                   email,
                   firstName
               );
           } catch (syncError) {
                console.error("Failed to sync user to MongoDB:", syncError);
           }
        }
        
        await setActive({ session: completeSignUp.createdSessionId });
        
        Alert.alert(
          'Success', 
          'Email verified successfully! Welcome to Kippo.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/(app)');
              },
            },
          ]
        );
      } else {
        setError('Verification incomplete. Please check your email.');
      }
    } catch (err: any) {
       console.error(JSON.stringify(err, null, 2));
      const message = err.errors?.[0]?.message || 'Verification failed';
      setError(message);
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async (): Promise<void> => {
    if (!isLoaded) return;
    setIsResending(true);
    setError(null);

    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      Alert.alert('Success', 'Verification code resent to your email!');
    } catch (err: any) {
      const message = err.errors?.[0]?.message || 'Failed to resend code';
      setError(message);
      Alert.alert('Error', message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#006D4F" />
      
      <View style={styles.topSection}>
        <Image 
          source={require('../../assets/kippo-logo-white.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Verification</Text>
      </View>

      <View style={styles.bottomSection}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
            <Text style={styles.headerTitle}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
                We've sent a verification code to {email}. Enter it below to complete your registration.
            </Text>
            </View>

            <View style={styles.form}>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Verification Code</Text>
                <View style={[styles.inputContainer, error ? styles.inputError : null]}>
                    <TextInput
                        style={styles.input}
                        placeholder="123456"
                        placeholderTextColor="#94A3B8"
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
                </View>
                {error && <Text style={styles.errorText}>{error}</Text>}
            </View>

            <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleVerifyCode}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.buttonText}>Verify Email</Text>
                )}
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
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#006D4F',
  },
  topSection: {
    height: '30%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 16,
    tintColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  bottomSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 32,
    paddingTop: 48,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
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
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    zIndex: 1,
    marginLeft: 12,
    paddingHorizontal: 4,
    position: 'absolute',
    top: -10,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    height: 56,
    justifyContent: 'center',
  },
  input: {
    fontSize: 20,
    color: '#0F172A',
    height: '100%',
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#006D4F',
    borderRadius: 30,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#006D4F',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendButtonText: {
    color: '#006D4F',
    fontSize: 14,
    fontWeight: '600',
  },
});