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
import type { Asset, UpdateAssetRequest } from '@/types/models';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, BUDGET } from '@/constants/design';
import { useAppToast } from '@/hooks/useAppToast';
import GradientHeader from '@/components/budgets/GradientHeader';
import { AssetForm } from '@/components/networth/assets';
import { formatCurrency } from '@/lib/formatters';

export default function EditAssetScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [asset, setAsset] = useState<Asset | null>(null);
  const toast = useAppToast();
  const { user } = useUser();

  const { assets, loadAssets, updateAsset, deleteAsset, error } = useNetWorthStore();

  useEffect(() => {
    if (!user?.id || !id) return;

    const ensureLoaded = async () => {
      if (assets.length === 0) {
        await loadAssets(user.id);
      }
    };

    ensureLoaded();
  }, [user?.id, id, assets.length, loadAssets]);

  useEffect(() => {
    if (!id) return;
    const foundAsset = assets.find((entry) => entry.id === id);
    if (foundAsset) {
      setAsset(foundAsset);
    }
  }, [id, assets]);

  useEffect(() => {
    if (!id || !user?.id) return;
    if (!isLoading && assets.length > 0 && !asset) {
      toast.error('Not Found', 'The asset you are trying to edit could not be found.');
      router.back();
    }
  }, [assets.length, asset, id, isLoading, router, toast, user?.id]);

  const handleUpdateAsset = async (assetData: UpdateAssetRequest) => {
    if (!asset || !user?.id) return;
    setIsLoading(true);

    try {
      const success = await updateAsset(user.id, asset.id, assetData);
      if (success) {
        toast.success('Asset Updated', `"${assetData.name || asset.name}" updated successfully`);
        setTimeout(() => router.back(), 500);
      } else {
        toast.error('Error', error || 'Failed to update asset');
      }
    } catch (_err) {
      toast.error('Error', 'Failed to update asset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAsset = async () => {
    if (!asset || !user?.id) return;

    Alert.alert('Delete Asset', `Delete "${asset.name}" from your records?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsLoading(true);
          try {
            const success = await deleteAsset(user.id, asset.id);
            if (success) {
              toast.success('Asset Deleted', `"${asset.name}" has been deleted`);
              setTimeout(() => router.back(), 500);
            } else {
              toast.error('Error', error || 'Failed to delete asset');
            }
          } catch (_err) {
            toast.error('Error', 'Failed to delete asset. Please try again.');
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
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
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <GradientHeader
            title="Edit Asset"
            subtitle="Update value and details"
            onBackPress={() => router.back()}
            showCalendar={false}
            showNotification={false}
          />

          <View style={styles.contentCard}>
            <LinearGradient
              colors={['#033327', COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.infoCard}
            >
              <View style={styles.infoIconBg}>
                <MaterialIcons name="edit" size={22} color={COLORS.white} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>{asset.name}</Text>
                <Text style={styles.infoDescription}>Current value: {formatCurrency(asset.current_value)}</Text>
              </View>
            </LinearGradient>

            <View style={styles.formContainer}>
              <AssetForm
                initialData={asset}
                onSave={handleUpdateAsset}
                onCancel={() => router.back()}
                onDelete={handleDeleteAsset}
                isLoading={isLoading}
                mode="edit"
              />
            </View>
          </View>
        </ScrollView>

        {isLoading ? (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Updating asset...</Text>
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
