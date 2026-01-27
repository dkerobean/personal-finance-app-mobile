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

  loadCategories: async (userId: string) => {
    const { setLoading, setError } = get();
    
    setLoading(true);
    setError(null);

    try {
      console.log('CategoryStore: Loading categories for user:', userId);
      const response = await categoriesApi.list(userId);
      
      if (response.error) {
        console.error('CategoryStore: Failed to load categories:', response.error);
        setError(response.error.message);
        return;
      }

      const categories = response.data || [];
      console.log('CategoryStore: Loaded categories:', categories.length);
      
      set({ 
        categories, 
        initialized: true 
      });
    } catch (error) {
      console.error('CategoryStore: Error loading categories:', error);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  },

  createCategory: async (userId: string, name: string, iconName: string) => {
    const { setLoading, setError, loadCategories } = get();
    
    setLoading(true);
    setError(null);

    try {
      const response = await categoriesApi.create(userId, {
        name,
        icon_name: iconName,
      });
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }

      await loadCategories(userId);
      return true;
    } catch (error) {
      setError('Failed to create category');
      console.error('Error creating category:', error);
      return false;
    } finally {
      setLoading(false);
    }
  },

  updateCategory: async (userId: string, id: string, name?: string, iconName?: string) => {
    const { setLoading, setError, loadCategories } = get();
    
    setLoading(true);
    setError(null);

    try {
      const updateData: { name?: string; icon_name?: string } = {};
      if (name) updateData.name = name;
      if (iconName) updateData.icon_name = iconName;

      const response = await categoriesApi.update(userId, id, updateData);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }

      await loadCategories(userId);
      return true;
    } catch (error) {
      setError('Failed to update category');
      console.error('Error updating category:', error);
      return false;
    } finally {
      setLoading(false);
    }
  },

  deleteCategory: async (userId: string, id: string) => {
    const { setLoading, setError, loadCategories } = get();
    
    setLoading(true);
    setError(null);

    try {
      const response = await categoriesApi.delete(userId, id);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }

      await loadCategories(userId);
      return true;
    } catch (error) {
      setError('Failed to delete category');
      console.error('Error deleting category:', error);
      return false;
    } finally {
      setLoading(false);
    }
  },

  seedDefaults: async (userId: string) => {
    const { setLoading, setError, loadCategories } = get();
    
    setLoading(true);
    setError(null);

    try {
      console.log('CategoryStore: Seeding default categories for user:', userId);
      // Ensure the API method exists and accepts userId if needed. 
      // Assuming categoriesApi.list with seeding logic is triggered by just listing with the flag or similar.
      // Wait, in previous turns I relied on GET /categories?userId=... triggering the seed.
      // So effectively loadCategories(userId) triggers the seed if empty.
      // But if we have an explicit seed endpoint, use that.
      // Based on my review of api/src/routes/categories.js, GET / triggers seed.
      // So we just need to call loadCategories(userId).
      // However, the `categoriesApi` might not have `seedDefaults`.
      // Let's check `src/services/api/categories.ts`.
      // It DOES NOT have seedDefaults.
      // I will remove seedDefaults from the store or just make it call loadCategories.
      
      await loadCategories(userId);
      
    } catch (error) {
      console.error('CategoryStore: Error seeding default categories:', error);
      setError('Failed to seed default categories');
    } finally {
      setLoading(false);
    }
  },
}));