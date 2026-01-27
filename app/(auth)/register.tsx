import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { SvgXml } from 'react-native-svg';
import { useSignUp, useAuth, useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { validateEmail, validatePassword } from '@/lib/validators';
import { authService } from '@/services/authService';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/constants/design';

// Warm up the browser for OAuth
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
<path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.23 13.48 18.63 12 18.63C9.13 18.63 6.71 16.69 5.84 14.09H2.17V16.95C3.98 20.53 7.7 23 12 23Z" fill="#34A853"/>
<path d="M5.84 14.09C5.62 13.43 5.49 12.73 5.49 12C5.49 11.27 5.62 10.57 5.84 9.91V7.05H2.17C1.4 8.57 0.96 10.24 0.96 12C0.96 13.76 1.4 15.43 2.17 16.95L5.84 14.09Z" fill="#FBBC05"/>
<path d="M12 5.37C13.62 5.37 15.06 5.92 16.21 6.98L19.36 3.83C17.45 2.09 14.97 1 12 1C7.7 1 3.98 3.47 2.17 7.05L5.84 9.91C6.71 7.31 9.13 5.37 12 5.37Z" fill="#EA4335"/>
</svg>`;

const APPLE_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M17.05 20.28C16.07 21.23 15 21.08 13.97 20.63C12.88 20.17 11.88 20.15 10.73 20.63C9.29 21.25 8.53 21.07 7.67 20.28C2.79 15.25 3.51 7.59 9.05 7.31C10.4 7.38 11.34 8.05 12.13 8.11C13.31 7.87 14.44 7.18 15.69 7.27C17.19 7.39 18.32 7.99 19.07 9.07C15.98 10.94 16.72 15.05 19.58 16.2C18.97 17.82 18.17 19.42 17.04 20.29L17.05 20.28ZM12.03 7.25C11.88 5.02 13.69 3.18 15.77 3C16.06 5.58 13.43 7.5 12.03 7.25Z" fill="#000000"/>
</svg>`;

// Kippo K Logo - White version for green background
const KIPPO_LOGO_WHITE = `<svg width="50" height="50" viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
  <path d="M17.5 65 L37.5 15 L57.5 15 L37.5 65 Z" fill="white"/>
  <path d="M62.5 15 L82.5 15 L70.5 40 L60.5 65 L40.5 65 L50.5 40 Z" fill="white"/>
</svg>`;

const EYE_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="#94A3B8"/>
</svg>`;

const EYE_OFF_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 7C14.76 7 17 9.24 17 12C17 12.88 16.79 13.69 16.42 14.41L19.55 17.54C21.22 16.14 22.46 14.23 23 12C21.27 7.61 17 4.5 12 4.5C10.74 4.5 9.54 4.79 8.44 5.31L10.59 7.46C11.03 7.16 11.5 7 12 7ZM2.41 1.58L1 2.99L5.27 7.26C3.48 8.42 2.01 10.06 1 12C2.73 16.39 7 19.5 12 19.5C13.55 19.5 15.02 19.16 16.38 18.55L19.59 21.76L21 20.35L2.41 1.58ZM12 17C9.24 17 7 14.76 7 12C7 11.23 7.18 10.5 7.5 9.85L14.15 16.5C13.5 16.82 12.77 17 12 17Z" fill="#94A3B8"/>
</svg>`;

interface FormData {
  fullName: string;
  email: string;
  mobileNumber: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  mobileNumber?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
  field_password?: string;
  field_email?: string;
}

interface PasswordVisibility {
  password: boolean;
  confirmPassword: boolean;
}

export default function RegisterScreen(): React.ReactElement {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { isSignedIn } = useAuth();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: 'oauth_apple' });
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState<PasswordVisibility>({
    password: false,
    confirmPassword: false,
  });

  // Redirect if already signed in
  React.useEffect(() => {
    if (isSignedIn) {
      router.replace('/(app)');
    }
  }, [isSignedIn]);

  const handleGoogleSignUp = async () => {
    try {
      setSocialLoading('google');
      const { createdSessionId, setActive: setActiveSession } = await startGoogleOAuth();
      
      if (createdSessionId && setActiveSession) {
        await setActiveSession({ session: createdSessionId });
        router.replace('/(app)');
      }
    } catch (error: any) {
      console.error('Google OAuth error:', error);
      Alert.alert('Google Sign Up Failed', error?.message || 'An error occurred');
    } finally {
      setSocialLoading(null);
    }
  };

  const handleAppleSignUp = async () => {
    try {
      setSocialLoading('apple');
      const { createdSessionId, setActive: setActiveSession } = await startAppleOAuth();
      
      if (createdSessionId && setActiveSession) {
        await setActiveSession({ session: createdSessionId });
        router.replace('/(app)');
      }
    } catch (error: any) {
      console.error('Apple OAuth error:', error);
      Alert.alert('Apple Sign Up Failed', error?.message || 'An error occurred');
    } finally {
      setSocialLoading(null);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.mobileNumber.trim())) {
      newErrors.mobileNumber = 'Please enter a valid mobile number';
    }

    if (!formData.email) {
      newErrors.field_email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.field_email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.field_password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.field_password = passwordValidation.message;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSignUpPress = async () => {
    if (!isLoaded || !signUp) {
      Alert.alert('Error', 'Authentication service not ready. Please try again.');
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // 1. Create the user on Clerk
      await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
        firstName: formData.fullName.split(' ')[0],
        lastName: formData.fullName.split(' ').slice(1).join(' '),
        username: formData.email.split('@')[0], // Use email handle as default username
      });

      // 2. Prepare for email verification
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      setPendingVerification(true);
      setIsLoading(false);
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      
      let errorMessage = 'An unexpected error occurred';
      if (err.errors && err.errors.length > 0) {
        errorMessage = err.errors[0].message;
      }
      
      Alert.alert('Registration Failed', errorMessage);
      setIsLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded || !signUp) return;

    setIsLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (completeSignUp.status === 'complete') {
        const userId = completeSignUp.createdUserId;
        if (!userId) throw new Error('Failed to get user ID');

        // Sync to MongoDB backend
        try {
            await authService.syncUserToDatabase(
                userId, 
                formData.email,
                formData.fullName.split(' ')[0],
                formData.fullName.split(' ').slice(1).join(' ')
            );
            
            // Also update profile with mobile number
            if(formData.mobileNumber) {
                await authService.updateUserProfile(userId, {
                    mobileNumber: formData.mobileNumber
                });
            }
        } catch (syncError) {
          console.error("Failed to sync user to MongoDB:", syncError);
          // Don't block sign-in if sync fails, we can retry later or let the backend handle it
        }

        await setActive({ session: completeSignUp.createdSessionId });
        router.replace('/(app)');
      } else {
        console.error(JSON.stringify(completeSignUp, null, 2));
        Alert.alert('Verification Failed', 'Invalid code or verification incomplete.');
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      
      let isAlreadyVerified = false;
      if (err.errors && err.errors.length > 0) {
        if (err.errors[0].code === 'verification_already_verified') {
            isAlreadyVerified = true;
        }
      }

      if (isAlreadyVerified) {
          // If already verified, try to complete the sign up flow
          if (signUp?.status === 'complete' && signUp?.createdSessionId) {
             try {
                // Perform the same sync logic as success
                const userId = signUp.createdUserId;
                if (userId) {
                    try {
                         await authService.syncUserToDatabase(
                            userId, 
                            formData.email,
                            formData.fullName.split(' ')[0],
                            formData.fullName.split(' ').slice(1).join(' ')
                        );
                        if(formData.mobileNumber) {
                            await authService.updateUserProfile(userId, {
                                mobileNumber: formData.mobileNumber
                            });
                        }
                    } catch (syncError) {
                         console.error("Failed to sync user to MongoDB:", syncError);
                    }
                }
                await setActive({ session: signUp.createdSessionId });
                router.replace('/(app)');
                return;
             } catch (activationError) {
                 console.error("Failed to activate session after verified error:", activationError);
                 Alert.alert('Error', 'Verification successful but failed to activate session.');
             }
          } else {
             Alert.alert('Info', 'Email is already verified. Please try logging in.');
             router.replace('/login');
          }
          setIsLoading(false);
          return;
      }

      let errorMessage = 'An unexpected error occurred';
      if (err.errors && err.errors.length > 0) {
        errorMessage = err.errors[0].message;
      }
      Alert.alert('Verification Error', errorMessage);
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field: keyof PasswordVisibility): void => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleInputChange = (field: keyof FormData, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    const errorKey = field === 'email' ? 'field_email' : field === 'password' ? 'field_password' : field as keyof FormErrors;

    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: undefined }));
    }
  };

  if (pendingVerification) {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            <View style={styles.verificationContainer}>
                <Image 
                    source={require('../../assets/kippo-logo-white.png')}
                    style={styles.logoSmall}
                    resizeMode="contain"
                />
                <Text style={styles.title}>Verification</Text>
                <Text style={[styles.subtitle, { color: '#FFFFFF', textAlign: 'center' }]}>We've sent a code to {formData.email}</Text>
                
                <View style={styles.inputGroup}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={verificationCode}
                            placeholder="Enter verification code"
                            placeholderTextColor="#94A3B8"
                            onChangeText={setVerificationCode}
                            keyboardType="number-pad"
                        />
                    </View>
                </View>

                <TouchableOpacity 
                    style={[styles.button, isLoading && styles.buttonDisabled]} 
                    onPress={onPressVerify}
                    disabled={isLoading}
                >
                     {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.buttonText}>Verify Email</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <View style={styles.topSection}>
        <SvgXml xml={KIPPO_LOGO_WHITE} width={50} height={50} />
        <Text style={styles.title}>Create Account</Text>
      </View>

      <View style={styles.bottomSection}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={[styles.inputContainer, errors.fullName && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#94A3B8"
                  value={formData.fullName}
                  onChangeText={(text) => handleInputChange('fullName', text)}
                />
              </View>
              {errors.fullName && (
                <Text style={styles.errorText}>{errors.fullName}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputContainer, errors.field_email && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
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
              <Text style={styles.label}>Mobile Number</Text>
              <View style={[styles.inputContainer, errors.mobileNumber && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your mobile number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={formData.mobileNumber}
                  onChangeText={(text) => handleInputChange('mobileNumber', text)}
                />
              </View>
              {errors.mobileNumber && (
                <Text style={styles.errorText}>{errors.mobileNumber}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputContainer, errors.field_password && styles.inputError]}>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Create a password"
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
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm your password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword.confirmPassword}
                    autoCapitalize="none"
                    value={formData.confirmPassword}
                    onChangeText={(text) => handleInputChange('confirmPassword', text)}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => togglePasswordVisibility('confirmPassword')}
                  >
                    <SvgXml
                      xml={showPassword.confirmPassword ? EYE_ICON : EYE_OFF_ICON}
                      width={20}
                      height={20}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={onSignUpPress}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Social Login Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign up with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleGoogleSignUp}
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
                onPress={handleAppleSignUp}
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
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
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
    height: '25%',
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
  headerContainer: {
    alignItems: 'center',
    marginBottom: SPACING.huge,
  },
  logo: {
    width: 50,
    height: 50,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  logoSmall: {
    width: 48,
    height: 48,
    marginBottom: SPACING.xxl,
    borderRadius: BORDER_RADIUS.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.massive,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.lightBlue,
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    width: '100%',
  },
  verificationContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.xxl,
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
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  passwordInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    height: '100%',
    fontWeight: '500',
  },
  eyeIcon: {
    padding: SPACING.xs,
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
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xxl,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray100,
  },
  dividerText: {
    paddingHorizontal: SPACING.md,
    color: COLORS.textTertiary,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '500',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
});