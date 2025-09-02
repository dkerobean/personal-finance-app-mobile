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
import type { Liability, UpdateLiabilityRequest } from '@/types/models';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/design';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/ui/CustomAlert';
import { LiabilityForm } from '@/components/networth/liabilities';

export default function EditLiabilityScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [liability, setLiability] = useState<Liability | null>(null);
  const { alert, alertProps } = useCustomAlert();
  
  const { liabilities, updateLiability, deleteLiability, error } = useNetWorthStore();

  useEffect(() => {
    if (id && liabilities.length > 0) {
      const foundLiability = liabilities.find(l => l.id === id);
      if (foundLiability) {
        setLiability(foundLiability);
      } else {
        alert('Debt Not Found', 'The debt you are trying to edit could not be found.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    }
  }, [id, liabilities]);

  const handleUpdateLiability = async (liabilityData: UpdateLiabilityRequest) => {
    if (!liability) return;
    
    setIsLoading(true);
    
    try {
      const success = await updateLiability(liability.id, liabilityData);
      
      if (success) {
        alert(
          'Debt Updated',
          `"${liabilityData.name || liability.name}" has been updated successfully.`,
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
      alert('Error', 'Failed to update debt. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLiability = () => {
    if (!liability) return;
    
    alert(
      'Delete Debt',
      `Are you sure you want to delete "${liability.name}" with balance $${liability.current_balance.toFixed(2)}? This action cannot be undone.`,
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
    if (!liability) return;
    
    setIsLoading(true);
    
    try {
      const success = await deleteLiability(liability.id);
      
      if (success) {
        alert(
          'Debt Deleted',
          `"${liability.name}" has been deleted successfully.`,
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
      alert('Error', 'Failed to delete debt. Please try again.');
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

  if (!liability) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.error} />
          <Text style={styles.loadingText}>Loading debt...</Text>
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
        <Text style={styles.title}>Edit Debt</Text>
        <TouchableOpacity onPress={handleDeleteLiability} style={styles.deleteButton}>
          <MaterialIcons name="delete-outline" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
      </ScrollView>
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.error} />
          <Text style={styles.loadingText}>Updating debt...</Text>
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