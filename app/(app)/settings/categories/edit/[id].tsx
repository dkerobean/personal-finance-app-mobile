import React, { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useCategoryStore } from '@/stores/categoryStore';
import type { Category } from '@/types/models';

const AVAILABLE_ICONS = [
  'restaurant',
  'car',
  'attach-money',
  'movie',
  'shopping-bag',
  'receipt',
  'local-hospital',
  'school',
  'home',
  'fitness-center',
  'pets',
  'travel-explore',
  'phone',
  'computer',
  'coffee',
  'sports-soccer',
];

export default function EditCategoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { categories, updateCategory, isLoading, error } = useCategoryStore();

  const [category, setCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('restaurant');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (id && categories.length > 0) {
      const foundCategory = categories.find(cat => cat.id === id);
      if (foundCategory) {
        setCategory(foundCategory);
        setName(foundCategory.name);
        setSelectedIcon(foundCategory.icon_name);
      }
    }
  }, [id, categories]);

  const validateForm = () => {
    let isValid = true;
    
    if (!name.trim()) {
      setNameError('Category name is required');
      isValid = false;
    } else if (name.trim().length < 2) {
      setNameError('Category name must be at least 2 characters');
      isValid = false;
    } else {
      setNameError('');
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!category || !validateForm()) return;

    const success = await updateCategory(
      category.id,
      name.trim() !== category.name ? name.trim() : undefined,
      selectedIcon !== category.icon_name ? selectedIcon : undefined
    );
    
    if (success) {
      Alert.alert('Success', 'Category updated successfully');
      router.back();
    } else if (error) {
      Alert.alert('Error', error);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (!category) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading category...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Category Name</Text>
              <TextInput
                style={[styles.input, nameError ? styles.inputError : null]}
                placeholder="Enter category name"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (nameError) setNameError('');
                }}
                autoCapitalize="words"
                maxLength={50}
              />
              {nameError && (
                <Text style={styles.errorText}>{nameError}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Select Icon</Text>
              
              <View style={styles.iconGrid}>
                {Array.from({ length: Math.ceil(AVAILABLE_ICONS.length / 4) }, (_, rowIndex) => (
                  <View key={rowIndex} style={styles.iconRow}>
                    {AVAILABLE_ICONS.slice(rowIndex * 4, (rowIndex + 1) * 4).map((iconName) => (
                      <TouchableOpacity
                        key={iconName}
                        onPress={() => setSelectedIcon(iconName)}
                        style={[
                          styles.iconButton,
                          selectedIcon === iconName && styles.iconButtonSelected
                        ]}
                      >
                        <MaterialIcons
                          name={iconName as any}
                          size={32}
                          color={selectedIcon === iconName ? '#007bff' : '#666'}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </View>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                (isLoading || !name.trim()) && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={isLoading || !name.trim()}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Updating...' : 'Update Category'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  form: {
    gap: 24,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
  },
  iconGrid: {
    gap: 8,
    marginTop: 8,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  iconButtonSelected: {
    borderColor: '#007bff',
    backgroundColor: '#eff6ff',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 48,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007bff',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});