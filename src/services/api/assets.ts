import { supabase } from '@/services/supabaseClient';
import type { Asset, CreateAssetRequest, UpdateAssetRequest, AssetCategory } from '@/types/models';
import type { ApiResponse } from '@/types/api';
import { handleApiError, createApiResponse } from '@/services/apiClient';

export const assetsApi = {
  async list(): Promise<ApiResponse<Asset[]>> {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return createApiResponse(data || []);
    } catch (error) {
      const errorMessage = handleApiError(error);
      return createApiResponse([] as Asset[], {
        code: 'FETCH_ASSETS_ERROR',
        message: errorMessage,
      });
    }
  },

  async getById(id: string): Promise<ApiResponse<Asset | null>> {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return createApiResponse(null, {
            code: 'ASSET_NOT_FOUND',
            message: 'Asset not found',
          });
        }
        throw error;
      }

      return createApiResponse(data);
    } catch (error) {
      const errorMessage = handleApiError(error);
      return createApiResponse(null, {
        code: 'FETCH_ASSET_ERROR',
        message: errorMessage,
      });
    }
  },

  async getByCategory(category: AssetCategory): Promise<ApiResponse<Asset[]>> {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return createApiResponse(data || []);
    } catch (error) {
      const errorMessage = handleApiError(error);
      return createApiResponse([] as Asset[], {
        code: 'FETCH_ASSETS_BY_CATEGORY_ERROR',
        message: errorMessage,
      });
    }
  },

  async create(request: CreateAssetRequest): Promise<ApiResponse<Asset>> {
    try {
      // Get the current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return createApiResponse(null as any, {
          code: 'AUTH_ERROR',
          message: 'Authentication required',
        });
      }

      // Validate required fields
      if (!request.name?.trim()) {
        return createApiResponse(null as any, {
          code: 'VALIDATION_ERROR',
          message: 'Asset name is required',
        });
      }

      if (!request.current_value || request.current_value <= 0) {
        return createApiResponse(null as any, {
          code: 'VALIDATION_ERROR',
          message: 'Current value must be greater than 0',
        });
      }

      if (!request.category || !request.asset_type) {
        return createApiResponse(null as any, {
          code: 'VALIDATION_ERROR',
          message: 'Category and asset type are required',
        });
      }

      const assetData = {
        user_id: user.id,
        name: request.name.trim(),
        category: request.category,
        asset_type: request.asset_type,
        current_value: request.current_value,
        original_value: request.original_value || null,
        purchase_date: request.purchase_date || null,
        description: request.description?.trim() || null,
        is_active: true,
      };

      const { data, error } = await supabase
        .from('assets')
        .insert([assetData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return createApiResponse(data);
    } catch (error) {
      const errorMessage = handleApiError(error);
      return createApiResponse(null as any, {
        code: 'CREATE_ASSET_ERROR',
        message: errorMessage,
      });
    }
  },

  async update(id: string, request: UpdateAssetRequest): Promise<ApiResponse<Asset>> {
    try {
      // Get the current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return createApiResponse(null as any, {
          code: 'AUTH_ERROR',
          message: 'Authentication required',
        });
      }

      // Build update object with only provided fields
      const updateData: any = {};
      
      if (request.name !== undefined) {
        if (!request.name.trim()) {
          return createApiResponse(null as any, {
            code: 'VALIDATION_ERROR',
            message: 'Asset name cannot be empty',
          });
        }
        updateData.name = request.name.trim();
      }

      if (request.current_value !== undefined) {
        if (request.current_value <= 0) {
          return createApiResponse(null as any, {
            code: 'VALIDATION_ERROR',
            message: 'Current value must be greater than 0',
          });
        }
        updateData.current_value = request.current_value;
      }

      if (request.category !== undefined) {
        updateData.category = request.category;
      }

      if (request.asset_type !== undefined) {
        updateData.asset_type = request.asset_type;
      }

      if (request.original_value !== undefined) {
        updateData.original_value = request.original_value;
      }

      if (request.purchase_date !== undefined) {
        updateData.purchase_date = request.purchase_date;
      }

      if (request.description !== undefined) {
        updateData.description = request.description?.trim() || null;
      }

      // Add updated timestamp
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('assets')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return createApiResponse(null as any, {
            code: 'ASSET_NOT_FOUND',
            message: 'Asset not found or you do not have permission to update it',
          });
        }
        throw error;
      }

      return createApiResponse(data);
    } catch (error) {
      const errorMessage = handleApiError(error);
      return createApiResponse(null as any, {
        code: 'UPDATE_ASSET_ERROR',
        message: errorMessage,
      });
    }
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      // Get the current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return createApiResponse(undefined, {
          code: 'AUTH_ERROR',
          message: 'Authentication required',
        });
      }

      // Soft delete by setting is_active to false
      const { data, error } = await supabase
        .from('assets')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return createApiResponse(undefined, {
            code: 'ASSET_NOT_FOUND',
            message: 'Asset not found or you do not have permission to delete it',
          });
        }
        throw error;
      }

      return createApiResponse(undefined);
    } catch (error) {
      const errorMessage = handleApiError(error);
      return createApiResponse(undefined, {
        code: 'DELETE_ASSET_ERROR',
        message: errorMessage,
      });
    }
  },

  async getTotalValue(): Promise<ApiResponse<{ totalValue: number; assetCount: number }>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return createApiResponse({ totalValue: 0, assetCount: 0 }, {
          code: 'AUTH_ERROR',
          message: 'Authentication required',
        });
      }

      const { data, error } = await supabase
        .from('assets')
        .select('current_value')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      const totalValue = (data || []).reduce((sum, asset) => sum + (asset.current_value || 0), 0);
      const assetCount = (data || []).length;

      return createApiResponse({ totalValue, assetCount });
    } catch (error) {
      const errorMessage = handleApiError(error);
      return createApiResponse({ totalValue: 0, assetCount: 0 }, {
        code: 'FETCH_TOTAL_VALUE_ERROR',
        message: errorMessage,
      });
    }
  },

  async getCategoryBreakdown(): Promise<ApiResponse<{ category: AssetCategory; total: number; count: number }[]>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return createApiResponse([], {
          code: 'AUTH_ERROR',
          message: 'Authentication required',
        });
      }

      const { data, error } = await supabase
        .from('assets')
        .select('category, current_value')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      // Group by category and calculate totals
      const breakdown = (data || []).reduce((acc, asset) => {
        const category = asset.category as AssetCategory;
        if (!acc[category]) {
          acc[category] = { total: 0, count: 0 };
        }
        acc[category].total += asset.current_value || 0;
        acc[category].count += 1;
        return acc;
      }, {} as Record<AssetCategory, { total: number; count: number }>);

      const result = Object.entries(breakdown).map(([category, data]) => ({
        category: category as AssetCategory,
        ...data,
      }));

      return createApiResponse(result);
    } catch (error) {
      const errorMessage = handleApiError(error);
      return createApiResponse([], {
        code: 'FETCH_CATEGORY_BREAKDOWN_ERROR',
        message: errorMessage,
      });
    }
  },
};