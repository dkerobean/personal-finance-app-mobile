import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useNetWorthStore } from '@/stores/netWorthStore';
import type { CreateAssetRequest } from '@/types/models';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, BUDGET } from '@/constants/design';
import { useAppToast } from '@/hooks/useAppToast';
import GradientHeader from '@/components/budgets/GradientHeader';
import { AssetForm } from '@/components/networth/assets';

export default function AddAssetScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const toast = useAppToast();
  
  const { createAsset, error } = useNetWorthStore();

  const handleSaveAsset = async (assetData: CreateAssetRequest) => {
    setIsLoading(true);
    
    try {
      const success = await createAsset(assetData);
      
      if (success) {
        toast.success('Asset Added', `"${assetData.name}" added successfully`);
        setTimeout(() => router.back(), 500);
      } else if (error) {
        toast.error('Error', error);
      }
    } catch (err) {
      toast.error('Error', 'Failed to add asset. Please try again.');
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
            title="Add Asset"
            onBackPress={handleGoBack}
            onCalendarPress={() => {}}
            onNotificationPress={() => {}}
          />

          {/* Content Card */}
          <View style={styles.contentCard}>
            {/* Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoIconBg}>
                <MaterialIcons name="trending-up" size={24} color={COLORS.success} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Track Your Wealth</Text>
                <Text style={styles.infoDescription}>
                  Add assets like property, investments, vehicles, and more to calculate your net worth.
                </Text>
              </View>
            </View>

            {/* Asset Form */}
            <View style={styles.formContainer}>
              <AssetForm 
                onSave={handleSaveAsset}
                onCancel={handleCancel}
                isLoading={isLoading}
                mode="create"
              />
            </View>
          </View>
        </ScrollView>
        
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Adding asset...</Text>
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
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  infoIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    lineHeight: 20,
  },
  formContainer: {
    flex: 1,
    paddingBottom: 100,
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
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});