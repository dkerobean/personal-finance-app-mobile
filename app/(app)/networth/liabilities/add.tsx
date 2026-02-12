import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@clerk/clerk-expo';
import { useNetWorthStore } from '@/stores/netWorthStore';
import type { CreateLiabilityRequest } from '@/types/models';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, BUDGET } from '@/constants/design';
import { useAppToast } from '@/hooks/useAppToast';
import GradientHeader from '@/components/budgets/GradientHeader';
import { LiabilityForm } from '@/components/networth/liabilities';

export default function AddLiabilityScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const toast = useAppToast();
  const { user } = useUser();
  const { createLiability, error } = useNetWorthStore();

  const handleSaveLiability = async (liabilityData: CreateLiabilityRequest) => {
    if (!user?.id) {
      toast.error('Error', 'You must be logged in to add a liability');
      return;
    }

    setIsLoading(true);
    try {
      const success = await createLiability(user.id, liabilityData);
      if (success) {
        toast.success('Liability Added', `"${liabilityData.name}" added successfully`);
        setTimeout(() => router.back(), 500);
      } else {
        toast.error('Error', error || 'Failed to add liability');
      }
    } catch (_err) {
      toast.error('Error', 'Failed to add liability. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <GradientHeader
            title="Add Liability"
            subtitle="Track debts and payments"
            onBackPress={() => router.back()}
            showCalendar={false}
            showNotification={false}
          />

          <View style={styles.contentCard}>
            <LinearGradient
              colors={['#7F1D1D', '#B91C1C', '#EF4444']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.infoCard}
            >
              <View style={styles.infoIconBg}>
                <MaterialIcons name="trending-down" size={22} color={COLORS.white} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Keep Debt Visible</Text>
                <Text style={styles.infoDescription}>
                  Add loans, mortgages, and credit obligations to keep your net worth accurate.
                </Text>
              </View>
            </LinearGradient>

            <View style={styles.formContainer}>
              <LiabilityForm onSave={handleSaveLiability} onCancel={() => router.back()} isLoading={isLoading} mode="create" />
            </View>
          </View>
        </ScrollView>

        {isLoading ? (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={COLORS.error} />
              <Text style={styles.loadingText}>Saving liability...</Text>
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BUDGET.gradientColors.start,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentCard: {
    backgroundColor: COLORS.backgroundContent,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -20,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    borderRadius: 22,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.lg,
  },
  infoIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.white,
    lineHeight: 19,
    opacity: 0.95,
  },
  formContainer: {
    flex: 1,
    paddingBottom: 110,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.36)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});
