import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SvgXml } from 'react-native-svg';
import { useSignIn, useAuth, useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { validateEmail } from '@/lib/validators';
import { authService } from '@/services/authService';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/ui/CustomAlert';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '@/constants/design';
import { KIPPO_MARK_WHITE_SVG } from '@/constants/brand';

// Warm up the browser for OAuth
WebBrowser.maybeCompleteAuthSession();

const EYE_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="#94A3B8"/>
</svg>`;

const EYE_OFF_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 7C14.76 7 17 9.24 17 12C17 12.88 16.79 13.69 16.42 14.41L19.55 17.54C21.22 16.14 22.46 14.23 23 12C21.27 7.61 17 4.5 12 4.5C10.74 4.5 9.54 4.79 8.44 5.31L10.59 7.46C11.03 7.16 11.5 7 12 7ZM2.41 1.58L1 2.99L5.27 7.26C3.48 8.42 2.01 10.06 1 12C2.73 16.39 7 19.5 12 19.5C13.55 19.5 15.02 19.16 16.38 18.55L19.59 21.76L21 20.35L2.41 1.58ZM12 17C9.24 17 7 14.76 7 12C7 11.23 7.18 10.5 7.5 9.85L14.15 16.5C13.5 16.82 12.77 17 12 17Z" fill="#94A3B8"/>
</svg>`;

const GOOGLE_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
<path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.23 13.48 18.63 12 18.63C9.13 18.63 6.71 16.69 5.84 14.09H2.17V16.95C3.98 20.53 7.7 23 12 23Z" fill="#34A853"/>
<path d="M5.84 14.09C5.62 13.43 5.49 12.73 5.49 12C5.49 11.27 5.62 10.57 5.84 9.91V7.05H2.17C1.4 8.57 0.96 10.24 0.96 12C0.96 13.76 1.4 15.43 2.17 16.95L5.84 14.09Z" fill="#FBBC05"/>
<path d="M12 5.37C13.62 5.37 15.06 5.92 16.21 6.98L19.36 3.83C17.45 2.09 14.97 1 12 1C7.7 1 3.98 3.47 2.17 7.05L5.84 9.91C6.71 7.31 9.13 5.37 12 5.37Z" fill="#EA4335"/>
</svg>`;

const APPLE_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M17.05 20.28C16.07 21.23 15 21.08 13.97 20.63C12.88 20.17 11.88 20.15 10.73 20.63C9.29 21.25 8.53 21.07 7.67 20.28C2.79 15.25 3.51 7.59 9.05 7.31C10.4 7.38 11.34 8.05 12.13 8.11C13.31 7.87 14.44 7.18 15.69 7.27C17.19 7.39 18.32 7.99 19.07 9.07C15.98 10.94 16.72 15.05 19.58 16.2C18.97 17.82 18.17 19.42 17.04 20.29L17.05 20.28ZM12.03 7.25C11.88 5.02 13.69 3.18 15.77 3C16.06 5.58 13.43 7.5 12.03 7.25Z" fill="#000000"/>
</svg>`;

const FACEBOOK_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M24 12.073C24 5.405 18.627 0 12 0C5.373 0 0 5.405 0 12.073C0 18.099 4.388 23.094 10.125 24V15.562H7.078V12.073H10.125V9.413C10.125 6.387 11.917 4.715 14.658 4.715C15.971 4.715 17.344 4.95 17.344 4.95V7.922H15.83C14.339 7.922 13.875 8.854 13.875 9.811V12.073H17.203L16.671 15.562H13.875V24C19.612 23.094 24 18.099 24 12.073Z" fill="#1877F2"/>
<path d="M16.671 15.562L17.203 12.073H13.875V9.811C13.875 8.857 14.339 7.922 15.83 7.922H17.344V4.95C17.344 4.95 15.971 4.715 14.658 4.715C11.917 4.715 10.125 6.387 10.125 9.413V12.073H7.078V15.562H10.125V24C10.736 24.097 11.363 24.146 12 24.146C12.637 24.146 13.264 24.097 13.875 24V15.562H16.671Z" fill="#FFFFFF"/>
</svg>`;

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  general?: string;
  field_email?: string;
  field_password?: string;
}

interface PasswordVisibility {
  password: boolean;
}

export default function LoginScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn } = useAuth();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: 'oauth_apple' });
  const { startOAuthFlow: startFacebookOAuth } = useOAuth({ strategy: 'oauth_facebook' });
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | 'facebook' | null>(null);
  const [showPassword, setShowPassword] = useState<PasswordVisibility>({
    password: false,
  });
  const { alert, alertProps } = useCustomAlert();

  // Redirect if already signed in
  React.useEffect(() => {
    if (isSignedIn) {
      router.replace('/(app)');
    }
  }, [isSignedIn]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setSocialLoading('google');
      const { createdSessionId, setActive: setActiveSession } = await startGoogleOAuth();
      
      if (createdSessionId && setActiveSession) {
        await setActiveSession({ session: createdSessionId });
        router.replace('/(app)');
      }
    } catch (error: any) {
      console.error('Google OAuth error:', error);
      alert('Google Sign In Failed', error?.message || 'An error occurred');
    } finally {
      setSocialLoading(null);
    }
  }, [startGoogleOAuth, alert]);

  const handleAppleSignIn = useCallback(async () => {
    try {
      setSocialLoading('apple');
      const { createdSessionId, setActive: setActiveSession } = await startAppleOAuth();
      
      if (createdSessionId && setActiveSession) {
        await setActiveSession({ session: createdSessionId });
        router.replace('/(app)');
      }
    } catch (error: any) {
      console.error('Apple OAuth error:', error);
      alert('Apple Sign In Failed', error?.message || 'An error occurred');
    } finally {
      setSocialLoading(null);
    }
  }, [startAppleOAuth, alert]);

  const handleFacebookSignIn = useCallback(async () => {
    try {
      setSocialLoading('facebook');
      const { createdSessionId, setActive: setActiveSession } = await startFacebookOAuth();

      if (createdSessionId && setActiveSession) {
        await setActiveSession({ session: createdSessionId });
        router.replace('/(app)');
      }
    } catch (error: any) {
      console.error('Facebook OAuth error:', error);
      alert('Facebook Sign In Failed', error?.message || 'An error occurred');
    } finally {
      setSocialLoading(null);
    }
  }, [startFacebookOAuth, alert]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.field_email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.field_email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.field_password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = useCallback(async (): Promise<void> => {
    if (!isLoaded || !signIn) {
      alert('Error', 'Authentication service not ready. Please try again.');
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Attempt Clerk sign in
      const result = await signIn.create({
        identifier: formData.email,
        password: formData.password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        
        // Sync user to MongoDB
        try {
          // Use session user ID if available
          await authService.syncUserToDatabase(
            result.createdSessionId || '',
            formData.email
          );
        } catch (syncError) {
          console.error('Failed to sync user to MongoDB:', syncError);
          // Don't block login if sync fails
        }

        router.replace('/(app)');
      } else {
        console.log('Sign in status:', result.status);
        if (result.status === 'needs_first_factor') {
          alert('Verification Required', 'Please complete the verification process.');
        } else {
          alert('Sign In Incomplete', 'Further steps are required to sign in.');
        }
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      let errorMessage = 'An unexpected error occurred';
      
      if (error.errors && error.errors.length > 0) {
        const firstError = error.errors[0];
        if (firstError.code === 'form_password_incorrect') {
          setErrors({ field_password: 'Incorrect password' });
          setIsLoading(false);
          return;
        }
        if (firstError.code === 'form_identifier_not_found') {
          setErrors({ field_email: 'Account not found' });
          setIsLoading(false);
          return;
        }
        errorMessage = firstError.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert('Sign In Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, signIn, setActive, formData, validateForm, alert]);

  const togglePasswordVisibility = (field: keyof PasswordVisibility): void => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleInputChange = (field: keyof FormData, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    const errorKey = `field_${field}` as keyof FormErrors;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: undefined }));
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#006D4F" />
      <CustomAlert {...alertProps} />
      
      <View style={[styles.topSection, { paddingTop: Math.max(insets.top + SPACING.xl, SPACING.huge) }]}>
        <View style={styles.logoBadge}>
          <SvgXml xml={KIPPO_MARK_WHITE_SVG} width={42} height={42} />
        </View>
        <Text style={styles.eyebrow}>Smart money, steady control</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>
          Pick up where you left off and keep every account, budget, and transaction in one place.
        </Text>
      </View>

      <View style={styles.bottomSection}>
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + SPACING.xxxl, SPACING.huge) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username or email</Text>
              <View style={[styles.inputContainer, errors.field_email && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="example@finance.com"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  value={formData.email}
                  onChangeText={(text) => handleInputChange('email', text)}
                />
              </View>
              {errors.field_email && (
                <Text style={styles.errorText}>{errors.field_email}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputContainer, errors.field_password && styles.inputError]}>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="********"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword.password}
                    autoCapitalize="none"
                    value={formData.password}
                    onChangeText={(text) => handleInputChange('password', text)}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => togglePasswordVisibility('password')}
                  >
                    <SvgXml
                      xml={showPassword.password ? EYE_ICON : EYE_OFF_ICON}
                      width={20}
                      height={20}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              {errors.field_password && (
                <Text style={styles.errorText}>{errors.field_password}</Text>
              )}
              <TouchableOpacity 
                style={styles.forgotPassword}
                onPress={() => router.push('/forgot-password')}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={isLoading || socialLoading !== null}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Log In</Text>
              )}
            </TouchableOpacity>

            {/* Social Login Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleGoogleSignIn}
                disabled={isLoading || socialLoading !== null}
              >
                {socialLoading === 'google' ? (
                  <ActivityIndicator color="#006D4F" size="small" />
                ) : (
                  <SvgXml xml={GOOGLE_ICON} width={24} height={24} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleFacebookSignIn}
                disabled={isLoading || socialLoading !== null}
              >
                {socialLoading === 'facebook' ? (
                  <ActivityIndicator color="#006D4F" size="small" />
                ) : (
                  <SvgXml xml={FACEBOOK_ICON} width={24} height={24} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleAppleSignIn}
                disabled={isLoading || socialLoading !== null}
              >
                {socialLoading === 'apple' ? (
                  <ActivityIndicator color="#006D4F" size="small" />
                ) : (
                  <SvgXml xml={APPLE_ICON} width={24} height={24} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.footerLink}>Sign Up</Text>
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
    minHeight: 300,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxxl,
    paddingBottom: SPACING.xxxl,
  },
  logoBadge: {
    width: 78,
    height: 78,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  eyebrow: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.semibold,
    color: 'rgba(255,255,255,0.78)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.massive + 2,
    fontFamily: TYPOGRAPHY.fonts.display,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeights.hero,
    letterSpacing: -1.2,
  },
  subtitle: {
    marginTop: SPACING.md,
    maxWidth: 320,
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.medium,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeights.body,
  },
  bottomSection: {
    flex: 1,
    backgroundColor: COLORS.backgroundCard,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: SPACING.xxxl,
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.huge,
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: SPACING.xl,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    letterSpacing: 0.1,
  },
  inputContainer: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.xl,
    height: 62,
    justifyContent: 'center',
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: '#FEF2F2',
  },
  input: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.medium,
    color: COLORS.textPrimary,
    height: '100%',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  passwordInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.medium,
    color: COLORS.textPrimary,
    height: '100%',
  },
  eyeIcon: {
    padding: SPACING.xs,
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.medium,
    marginTop: SPACING.xs,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.semibold,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 22,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xxl,
    ...SHADOWS.md,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontFamily: TYPOGRAPHY.fonts.bold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.medium,
  },
  footerLink: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.bold,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xxl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    paddingHorizontal: SPACING.md,
    color: COLORS.textTertiary,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.medium,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
    marginBottom: SPACING.xxxl,
  },
  socialButton: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
});
