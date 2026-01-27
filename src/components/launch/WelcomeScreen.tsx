import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { router } from 'expo-router';

interface WelcomeScreenProps {
  onManualContinue?: () => void;
}

export default function WelcomeScreen({ onManualContinue }: WelcomeScreenProps): React.ReactElement {
  console.log('[WELCOME] WelcomeScreen rendered with props:', { onManualContinue: !!onManualContinue });

  const handleLogin = () => {
    console.log('[WELCOME] Login button pressed');
    router.push('/(auth)/login');
  };

  const handleSignUp = () => {
    console.log('[WELCOME] Sign up button pressed');
    router.push('/(auth)/register');
  };

  const handleForgotPassword = () => {
    console.log('[WELCOME] Forgot password pressed');
    // TODO: Navigate to forgot password screen when implemented
  };

  const handleManualContinue = () => {
    console.log('[WELCOME] Manual continue triggered');
    onManualContinue?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          {/* Using a colored circle as placeholder since SVG may have compatibility issues */}
          <View style={styles.logoPlaceholder} />
        </View>
        
        <Text style={styles.brandText}>finWise</Text>
        
        <Text style={styles.description}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod.
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
            <Text style={styles.primaryButtonText}>Log In</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleSignUp}>
            <Text style={styles.secondaryButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        {onManualContinue && (
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={handleManualContinue}
          >
            <Text style={styles.debugButtonText}>Continue (Debug)</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1FFF3',
    borderRadius: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 120,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoPlaceholder: {
    width: 109,
    height: 115,
    backgroundColor: '#00D09E',
    borderRadius: 55,
    borderWidth: 4,
    borderColor: '#0E3E3E',
  },
  brandText: {
    fontSize: 52,
    fontWeight: '600',
    color: '#00D09E',
    fontFamily: 'Poppins',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#4B4544',
    fontFamily: 'League Spartan',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 60,
    maxWidth: 240,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 260,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#00D09E',
    borderRadius: 30,
    paddingVertical: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#093030',
    fontFamily: 'Poppins',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  secondaryButton: {
    backgroundColor: '#DFF7E2',
    borderRadius: 30,
    paddingVertical: 15,
  },
  secondaryButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0E3E3E',
    fontFamily: 'Poppins',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#093030',
    fontFamily: 'League Spartan',
    textAlign: 'center',
  },
  debugButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 15,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 20,
  },
  debugButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
});