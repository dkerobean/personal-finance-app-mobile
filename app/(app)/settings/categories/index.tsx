import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  StyleSheet,
  SafeAreaView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useCategoryStore } from '@/stores/categoryStore';
import type { Category } from '@/types/models';

export default function CategoriesScreen() {
  const router = useRouter();
  const {
    categories,
    isLoading,
    error,
    loadCategories,
    deleteCategory,
    clearError,
  } = useCategoryStore();

  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const handleDeletePress = (category: Category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => handleDeleteConfirm(category.id)
        }
      ]
    );
  };

  const handleDeleteConfirm = async (categoryId: string) => {
    const success = await deleteCategory(categoryId);
    if (!success && error) {
      Alert.alert('Error', error);
    }
  };

  const handleEditPress = (categoryId: string) => {
    router.push(`/settings/categories/edit/${categoryId}`);
  };

  const handleCreatePress = () => {
    router.push('/settings/categories/create');
  };

  if (isLoading && categories.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={clearError} style={styles.errorCloseButton}>
                <MaterialIcons name="close" size={20} color="#dc3545" />
              </TouchableOpacity>
            </View>
          )}

          {categories.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No categories found.{'\n'}Create your first category or load default categories.
              </Text>
              <TouchableOpacity 
                style={styles.seedButton}
                onPress={async () => {
                  const { seedDefaults } = useCategoryStore.getState();
                  await seedDefaults();
                }}
                disabled={isLoading}
              >
                <Text style={styles.seedButtonText}>
                  {isLoading ? 'Loading...' : 'Create Default Categories'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.categoriesList}>
              {categories.map((category) => (
                <View key={category.id} style={styles.categoryItem}>
                  <View style={styles.categoryInfo}>
                    <View style={styles.iconContainer}>
                      <MaterialIcons
                        name={category.icon_name as any}
                        size={24}
                        color="#007bff"
                      />
                    </View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </View>

                  <View style={styles.categoryActions}>
                    <TouchableOpacity 
                      onPress={() => handleEditPress(category.id)}
                      style={styles.actionButton}
                    >
                      <MaterialIcons name="edit" size={20} color="#666" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      onPress={() => handleDeletePress(category)}
                      style={styles.actionButton}
                    >
                      <MaterialIcons name="delete" size={20} color="#dc3545" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleCreatePress}>
        <MaterialIcons name="add" size={24} color="#fff" />
      </TouchableOpacity>
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
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#dc3545',
    flex: 1,
  },
  errorCloseButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    color: '#9ca3af',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 24,
  },
  seedButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  seedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  categoriesList: {
    gap: 8,
  },
  categoryItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    backgroundColor: '#eff6ff',
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});