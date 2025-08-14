import { supabase } from '@/services/supabaseClient';
import type { Category } from '@/types/models';
import type { CreateCategoryRequest, UpdateCategoryRequest, ApiResponse } from '@/types/api';
import { handleApiError, createApiResponse } from '@/services/apiClient';

export const categoriesApi = {
  async list(): Promise<ApiResponse<Category[]>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
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
      const { data, error } = await supabase
        .from('categories')
        .insert({
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
      const defaultCategories = [
        { name: 'Food', icon_name: 'restaurant' },
        { name: 'Transport', icon_name: 'car' },
        { name: 'Salary', icon_name: 'attach-money' },
        { name: 'Entertainment', icon_name: 'movie' },
        { name: 'Shopping', icon_name: 'shopping-bag' },
        { name: 'Bills', icon_name: 'receipt' },
        { name: 'Health', icon_name: 'local-hospital' },
        { name: 'Education', icon_name: 'school' },
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