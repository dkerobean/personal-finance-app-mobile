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
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Category } from '@/types/models';
import { useCategoryStore } from '@/stores/categoryStore';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/design';
import { useAuth } from '@clerk/clerk-expo';
import { mapIconName, getAvailableIcons } from '@/utils/iconMapping';

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
  const { userId } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('apps-outline');
  
  const { createCategory, isLoading: isCreatingCategory } = useCategoryStore();

  // Use Ionicons from the mapping utility
  const availableIcons = getAvailableIcons();

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
  
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchText.toLowerCase())
  );

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
    setSelectedIcon('apps-outline');
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    const success = await createCategory(userId, newCategoryName.trim(), selectedIcon);

    
    if (success) {
      Alert.alert('Success', 'Category created successfully');
      setShowCreateForm(false);
      setNewCategoryName('');
      setSelectedIcon('apps-outline');
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
              <View style={styles.selectorIconBg}>
                <Ionicons 
                  name={mapIconName(selectedCategory.icon_name, selectedCategory.name) as any} 
                  size={18} 
                  color={COLORS.primary} 
                />
              </View>
              <Text style={styles.selectedCategoryText}>{selectedCategory.name}</Text>
            </View>
          ) : (
            <Text style={[styles.placeholder, disabled && styles.placeholderDisabled]}>
              {disabled ? "Loading categories..." : placeholder}
            </Text>
          )}
        </View>
        <MaterialIcons 
          name="keyboard-arrow-down" 
          size={24} 
          color={disabled ? COLORS.textTertiary : COLORS.textSecondary} 
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
                <MaterialIcons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <MaterialIcons name="search" size={20} color={COLORS.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search categories..."
                placeholderTextColor={COLORS.textTertiary}
                value={searchText}
                onChangeText={setSearchText}
                autoCapitalize="none"
              />
            </View>

            <ScrollView style={styles.categoriesContainer} showsVerticalScrollIndicator={false}>
              {showCreateForm ? (
                <View style={styles.createCategoryForm}>
                  {/* Header Section */}
                  <View style={styles.createHeader}>
                    <Text style={styles.createCategoryTitle}>Create New Category</Text>
                    <Text style={styles.createSubtitle}>Organize your transactions with custom categories</Text>
                  </View>
                  
                  {/* Category Name Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputGroupLabel}>Category Name</Text>
                    <TextInput
                      style={styles.categoryNameInput}
                      placeholder="e.g. Groceries, Rent, Salary"
                      placeholderTextColor={COLORS.textTertiary}
                      value={newCategoryName}
                      onChangeText={setNewCategoryName}
                      autoCapitalize="words"
                    />
                  </View>
                  
                  {/* Icon Selector */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputGroupLabel}>Choose Icon</Text>
                    <View style={styles.iconGrid}>
                      {availableIcons.map((icon) => (
                        <TouchableOpacity
                          key={icon}
                          style={[
                            styles.iconGridItem,
                            selectedIcon === icon && styles.iconGridItemSelected
                          ]}
                          onPress={() => setSelectedIcon(icon)}
                        >
                          <Ionicons 
                            name={icon as any} 
                            size={24} 
                            color={selectedIcon === icon ? COLORS.white : COLORS.primary} 
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  
                  {/* Bottom spacing for buttons */}
                  <View style={{ height: 100 }} />
                </View>
              ) : (

                <>
                  {filteredCategories.length === 0 ? (
                    <View style={styles.noResultsContainer}>
                      <MaterialIcons 
                        name={searchText ? "search-off" : "category"} 
                        size={48} 
                        color={COLORS.textTertiary} 
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
                            <View style={[
                              styles.categoryIconBg,
                              category.id === selectedCategoryId && styles.categoryIconBgSelected
                            ]}>
                              <Ionicons 
                                name={mapIconName(category.icon_name, category.name) as any} 
                                size={20} 
                                color={category.id === selectedCategoryId ? COLORS.white : COLORS.primary} 
                              />
                            </View>
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
                            <MaterialIcons name="check-circle" size={22} color={COLORS.primary} />
                          )}
                        </TouchableOpacity>
                      ))}
                      
                      {/* Create New Category Button */}
                      <TouchableOpacity
                        style={styles.createNewCategoryItem}
                        onPress={() => setShowCreateForm(true)}
                      >
                        <View style={styles.categoryContent}>
                          <View style={styles.createIconBg}>
                            <MaterialIcons 
                              name="add" 
                              size={20} 
                              color={COLORS.primary} 
                            />
                          </View>
                          <Text style={styles.createNewCategoryText}>Create New Category</Text>
                        </View>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              )}
            </ScrollView>
            
            {/* Sticky Buttons when creating */}
            {showCreateForm && (
              <View style={styles.stickyFooter}>
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
                    {isCreatingCategory ? 'Creating...' : 'Create Category'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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
    backgroundColor: COLORS.backgroundInput,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    minHeight: 56,
  },
  selectorError: {
    borderColor: COLORS.error,
  },
  selectorContent: {
    flex: 1,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  selectedCategoryText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  placeholder: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textTertiary,
  },
  placeholderDisabled: {
    color: COLORS.gray400,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.backgroundContent,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: BORDER_RADIUS.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
  },
  categoriesContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  categoryItemSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  categoryIconBgSelected: {
    backgroundColor: COLORS.primary,
  },
  categoryName: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  categoryNameSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  noResultsText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  noResultsSubtext: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },
  createCategoryForm: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  createCategoryTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  categoryNameInput: {
    backgroundColor: COLORS.backgroundInput,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    fontSize: TYPOGRAPHY.sizes.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    color: COLORS.textPrimary,
  },
  iconSelectorLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  iconSelector: {
    marginBottom: SPACING.xl,
  },
  iconOption: {
    width: 48,
    height: 48,
    marginRight: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: COLORS.backgroundInput,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  // New styles for redesigned create category form
  createHeader: {
    paddingBottom: SPACING.lg,
    marginBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  createSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputGroupLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  iconGridItem: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconGridItemSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  stickyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    ...SHADOWS.md,
  },
  createCategoryButtons: {

    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  cancelCreateButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
  },
  cancelCreateButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  createNewCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  createIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  createNewCategoryText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  customBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  customBadgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '600',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
});