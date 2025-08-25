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
import { SvgXml } from 'react-native-svg';
import { validateEmail } from '@/lib/validators';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';

const EYE_ICON = `<svg width="26" height="20" viewBox="0 0 26 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13 0C7.5 0 2.73 3.11 1 7.5C2.73 11.89 7.5 15 13 15C18.5 15 23.27 11.89 25 7.5C23.27 3.11 18.5 0 13 0ZM13 12.5C10.24 12.5 8 10.26 8 7.5C8 4.74 10.24 2.5 13 2.5C15.76 2.5 18 4.74 18 7.5C18 10.26 15.76 12.5 13 12.5ZM13 4.5C11.34 4.5 10 5.84 10 7.5C10 9.16 11.34 10.5 13 10.5C14.66 10.5 16 9.16 16 7.5C16 5.84 14.66 4.5 13 4.5Z" fill="#0E3E3E"/>
</svg>`;

const EYE_OFF_ICON = `<svg width="26" height="11" viewBox="0 0 26 11" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2.65582 0.82533C8.20704 8.21776 17.0805 8.44331 22.8328 1.49836C23.0127 1.28372 23.1855 1.05816 23.3618 0.82533M13.0071 6.54428V9.9047M18.6112 5.06361L20.4416 8.31235M22.8293 1.49836L25.1746 3.6848M7.39235 5.06361L5.56192 8.31235M3.17073 1.49836L0.825392 3.6848" stroke="#0E3E3E" stroke-width="1.63636" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

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
      <StatusBar backgroundColor="#00D09E" barStyle="light-content" />

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
                placeholderTextColor="#999"
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
                placeholder="●●●●●●"
                placeholderTextColor="#999"
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
                <SvgXml 
                  xml={showPassword.password ? EYE_OFF_ICON : EYE_ICON} 
                  width={24} 
                  height={16} 
                />
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