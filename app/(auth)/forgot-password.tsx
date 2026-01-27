import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SvgXml } from 'react-native-svg';
import { useSignIn } from '@clerk/clerk-expo';
import { validateEmail } from '@/lib/validators';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/constants/design';

interface FormErrors {
  email?: string;
  code?: string;
  password?: string;
  general?: string;
}

type ResetStep = 'email' | 'code' | 'password';

const KIPPO_LOGO_WHITE = `<svg width="50" height="50" viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
  <path d="M17.5 65 L37.5 15 L57.5 15 L37.5 65 Z" fill="white"/>
  <path d="M62.5 15 L82.5 15 L70.5 40 L60.5 65 L40.5 65 L50.5 40 Z" fill="white"/>
</svg>`;

export default function ForgotPasswordScreen(): React.ReactElement {
  const { signIn, setActive, isLoaded } = useSignIn();
  
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<ResetStep>('email');

  const handleSendCode = async () => {
    if (!isLoaded || !signIn) {
      Alert.alert('Error', 'Authentication service not ready.');
      return;
    }

    // Validate email
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }
    if (!validateEmail(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      // Start the password reset flow
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });

      setStep('code');
      Alert.alert('Code Sent', `We've sent a verification code to ${email}`);
    } catch (err: any) {
      console.error('Password reset error:', JSON.stringify(err, null, 2));
      let errorMessage = 'Failed to send reset code';
      if (err.errors && err.errors.length > 0) {
        errorMessage = err.errors[0].message;
      }
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      setErrors({ code: 'Verification code is required' });
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      // Attempt to verify the code
      const result = await signIn?.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
      });

      if (result?.status === 'needs_new_password') {
        setStep('password');
      } else {
        setErrors({ general: 'Invalid code. Please try again.' });
      }
    } catch (err: any) {
      console.error('Code verification error:', JSON.stringify(err, null, 2));
      let errorMessage = 'Invalid verification code';
      if (err.errors && err.errors.length > 0) {
        errorMessage = err.errors[0].message;
      }
      setErrors({ code: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    // Validate passwords
    if (!newPassword.trim()) {
      setErrors({ password: 'Password is required' });
      return;
    }
    if (newPassword.length < 8) {
      setErrors({ password: 'Password must be at least 8 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrors({ password: 'Passwords do not match' });
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const result = await signIn?.resetPassword({
        password: newPassword,
      });

      if (result?.status === 'complete' && result.createdSessionId) {
        await setActive?.({ session: result.createdSessionId });
        Alert.alert('Success', 'Your password has been reset successfully!');
        router.replace('/(app)');
      } else {
        setErrors({ general: 'Failed to reset password. Please try again.' });
      }
    } catch (err: any) {
      console.error('Password reset error:', JSON.stringify(err, null, 2));
      let errorMessage = 'Failed to reset password';
      if (err.errors && err.errors.length > 0) {
        errorMessage = err.errors[0].message;
      }
      setErrors({ password: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmailStep = () => (
    <>

      <Text style={styles.subtitle}>
        Enter your email address and we'll send you a verification code.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email Address</Text>
        <View style={[styles.inputContainer, errors.email && styles.inputError]}>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />
        </View>
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      {errors.general && <Text style={styles.errorText}>{errors.general}</Text>}

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSendCode}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Send Code</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderCodeStep = () => (
    <>

      <Text style={styles.subtitle}>
        Enter the 6-digit code sent to {email}
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Verification Code</Text>
        <View style={[styles.inputContainer, errors.code && styles.inputError]}>
          <TextInput
            style={styles.input}
            placeholder="Enter code"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
            maxLength={6}
          />
        </View>
        {errors.code && <Text style={styles.errorText}>{errors.code}</Text>}
      </View>

      {errors.general && <Text style={styles.errorText}>{errors.general}</Text>}

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleVerifyCode}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Verify Code</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSendCode} disabled={isLoading}>
        <Text style={styles.resendText}>Didn't receive the code? Resend</Text>
      </TouchableOpacity>
    </>
  );

  const renderPasswordStep = () => (
    <>

      <Text style={styles.subtitle}>
        Create a new password for your account.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>New Password</Text>
        <View style={[styles.inputContainer, errors.password && styles.inputError]}>
          <TextInput
            style={styles.input}
            placeholder="Enter new password"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            autoCapitalize="none"
            value={newPassword}
            onChangeText={setNewPassword}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Confirm Password</Text>
        <View style={[styles.inputContainer, errors.password && styles.inputError]}>
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            autoCapitalize="none"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
      </View>

      {errors.general && <Text style={styles.errorText}>{errors.general}</Text>}

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleResetPassword}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Reset Password</Text>
        )}
      </TouchableOpacity>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <View style={styles.topSection}>
        <SvgXml xml={KIPPO_LOGO_WHITE} width={50} height={50} />
        <Text style={styles.title}>
          {step === 'email' ? 'Reset Password' : step === 'code' ? 'Verify Code' : 'New Password'}
        </Text>
      </View>

      <View style={styles.bottomSection}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            {step === 'email' && renderEmailStep()}
            {step === 'code' && renderCodeStep()}
            {step === 'password' && renderPasswordStep()}

            <View style={styles.footer}>
              <Text style={styles.footerText}>Remember your password? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  topSection: {
    height: '35%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  bottomSection: {
    flex: 1,
    backgroundColor: COLORS.backgroundCard,
    borderTopLeftRadius: BORDER_RADIUS.huge,
    borderTopRightRadius: BORDER_RADIUS.huge,
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.xl,
    paddingTop: SPACING.xxxl,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.massive,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
    width: '100%',
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.backgroundCard,
    alignSelf: 'flex-start',
    zIndex: 1,
    marginLeft: SPACING.md,
    paddingHorizontal: SPACING.xs,
    position: 'absolute',
    top: -10,
    fontWeight: '600',
  },
  inputContainer: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    borderColor: COLORS.gray100,
    paddingHorizontal: SPACING.lg,
    height: 56,
    justifyContent: 'center',
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: '#FEF2F2',
  },
  input: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    height: '100%',
    fontWeight: '500',
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.round,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
    width: '100%',
    ...SHADOWS.md,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
  },
  resendText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    textAlign: 'center',
    marginTop: SPACING.md,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  footerLink: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '700',
  },
});
