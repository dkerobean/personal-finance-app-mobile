import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';

interface DiagnosticTest {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
}

const DiagnosticScreen: React.FC = () => {
  const [tests, setTests] = useState<DiagnosticTest[]>([
    { name: 'App Constants', status: 'pending', message: 'Checking...' },
    { name: 'Environment Variables', status: 'pending', message: 'Checking...' },
    { name: 'Supabase Import', status: 'pending', message: 'Checking...' },
    { name: 'Stores Import', status: 'pending', message: 'Checking...' },
    { name: 'UI Components', status: 'pending', message: 'Checking...' },
  ]);

  const updateTest = (index: number, status: DiagnosticTest['status'], message: string) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, status, message } : test
    ));
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    // Test 1: App Constants
    try {
      const appName = Constants.expoConfig?.name;
      updateTest(0, 'success', `App: ${appName || 'Unknown'}`);
    } catch (error) {
      updateTest(0, 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 2: Environment Variables
    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        updateTest(1, 'success', 'Environment variables present');
      } else {
        updateTest(1, 'error', `Missing: ${!supabaseUrl ? 'URL ' : ''}${!supabaseKey ? 'KEY' : ''}`);
      }
    } catch (error) {
      updateTest(1, 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 3: Supabase Import
    try {
      const { supabase } = await import('@/services/supabaseClient');
      updateTest(2, 'success', 'Supabase client imported successfully');
    } catch (error) {
      updateTest(2, 'error', `Supabase error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 4: Stores Import
    try {
      const { useAuthStore } = await import('@/stores/authStore');
      updateTest(3, 'success', 'Auth store imported successfully');
    } catch (error) {
      updateTest(3, 'error', `Store error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 5: UI Components
    try {
      const { MaterialIcons } = await import('@expo/vector-icons');
      updateTest(4, 'success', 'UI components loaded successfully');
    } catch (error) {
      updateTest(4, 'error', `UI error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusColor = (status: DiagnosticTest['status']) => {
    switch (status) {
      case 'success': return '#16a34a';
      case 'error': return '#dc2626';
      default: return '#f59e0b';
    }
  };

  const getStatusIcon = (status: DiagnosticTest['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>App Diagnostics</Text>
      <Text style={styles.subtitle}>Checking app configuration and dependencies</Text>
      
      <ScrollView style={styles.testContainer}>
        {tests.map((test, index) => (
          <View key={index} style={styles.testItem}>
            <View style={styles.testHeader}>
              <Text style={styles.testIcon}>{getStatusIcon(test.status)}</Text>
              <Text style={styles.testName}>{test.name}</Text>
            </View>
            <Text style={[styles.testMessage, { color: getStatusColor(test.status) }]}>
              {test.message}
            </Text>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.retryButton} onPress={runDiagnostics}>
        <Text style={styles.retryButtonText}>Run Tests Again</Text>
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Debug Information:</Text>
        <Text style={styles.infoText}>
          • Platform: {Constants.platform?.ios ? 'iOS' : Constants.platform?.android ? 'Android' : 'Unknown'}
        </Text>
        <Text style={styles.infoText}>
          • App Version: {Constants.expoConfig?.version || 'Unknown'}
        </Text>
        <Text style={styles.infoText}>
          • Expo SDK: {Constants.expoConfig?.sdkVersion || 'Unknown'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  testContainer: {
    flex: 1,
    marginBottom: 20,
  },
  testItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#e5e7eb',
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  testIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  testMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
});

export default DiagnosticScreen;