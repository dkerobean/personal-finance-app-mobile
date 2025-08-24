import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { validateEmail } from '@/lib/validators';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

interface PasswordVisibility {
  password: boolean;
}

export default function LoginScreen(): React.ReactElement {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState<PasswordVisibility>({
    password: false,
  });
  const { setUser, setSession } = useAuthStore();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (): Promise<void> => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const result = await authService.signIn(formData.email, formData.password);

      if (!result.success) {
        setErrors({ general: result.message });
        Alert.alert('Login Failed', result.message);
        return;
      }

      // Get the session to update the store
      const session = await authService.getSession();
      if (session) {
        setSession(session);
        setUser(session.user);
      }

      Alert.alert('Success', 'Welcome back!', [
        {
          text: 'OK',
          onPress: () => {
            router.replace('/(app)');
          },
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrors({ general: message });
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const navigateToRegister = (): void => {
    router.push('/(auth)/register');
  };

  const togglePasswordVisibility = (field: keyof PasswordVisibility): void => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleForgotPassword = (): void => {
    // TODO: Implement forgot password functionality
    Alert.alert('Forgot Password', 'This feature will be available soon.');
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#7C57FF" barStyle="light-content" />
      
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.timeText}>16:04</Text>
        <View style={styles.statusIcons}>
          <View style={styles.signalIcon} />
          <View style={styles.wifiIcon} />
          <View style={styles.batteryIcon} />
        </View>
      </View>

      {/* Green Header Section */}
      <View style={styles.greenHeader}>
        <Text style={styles.welcomeText}>Welcome</Text>
      </View>

      {/* Curved White Content Section */}
      <ScrollView style={styles.whiteContent} contentContainerStyle={styles.contentContainer}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username or email</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.email ? styles.inputError : null]}
                placeholder="example@example.com"
                placeholderTextColor="#093030"
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput, errors.password ? styles.inputError : null]}
                placeholder="●●●●●●●●"
                placeholderTextColor="#0E3E3E"
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                secureTextEntry={!showPassword.password}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => togglePasswordVisibility('password')}
              >
                <View style={styles.eyeIcon} />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordContainer}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {errors.general && <Text style={styles.generalError}>{errors.general}</Text>}

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Logging In...' : 'Log In'}
            </Text>
          </TouchableOpacity>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={styles.signUpButton}
            onPress={navigateToRegister}
          >
            <Text style={styles.signUpButtonText}>Sign Up</Text>
          </TouchableOpacity>

          {/* Biometric Text */}
          <Text style={styles.biometricText}>Use fingerprint to access</Text>

          {/* Social Login Section */}
          <Text style={styles.socialText}>or sign up with</Text>
          <View style={styles.socialButtonsContainer}>
            <View style={styles.socialButton} />
            <View style={styles.socialButton} />
          </View>

          {/* Footer */}
          <TouchableOpacity onPress={navigateToRegister} style={styles.footerContainer}>
            <Text style={styles.footerText}>Don't have an account? Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00D09E',
  },
  statusBar: {
    height: 32,
    backgroundColor: '#7C57FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 37,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'League Spartan',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  signalIcon: {
    width: 13,
    height: 11,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  wifiIcon: {
    width: 15,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 58,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  batteryIcon: {
    width: 17,
    height: 9,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  greenHeader: {
    paddingTop: 68,
    paddingBottom: 40,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 30,
    fontWeight: '600',
    color: '#093030',
    fontFamily: 'Poppins',
    textAlign: 'center',
  },
  whiteContent: {
    flex: 1,
    backgroundColor: '#F1FFF3',
    borderTopLeftRadius: 70,
    borderTopRightRadius: 70,
  },
  contentContainer: {
    paddingTop: 40,
    paddingHorizontal: 37,
    paddingBottom: 40,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#093030',
    fontFamily: 'Poppins',
    marginBottom: 8,
    marginLeft: 16,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#DFF7E2',
    borderRadius: 18,
    paddingHorizontal: 34,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Poppins',
    color: '#093030',
    borderWidth: 0,
  },
  passwordInput: {
    paddingRight: 60,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  eyeButton: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -12 }],
    padding: 4,
  },
  eyeIcon: {
    width: 24,
    height: 12,
    backgroundColor: '#0E3E3E',
    borderRadius: 2,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 16,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#093030',
    fontFamily: 'League Spartan',
  },
  generalError: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: '#00D09E',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#00D09E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  loginButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#093030',
    fontFamily: 'Poppins',
  },
  signUpButton: {
    backgroundColor: '#DFF7E2',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  signUpButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0E3E3E',
    fontFamily: 'Poppins',
  },
  biometricText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0E3E3E',
    fontFamily: 'Poppins',
    textAlign: 'center',
    marginBottom: 24,
  },
  socialText: {
    fontSize: 13,
    fontWeight: '300',
    color: '#093030',
    fontFamily: 'League Spartan',
    textAlign: 'center',
    marginBottom: 16,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  socialButton: {
    width: 33,
    height: 33,
    backgroundColor: '#DFF7E2',
    borderRadius: 16,
    borderWidth: 1.3,
    borderColor: '#0E3E3E',
  },
  footerContainer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    fontWeight: '300',
    color: '#093030',
    fontFamily: 'League Spartan',
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});