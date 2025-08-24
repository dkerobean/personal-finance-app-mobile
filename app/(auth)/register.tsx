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
import { validateEmail, validatePassword } from '@/lib/validators';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';

interface FormData {
  fullName: string;
  email: string;
  mobileNumber: string;
  dateOfBirth: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  mobileNumber?: string;
  dateOfBirth?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

interface PasswordVisibility {
  password: boolean;
  confirmPassword: boolean;
}

export default function RegisterScreen(): React.ReactElement {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    mobileNumber: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState<PasswordVisibility>({
    password: false,
    confirmPassword: false,
  });
  const { setUser, setSession } = useAuthStore();

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

    if (!formData.dateOfBirth.trim()) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.message;
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (): Promise<void> => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const result = await authService.signUp(
        formData.email, 
        formData.password, 
        formData.fullName.trim()
      );

      if (!result.success) {
        setErrors({ general: result.message || 'Registration failed' });
        Alert.alert('Registration Failed', result.message || 'An error occurred');
        return;
      }

      // Temporarily bypass email verification - get session and log user in immediately
      const session = await authService.getSession();
      if (session) {
        setSession(session);
        setUser(session.user);
      }

      Alert.alert('Success', 'Account created successfully! Welcome to FinWise!', [
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

  const navigateToLogin = (): void => {
    router.push('/(auth)/login');
  };

  const togglePasswordVisibility = (field: keyof PasswordVisibility): void => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
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
        <Text style={styles.welcomeText}>Create Account</Text>
      </View>

      {/* Curved White Content Section */}
      <ScrollView style={styles.whiteContent} contentContainerStyle={styles.contentContainer}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.fullName ? styles.inputError : null]}
                placeholder="example@example.com"
                placeholderTextColor="#0E3E3E"
                value={formData.fullName}
                onChangeText={(value) => updateFormData('fullName', value)}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
            {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.email ? styles.inputError : null]}
                placeholder="example@example.com"
                placeholderTextColor="#0E3E3E"
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
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.mobileNumber ? styles.inputError : null]}
                placeholder="+ 123 456 789"
                placeholderTextColor="#0E3E3E"
                value={formData.mobileNumber}
                onChangeText={(value) => updateFormData('mobileNumber', value)}
                keyboardType="phone-pad"
                autoCorrect={false}
              />
            </View>
            {errors.mobileNumber && <Text style={styles.errorText}>{errors.mobileNumber}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of birth</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.dateOfBirth ? styles.inputError : null]}
                placeholder="DD / MM /YYY"
                placeholderTextColor="#0E3E3E"
                value={formData.dateOfBirth}
                onChangeText={(value) => updateFormData('dateOfBirth', value)}
                autoCorrect={false}
              />
            </View>
            {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput, errors.confirmPassword ? styles.inputError : null]}
                placeholder="●●●●●●●●"
                placeholderTextColor="#0E3E3E"
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
                secureTextEntry={!showPassword.confirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => togglePasswordVisibility('confirmPassword')}
              >
                <View style={styles.eyeIcon} />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>

          {/* Terms and Privacy */}
          <Text style={styles.termsText}>
            By continuing, you agree to{'\n'}Terms of Use and Privacy Policy.
          </Text>

          {errors.general && <Text style={styles.generalError}>{errors.general}</Text>}

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[styles.signUpButton, isLoading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            <Text style={styles.signUpButtonText}>
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <TouchableOpacity onPress={navigateToLogin} style={styles.footerContainer}>
            <Text style={styles.footerText}>Already have an account? Log In</Text>
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
    paddingTop: 30,
    paddingHorizontal: 37,
    paddingBottom: 40,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#363130',
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
    paddingHorizontal: 35,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Poppins',
    color: '#0E3E3E',
    borderWidth: 0,
    fontWeight: '500',
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
    right: 18,
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
  termsText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#4B4544',
    fontFamily: 'League Spartan',
    textAlign: 'center',
    lineHeight: 18,
    marginVertical: 20,
  },
  generalError: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  signUpButton: {
    backgroundColor: '#00D09E',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#00D09E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  signUpButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#093030',
    fontFamily: 'Poppins',
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