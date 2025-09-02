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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useNetWorthStore } from '@/stores/netWorthStore';
import type { Asset, UpdateAssetRequest } from '@/types/models';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/design';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/ui/CustomAlert';
import { AssetForm } from '@/components/networth/assets';

export default function EditAssetScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [asset, setAsset] = useState<Asset | null>(null);
  const { alert, alertProps } = useCustomAlert();
  
  const { assets, updateAsset, deleteAsset, error } = useNetWorthStore();

  useEffect(() => {
    if (id && assets.length > 0) {
      const foundAsset = assets.find(a => a.id === id);
      if (foundAsset) {
        setAsset(foundAsset);
      } else {
        alert('Asset Not Found', 'The asset you are trying to edit could not be found.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    }
  }, [id, assets]);

  const handleUpdateAsset = async (assetData: UpdateAssetRequest) => {
    if (!asset) return;
    
    setIsLoading(true);
    
    try {
      const success = await updateAsset(asset.id, assetData);
      
      if (success) {
        alert(
          'Asset Updated',
          `"${assetData.name || asset.name}" has been updated successfully.`,
          [{ 
            text: 'OK', 
            style: 'default',
            onPress: () => router.back()
          }]
        );
      } else if (error) {
        alert('Error', error);
      }
    } catch (err) {
      alert('Error', 'Failed to update asset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAsset = () => {
    if (!asset) return;
    
    alert(
      'Delete Asset',
      `Are you sure you want to delete "${asset.name}" worth $${asset.current_value.toFixed(2)}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: confirmDelete
        }
      ]
    );
  };

  const confirmDelete = async () => {
    if (!asset) return;
    
    setIsLoading(true);
    
    try {
      const success = await deleteAsset(asset.id);
      
      if (success) {
        alert(
          'Asset Deleted',
          `"${asset.name}" has been deleted successfully.`,
          [{ 
            text: 'OK', 
            style: 'default',
            onPress: () => router.back()
          }]
        );
      } else if (error) {
        alert('Error', error);
      }
    } catch (err) {
      alert('Error', 'Failed to delete asset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    alert(
      'Discard Changes?',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Continue Editing', style: 'cancel' },
        { 
          text: 'Discard', 
          style: 'destructive',
          onPress: () => router.back()
        }
      ]
    );
  };

  if (!asset) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading asset...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
          <MaterialIcons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Asset</Text>
        <TouchableOpacity onPress={handleDeleteAsset} style={styles.deleteButton}>
          <MaterialIcons name="delete-outline" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
      </ScrollView>
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Updating asset...</Text>
        </View>
      )}
      
      <CustomAlert {...alertProps} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundMain,
    paddingTop: 44,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 37,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.backgroundInput,
  },
  cancelButton: {
    padding: 8,
    borderRadius: 20,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 37,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    fontFamily: 'Poppins',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});