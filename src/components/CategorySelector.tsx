import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Category } from '@/types/models';
import { useCategoryStore } from '@/stores/categoryStore';

interface CategorySelectorProps {
  categories: Category[];
  selectedCategoryId?: string;
  onSelect: (categoryId: string) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
}

export default function CategorySelector({
  categories,
  selectedCategoryId,
  onSelect,
  placeholder = "Select a category...",
  error = false,
  disabled = false,
}: CategorySelectorProps): React.ReactElement {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('category');
  
  const { createCategory, isLoading: isCreatingCategory } = useCategoryStore();

  // Available icons for categories
  const availableIcons = [
    'restaurant', 'directions-car', 'attach-money', 'movie', 'shopping-bag',
    'receipt', 'local-hospital', 'school', 'home', 'fitness-center',
    'pets', 'flight', 'sports-esports', 'music-note', 'work',
    'family-restroom', 'local-grocery-store', 'local-gas-station', 'phone',
    'wifi', 'category'
  ];

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
  
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Debug logging
  console.log('CategorySelector: Received categories count:', categories.length);
  console.log('CategorySelector: Filtered categories count:', filteredCategories.length);
  console.log('CategorySelector: Search text:', searchText);
  
  if (categories.length > 0) {
    console.log('CategorySelector: First few categories:', categories.slice(0, 3).map(c => ({ id: c.id, name: c.name })));
  }

  const handleSelect = (categoryId: string) => {
    onSelect(categoryId);
    setModalVisible(false);
    setSearchText('');
  };

  const handleClose = () => {
    setModalVisible(false);
    setSearchText('');
    setShowCreateForm(false);
    setNewCategoryName('');
    setSelectedIcon('category');
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    const success = await createCategory(newCategoryName.trim(), selectedIcon);
    
    if (success) {
      Alert.alert('Success', 'Category created successfully');
      setShowCreateForm(false);
      setNewCategoryName('');
      setSelectedIcon('category');
      // The category store will automatically reload categories
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.selector, error && styles.selectorError]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <View style={styles.selectorContent}>
          {selectedCategory ? (
            <View style={styles.selectedCategory}>
              <MaterialIcons 
                name={selectedCategory.icon_name as any || 'category'} 
                size={20} 
                color="#374151" 
              />
              <Text style={styles.selectedCategoryText}>{selectedCategory.name}</Text>
            </View>
          ) : (
            <Text style={[styles.placeholder, disabled && styles.placeholderDisabled]}>
              {disabled ? "Loading categories..." : placeholder}
            </Text>
          )}
        </View>
        <MaterialIcons 
          name="arrow-drop-down" 
          size={24} 
          color={disabled ? "#9ca3af" : "#6b7280"} 
        />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <MaterialIcons name="search" size={20} color="#6b7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search categories..."
                value={searchText}
                onChangeText={setSearchText}
                autoCapitalize="none"
              />
            </View>

            <ScrollView style={styles.categoriesContainer}>
              {showCreateForm ? (
                <View style={styles.createCategoryForm}>
                  <Text style={styles.createCategoryTitle}>Create New Category</Text>
                  
                  <TextInput
                    style={styles.categoryNameInput}
                    placeholder="Category name"
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    autoCapitalize="words"
                  />
                  
                  <Text style={styles.iconSelectorLabel}>Select Icon</Text>
                  <ScrollView horizontal style={styles.iconSelector} showsHorizontalScrollIndicator={false}>
                    {availableIcons.map((icon) => (
                      <TouchableOpacity
                        key={icon}
                        style={[
                          styles.iconOption,
                          selectedIcon === icon && styles.iconOptionSelected
                        ]}
                        onPress={() => setSelectedIcon(icon)}
                      >
                        <MaterialIcons 
                          name={icon as any} 
                          size={24} 
                          color={selectedIcon === icon ? "#2563eb" : "#6b7280"} 
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  
                  <View style={styles.createCategoryButtons}>
                    <TouchableOpacity 
                      style={styles.cancelCreateButton} 
                      onPress={() => setShowCreateForm(false)}
                    >
                      <Text style={styles.cancelCreateButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.createButton} 
                      onPress={handleCreateCategory}
                      disabled={isCreatingCategory}
                    >
                      <Text style={styles.createButtonText}>
                        {isCreatingCategory ? 'Creating...' : 'Create'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  {filteredCategories.length === 0 ? (
                    <View style={styles.noResultsContainer}>
                      <MaterialIcons 
                        name={searchText ? "search-off" : "category"} 
                        size={48} 
                        color="#9ca3af" 
                      />
                      <Text style={styles.noResultsText}>
                        {searchText ? "No categories found" : "No categories available"}
                      </Text>
                      <Text style={styles.noResultsSubtext}>
                        {searchText ? "Try adjusting your search" : "Categories will appear here when loaded"}
                      </Text>
                    </View>
                  ) : (
                    <>
                      {filteredCategories.map((category) => (
                        <TouchableOpacity
                          key={category.id}
                          style={[
                            styles.categoryItem,
                            category.id === selectedCategoryId && styles.categoryItemSelected
                          ]}
                          onPress={() => handleSelect(category.id)}
                        >
                          <View style={styles.categoryContent}>
                            <MaterialIcons 
                              name={category.icon_name as any || 'category'} 
                              size={24} 
                              color={category.id === selectedCategoryId ? "#2563eb" : "#374151"} 
                            />
                            <Text style={[
                              styles.categoryName,
                              category.id === selectedCategoryId && styles.categoryNameSelected
                            ]}>
                              {category.name}
                            </Text>
                            {category.user_id && (
                              <View style={styles.customBadge}>
                                <Text style={styles.customBadgeText}>Custom</Text>
                              </View>
                            )}
                          </View>
                          {category.id === selectedCategoryId && (
                            <MaterialIcons name="check" size={20} color="#2563eb" />
                          )}
                        </TouchableOpacity>
                      ))}
                      
                      {/* Create New Category Button */}
                      <TouchableOpacity
                        style={styles.createNewCategoryItem}
                        onPress={() => setShowCreateForm(true)}
                      >
                        <View style={styles.categoryContent}>
                          <MaterialIcons 
                            name="add-circle-outline" 
                            size={24} 
                            color="#2563eb" 
                          />
                          <Text style={styles.createNewCategoryText}>Create New Category</Text>
                        </View>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    minHeight: 50,
  },
  selectorError: {
    borderColor: '#dc3545',
  },
  selectorContent: {
    flex: 1,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCategoryText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  placeholder: {
    fontSize: 16,
    color: '#9ca3af',
  },
  placeholderDisabled: {
    color: '#d1d5db',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  categoriesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    minHeight: 200,
    backgroundColor: '#f0f9ff',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryItemSelected: {
    backgroundColor: '#eff6ff',
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryName: {
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  categoryNameSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  createCategoryForm: {
    padding: 16,
  },
  createCategoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  categoryNameInput: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  iconSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  iconSelector: {
    marginBottom: 24,
  },
  iconOption: {
    width: 48,
    height: 48,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  createCategoryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelCreateButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelCreateButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  createButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  createNewCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  createNewCategoryText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  customBadge: {
    backgroundColor: '#dcfdf7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#065f46',
    textTransform: 'uppercase',
  },
});