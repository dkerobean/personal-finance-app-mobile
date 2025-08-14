import { create } from 'zustand';
import type { CategoryState, CategoryActions } from '@/types/store';
import { categoriesApi } from '@/services/api/categories';

interface CategoryStore extends CategoryState, CategoryActions {}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,
  initialized: false,

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  loadCategories: async () => {
    const { setLoading, setError, seedDefaults } = get();
    
    setLoading(true);
    setError(null);

    try {
      const response = await categoriesApi.list();
      
      if (response.error) {
        setError(response.error.message);
        return;
      }

      const categories = response.data || [];
      
      // If no categories exist and not initialized, seed defaults
      if (categories.length === 0 && !get().initialized) {
        await seedDefaults();
        return; // seedDefaults will reload categories
      }

      set({ 
        categories, 
        initialized: true 
      });
    } catch (error) {
      setError('Failed to load categories');
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  },

  createCategory: async (name, iconName) => {
    const { setLoading, setError, loadCategories } = get();
    
    setLoading(true);
    setError(null);

    try {
      const response = await categoriesApi.create({
        name,
        icon_name: iconName,
      });
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }

      // Reload categories to get the updated list
      await loadCategories();
      return true;
    } catch (error) {
      setError('Failed to create category');
      console.error('Error creating category:', error);
      return false;
    } finally {
      setLoading(false);
    }
  },

  updateCategory: async (id, name, iconName) => {
    const { setLoading, setError, loadCategories } = get();
    
    setLoading(true);
    setError(null);

    try {
      const updateData: { name?: string; icon_name?: string } = {};
      if (name) updateData.name = name;
      if (iconName) updateData.icon_name = iconName;

      const response = await categoriesApi.update(id, updateData);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }

      // Reload categories to get the updated list
      await loadCategories();
      return true;
    } catch (error) {
      setError('Failed to update category');
      console.error('Error updating category:', error);
      return false;
    } finally {
      setLoading(false);
    }
  },

  deleteCategory: async (id) => {
    const { setLoading, setError, loadCategories } = get();
    
    setLoading(true);
    setError(null);

    try {
      const response = await categoriesApi.delete(id);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }

      // Reload categories to get the updated list
      await loadCategories();
      return true;
    } catch (error) {
      setError('Failed to delete category');
      console.error('Error deleting category:', error);
      return false;
    } finally {
      setLoading(false);
    }
  },

  seedDefaults: async () => {
    const { setLoading, setError, loadCategories } = get();
    
    setLoading(true);
    setError(null);

    try {
      const response = await categoriesApi.seedDefaults();
      
      if (response.error) {
        setError(response.error.message);
        return;
      }

      // Reload categories to get the seeded categories
      await loadCategories();
    } catch (error) {
      setError('Failed to seed default categories');
      console.error('Error seeding default categories:', error);
    } finally {
      setLoading(false);
    }
  },
}));