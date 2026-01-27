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
import type { Asset, UpdateAssetRequest } from '@/types/models';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, BUDGET } from '@/constants/design';
import { useAppToast } from '@/hooks/useAppToast';
import GradientHeader from '@/components/budgets/GradientHeader';
import { AssetForm } from '@/components/networth/assets';

export default function EditAssetScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [asset, setAsset] = useState<Asset | null>(null);
  const toast = useAppToast();
  
  const { assets, updateAsset, deleteAsset, error } = useNetWorthStore();

  useEffect(() => {
    if (id && assets.length > 0) {
      const foundAsset = assets.find(a => a.id === id);
      if (foundAsset) {
        setAsset(foundAsset);
      } else {
        toast.error('Not Found', 'The asset you are trying to edit could not be found.');
        router.back();
      }
    }
  }, [id, assets]);

  const handleUpdateAsset = async (assetData: UpdateAssetRequest) => {
    if (!asset) return;
    
    setIsLoading(true);
    
    try {
      const success = await updateAsset(asset.id, assetData);
      
      if (success) {
        toast.success('Asset Updated', `"${assetData.name || asset.name}" updated successfully`);
        setTimeout(() => router.back(), 500);
      } else if (error) {
        toast.error('Error', error);
      }
    } catch (err) {
      toast.error('Error', 'Failed to update asset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAsset = async () => {
    if (!asset) return;
    
    setIsLoading(true);
    
    try {
      const success = await deleteAsset(asset.id);
      
      if (success) {
        toast.success('Asset Deleted', `"${asset.name}" has been deleted`);
        setTimeout(() => router.back(), 500);
      } else if (error) {
        toast.error('Error', error);
      }
    } catch (err) {
      toast.error('Error', 'Failed to delete asset. Please try again.');
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

  if (!asset) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading asset...</Text>
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
            title="Edit Asset"
            onBackPress={handleGoBack}
            onCalendarPress={() => {}}
            onNotificationPress={() => {}}
          />

          {/* Content Card */}
          <View style={styles.contentCard}>
            {/* Asset Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoIconBg}>
                <MaterialIcons name="edit" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Editing: {asset.name}</Text>
                <Text style={styles.infoDescription}>
                  Current value: ₵{asset.current_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            {/* Delete Button */}
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAsset}>
              <MaterialIcons name="delete-outline" size={20} color={COLORS.error} />
              <Text style={styles.deleteButtonText}>Delete Asset</Text>
            </TouchableOpacity>

            {/* Asset Form */}
            <View style={styles.formContainer}>
              <AssetForm 
                initialData={asset}
                onSave={handleUpdateAsset}
                onCancel={handleCancel}
                onDelete={handleDeleteAsset}
                isLoading={isLoading}
                mode="edit"
              />
            </View>
          </View>
        </ScrollView>
        
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Updating asset...</Text>
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
    backgroundColor: COLORS.primaryLight,
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
    color: COLORS.success,
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