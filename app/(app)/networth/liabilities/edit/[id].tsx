import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useNetWorthStore } from '@/stores/netWorthStore';
import type { Liability, UpdateLiabilityRequest } from '@/types/models';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, BUDGET } from '@/constants/design';
import { useAppToast } from '@/hooks/useAppToast';
import GradientHeader from '@/components/budgets/GradientHeader';
import { LiabilityForm } from '@/components/networth/liabilities';

export default function EditLiabilityScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [liability, setLiability] = useState<Liability | null>(null);
  const toast = useAppToast();
  
  const { liabilities, updateLiability, deleteLiability, error } = useNetWorthStore();

  useEffect(() => {
    if (id && liabilities.length > 0) {
      const foundLiability = liabilities.find(l => l.id === id);
      if (foundLiability) {
        setLiability(foundLiability);
      } else {
        toast.error('Not Found', 'The liability you are trying to edit could not be found.');
        router.back();
      }
    }
  }, [id, liabilities]);

  const handleUpdateLiability = async (liabilityData: UpdateLiabilityRequest) => {
    if (!liability) return;
    
    setIsLoading(true);
    
    try {
      const success = await updateLiability(liability.id, liabilityData);
      
      if (success) {
        toast.success('Liability Updated', `"${liabilityData.name || liability.name}" updated successfully`);
        setTimeout(() => router.back(), 500);
      } else if (error) {
        toast.error('Error', error);
      }
    } catch (err) {
      toast.error('Error', 'Failed to update liability. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLiability = async () => {
    if (!liability) return;
    
    setIsLoading(true);
    
    try {
      const success = await deleteLiability(liability.id);
      
      if (success) {
        toast.success('Liability Deleted', `"${liability.name}" has been deleted`);
        setTimeout(() => router.back(), 500);
      } else if (error) {
        toast.error('Error', error);
      }
    } catch (err) {
      toast.error('Error', 'Failed to delete liability. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleGoBack = () => {
    router.back();
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
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Gradient Header */}
          <GradientHeader
            title="Edit Liability"
            onBackPress={handleGoBack}
            onCalendarPress={() => {}}
            onNotificationPress={() => {}}
          />

          {/* Content Card */}
          <View style={styles.contentCard}>
            {/* Liability Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoIconBg}>
                <MaterialIcons name="edit" size={24} color={COLORS.error} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Editing: {liability.name}</Text>
                <Text style={styles.infoDescription}>
                  Current balance: ₵{liability.current_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            {/* Delete Button */}
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteLiability}>
              <MaterialIcons name="delete-outline" size={20} color={COLORS.error} />
              <Text style={styles.deleteButtonText}>Delete Liability</Text>
            </TouchableOpacity>

            {/* Liability Form */}
            <View style={styles.formContainer}>
              <LiabilityForm 
                initialData={liability}
                onSave={handleUpdateLiability}
                onCancel={handleCancel}
                onDelete={handleDeleteLiability}
                isLoading={isLoading}
                mode="edit"
              />
            </View>
          </View>
        </ScrollView>
        
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={COLORS.error} />
              <Text style={styles.loadingText}>Updating liability...</Text>
            </View>
          </View>
        )}
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
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  infoIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  infoTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  infoDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.error,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  deleteButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.error,
  },
  formContainer: {
    flex: 1,
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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