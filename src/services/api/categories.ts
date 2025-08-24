import { supabase } from '@/services/supabaseClient';
import type { Category } from '@/types/models';
import type { CreateCategoryRequest, UpdateCategoryRequest, ApiResponse } from '@/types/api';
import { handleApiError, createApiResponse } from '@/services/apiClient';

export const categoriesApi = {
  async list(): Promise<ApiResponse<Category[]>> {
    try {
      // Get the current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        // If not authenticated, only return shared categories
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .is('user_id', null)
          .order('name');

        if (error) {
          throw error;
        }

        return createApiResponse(data || []);
      }

      // Get both user-specific and shared categories
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('user_id', { ascending: false }) // User categories first
        .order('name');

      if (error) {
        throw error;
      }

      return createApiResponse(data || []);
    } catch (error) {
      const errorMessage = handleApiError(error);
      return createApiResponse([] as Category[], {
        code: 'FETCH_CATEGORIES_ERROR',
        message: errorMessage,
      });
    }
  },

  async create(request: CreateCategoryRequest): Promise<ApiResponse<Category>> {
    try {
      // Get the current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id, // Explicitly set the user_id
          name: request.name,
          icon_name: request.icon_name,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return createApiResponse(data);
    } catch (error) {
      const errorMessage = handleApiError(error);
      return createApiResponse({} as Category, {
        code: 'CREATE_CATEGORY_ERROR',
        message: errorMessage,
      });
    }
  },

  async update(id: string, request: UpdateCategoryRequest): Promise<ApiResponse<Category>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update({
          ...(request.name && { name: request.name }),
          ...(request.icon_name && { icon_name: request.icon_name }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return createApiResponse(data);
    } catch (error) {
      const errorMessage = handleApiError(error);
      return createApiResponse({} as Category, {
        code: 'UPDATE_CATEGORY_ERROR',
        message: errorMessage,
      });
    }
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return createApiResponse();
    } catch (error) {
      const errorMessage = handleApiError(error);
      return createApiResponse(undefined, {
        code: 'DELETE_CATEGORY_ERROR',
        message: errorMessage,
      });
    }
  },

  async seedDefaults(): Promise<ApiResponse<Category[]>> {
    try {
      // Get the current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const defaultCategories = [
        { user_id: user.id, name: 'Food', icon_name: 'restaurant' },
        { user_id: user.id, name: 'Transport', icon_name: 'car' },
        { user_id: user.id, name: 'Salary', icon_name: 'attach-money' },
        { user_id: user.id, name: 'Entertainment', icon_name: 'movie' },
        { user_id: user.id, name: 'Shopping', icon_name: 'shopping-bag' },
        { user_id: user.id, name: 'Bills', icon_name: 'receipt' },
        { user_id: user.id, name: 'Health', icon_name: 'local-hospital' },
        { user_id: user.id, name: 'Education', icon_name: 'school' },
      ];

      const { data, error } = await supabase
        .from('categories')
        .insert(defaultCategories)
        .select();

      if (error) {
        throw error;
      }

      return createApiResponse(data || []);
    } catch (error) {
      const errorMessage = handleApiError(error);
      return createApiResponse([] as Category[], {
        code: 'SEED_CATEGORIES_ERROR',
        message: errorMessage,
      });
    }
  },
};