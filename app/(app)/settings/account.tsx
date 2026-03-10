import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useClerk, useUser } from '@clerk/clerk-expo';
import GradientHeader from '@/components/budgets/GradientHeader';
import { authService } from '@/services/authService';
import { oneSignalService } from '@/services/oneSignalService';
import { secureStorage } from '@/lib/storage';
import { BUDGET, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/design';

export default function AccountSettingsScreen(): React.ReactElement {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = (): void => {
    Alert.alert(
      'Delete account',
      'This permanently deletes your Kippo account, linked financial records stored by this app, and signs you out. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDeleteAccount,
        },
      ]
    );
  };

  const confirmDeleteAccount = async (): Promise<void> => {
    if (!user?.id || typeof user.delete !== 'function') {
      Alert.alert(
        'Deletion unavailable',
        'Your account could not be deleted from this device. Please contact support before submitting to the App Store.'
      );
      return;
    }

    setIsDeleting(true);

    try {
      await oneSignalService.removeUserId().catch(() => false);

      const deleteResult = await authService.deleteAccountData(user.id);
      if (!deleteResult.success) {
        throw new Error(deleteResult.error || 'Failed to delete your app data.');
      }

      await user.delete();
      await secureStorage.clear();
      await signOut().catch(() => undefined);
      router.replace('/(auth)/login');
    } catch (error: any) {
      Alert.alert('Deletion failed', error?.message || 'Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.mainScrollView} showsVerticalScrollIndicator={false}>
        <GradientHeader
          title="Account & Data"
          subtitle="Manage permanent account actions"
          onBackPress={() => router.back()}
          showCalendar={false}
          showNotification={false}
        />

        <View style={styles.contentCard}>
          <View style={styles.warningCard}>
            <Text style={styles.warningEyebrow}>Permanent action</Text>
            <Text style={styles.warningTitle}>Delete your account from inside the app</Text>
            <Text style={styles.warningBody}>
              Deleting your account removes your Kippo profile and app-managed financial records stored for this user.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Before you continue</Text>
            <Text style={styles.infoText}>Make sure you no longer need your transaction history, budgets, linked accounts, or reports.</Text>
            <Text style={styles.infoText}>If you have an active subscription managed outside the app, cancel it separately in App Store subscriptions first.</Text>
          </View>

          <TouchableOpacity
            style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
            activeOpacity={0.88}
          >
            {isDeleting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.deleteButtonText}>Delete Account Permanently</Text>
            )}
          </TouchableOpacity>

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BUDGET.gradientColors.start,
  },
  mainScrollView: {
    flex: 1,
  },
  contentCard: {
    backgroundColor: COLORS.backgroundContent,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -20,
    minHeight: '100%',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  warningCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 24,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  warningEyebrow: {
    color: '#C2410C',
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  warningTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '800',
    marginBottom: SPACING.sm,
  },
  warningBody: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 24,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  infoText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: COLORS.error,
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.md,
  },
  deleteButtonDisabled: {
    opacity: 0.7,
  },
  deleteButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '700',
  },
  bottomSpacing: {
    height: SPACING.xxxl,
  },
});
