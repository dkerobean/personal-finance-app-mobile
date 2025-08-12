import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';

export default function DashboardScreen(): React.ReactElement {
  const { user, logout } = useAuthStore();

  const handleSignOut = async (): Promise<void> => {
    const result = await authService.signOut();
    if (result.success) {
      logout();
      router.replace('/(auth)/register');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Personal Finance Dashboard</Text>
          <Text style={styles.welcomeText}>Welcome, {user?.email || 'User'}!</Text>
        </View>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderTitle}>🎉 Registration Complete!</Text>
          <Text style={styles.placeholderText}>
            Your account has been successfully created and verified. The full dashboard with financial
            tracking features will be implemented in the next stories.
          </Text>

          <View style={styles.featureList}>
            <Text style={styles.featureTitle}>Coming Soon:</Text>
            <Text style={styles.featureItem}>• Transaction tracking</Text>
            <Text style={styles.featureItem}>• Budget management</Text>
            <Text style={styles.featureItem}>• Financial reports</Text>
            <Text style={styles.featureItem}>• Account linking</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6b7280',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 16,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  featureList: {
    alignSelf: 'stretch',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  featureItem: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  signOutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});