import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@clerk/clerk-expo';
import { useNetWorthStore } from '@/stores/netWorthStore';
import type { Liability, UpdateLiabilityRequest } from '@/types/models';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, BUDGET } from '@/constants/design';
import { useAppToast } from '@/hooks/useAppToast';
import GradientHeader from '@/components/budgets/GradientHeader';
import { LiabilityForm } from '@/components/networth/liabilities';
import { formatCurrency } from '@/lib/formatters';

export default function EditLiabilityScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [liability, setLiability] = useState<Liability | null>(null);
  const toast = useAppToast();
  const { user } = useUser();

  const { liabilities, loadLiabilities, updateLiability, deleteLiability, error } = useNetWorthStore();

  useEffect(() => {
    if (!user?.id || !id) return;

    const ensureLoaded = async () => {
      if (liabilities.length === 0) {
        await loadLiabilities(user.id);
      }
    };

    ensureLoaded();
  }, [user?.id, id, liabilities.length, loadLiabilities]);

  useEffect(() => {
    if (!id) return;
    const foundLiability = liabilities.find((entry) => entry.id === id);
    if (foundLiability) {
      setLiability(foundLiability);
    }
  }, [id, liabilities]);

  useEffect(() => {
    if (!id || !user?.id) return;
    if (!isLoading && liabilities.length > 0 && !liability) {
      toast.error('Not Found', 'The liability you are trying to edit could not be found.');
      router.back();
    }
  }, [liabilities.length, liability, id, isLoading, router, toast, user?.id]);

  const handleUpdateLiability = async (liabilityData: UpdateLiabilityRequest) => {
    if (!liability || !user?.id) return;
    setIsLoading(true);

    try {
      const success = await updateLiability(user.id, liability.id, liabilityData);
      if (success) {
        toast.success('Liability Updated', `"${liabilityData.name || liability.name}" updated successfully`);
        setTimeout(() => router.back(), 500);
      } else {
        toast.error('Error', error || 'Failed to update liability');
      }
    } catch (_err) {
      toast.error('Error', 'Failed to update liability. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLiability = async () => {
    if (!liability || !user?.id) return;

    Alert.alert('Delete Liability', `Delete "${liability.name}" from your records?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsLoading(true);
          try {
            const success = await deleteLiability(user.id, liability.id);
            if (success) {
              toast.success('Liability Deleted', `"${liability.name}" has been deleted`);
              setTimeout(() => router.back(), 500);
            } else {
              toast.error('Error', error || 'Failed to delete liability');
            }
          } catch (_err) {
            toast.error('Error', 'Failed to delete liability. Please try again.');
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  if (!liability) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.error} />
          <Text style={styles.loadingText}>Loading liability...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <GradientHeader
            title="Edit Liability"
            subtitle="Update debt values and terms"
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
                <MaterialIcons name="edit" size={22} color={COLORS.white} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>{liability.name}</Text>
                <Text style={styles.infoDescription}>
                  Current balance: {formatCurrency(liability.current_balance)}
                </Text>
              </View>
            </LinearGradient>

            <View style={styles.formContainer}>
              <LiabilityForm
                initialData={liability}
                onSave={handleUpdateLiability}
                onCancel={() => router.back()}
                onDelete={handleDeleteLiability}
                isLoading={isLoading}
                mode="edit"
              />
            </View>
          </View>
        </ScrollView>

        {isLoading ? (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={COLORS.error} />
              <Text style={styles.loadingText}>Updating liability...</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  formContainer: {
    flex: 1,
    paddingBottom: 110,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
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
});
