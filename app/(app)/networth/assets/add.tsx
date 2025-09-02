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
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useNetWorthStore } from '@/stores/netWorthStore';
import type { AssetCategory, AssetType, CreateAssetRequest } from '@/types/models';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/design';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/ui/CustomAlert';
import { AssetForm } from '@/components/networth/assets';

export default function AddAssetScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { alert, alertProps } = useCustomAlert();
  
  const { createAsset, error } = useNetWorthStore();

  const handleSaveAsset = async (assetData: CreateAssetRequest) => {
    setIsLoading(true);
    
    try {
      const success = await createAsset(assetData);
      
      if (success) {
        alert(
          'Asset Added',
          `"${assetData.name}" has been added to your assets successfully.`,
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
      alert('Error', 'Failed to add asset. Please try again.');
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
        <Text style={styles.title}>Add Asset</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <AssetForm 
            onSave={handleSaveAsset}
            onCancel={handleCancel}
            isLoading={isLoading}
            mode="create"
          />
        </View>
      </ScrollView>
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Adding asset...</Text>
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
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 37,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    fontFamily: 'Poppins',
  },
});