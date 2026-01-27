import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { MonoConnect } from '@/components/features/MonoConnect';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/constants/design';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddAccountScreen() {
  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Account</Text>
          <View style={{ width: 40 }} /> 
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="account-balance" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.heroTitle}>Link your financial life</Text>
            <Text style={styles.heroSubtitle}>
              Connect your Bank or Mobile Money account securely to automatically track your income and expenses.
            </Text>
          </View>

          {/* Action Section */}
          <View style={styles.card}>
            <MonoConnect 
                onSuccess={() => {
                    // Navigate back after successful link
                    router.back();
                }}
            />
          </View>

          {/* Security Badge */}
          <View style={styles.securityContainer}>
             <MaterialIcons name="lock" size={20} color={COLORS.success} />
             <Text style={styles.securityText}>
                Bank-grade security. Your credentials are encrypted and never stored on our servers.
             </Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundMain, // Using main background (likely green or white depending on design) - resetting to white for this screen for cleanliness
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  backButton: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.gray50,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  content: {
    padding: SPACING.xl,
    paddingTop: SPACING.xxxl,
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.md,
  },
  card: {
    width: '100%',
    marginBottom: SPACING.xxl,
  },
  securityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    width: '100%',
    gap: SPACING.md,
  },
  securityText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    lineHeight: 20,
    fontWeight: '500',
  }
});
