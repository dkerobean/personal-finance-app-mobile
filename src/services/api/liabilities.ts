import { supabase } from '@/services/supabaseClient';
import type { Liability, CreateLiabilityRequest, UpdateLiabilityRequest, LiabilityCategory } from '@/types/models';
import type { ApiResponse } from '@/types/api';
import { handleApiError, createApiResponse } from '@/services/apiClient';

export const liabilitiesApi = {
  async list(): Promise<ApiResponse<Liability[]>> {
    try {
      const { data, error } = await supabase
        .from('liabilities')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return createApiResponse(data || []);
    } catch (error) {
      const errorMessage = handleApiError(error);
      return createApiResponse([] as Liability[], {
        code: 'FETCH_LIABILITIES_ERROR',
        message: errorMessage,
      });
    }
  },

  async getById(id: string): Promise<ApiResponse<Liability | null>> {
    try {
      const { data, error } = await supabase
        .from('liabilities')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return createApiResponse(null, {
            code: 'LIABILITY_NOT_FOUND',
            message: 'Liability not found',
          });
        }
        throw error;
      }

      return createApiResponse(data);
    } catch (error) {
      const errorMessage = handleApiError(error);
      return createApiResponse(null, {
        code: 'FETCH_LIABILITY_ERROR',
        message: errorMessage,
      });
    }
  },

  async getByCategory(category: LiabilityCategory): Promise<ApiResponse<Liability[]>> {
    try {
      const { data, error } = await supabase
        .from('liabilities')
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
      return createApiResponse([] as Liability[], {
        code: 'FETCH_LIABILITIES_BY_CATEGORY_ERROR',
        message: errorMessage,
      });
    }
  },

  async create(request: CreateLiabilityRequest): Promise<ApiResponse<Liability>> {
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
          message: 'Liability name is required',
        });
      }

      if (!request.current_balance || request.current_balance <= 0) {
        return createApiResponse(null as any, {
          code: 'VALIDATION_ERROR',
          message: 'Current balance must be greater than 0',
        });
      }

      if (!request.category || !request.liability_type) {
        return createApiResponse(null as any, {
          code: 'VALIDATION_ERROR',
          message: 'Category and liability type are required',
        });
      }

      // Validate interest rate if provided
      if (request.interest_rate !== undefined && request.interest_rate < 0) {
        return createApiResponse(null as any, {
          code: 'VALIDATION_ERROR',
          message: 'Interest rate cannot be negative',
        });
      }

      // Validate monthly payment if provided
      if (request.monthly_payment !== undefined && request.monthly_payment < 0) {
        return createApiResponse(null as any, {
          code: 'VALIDATION_ERROR',
          message: 'Monthly payment cannot be negative',
        });
      }

      const liabilityData = {
        user_id: user.id,
        name: request.name.trim(),
        category: request.category,
        liability_type: request.liability_type,
        current_balance: request.current_balance,
        original_balance: request.original_balance || null,
        interest_rate: request.interest_rate || null,
        monthly_payment: request.monthly_payment || null,
        due_date: request.due_date || null,
        description: request.description?.trim() || null,
        is_active: true,
      };

      const { data, error } = await supabase
        .from('liabilities')
        .insert([liabilityData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return createApiResponse(data);
    } catch (error) {
      const errorMessage = handleApiError(error);
      return createApiResponse(null as any, {
        code: 'CREATE_LIABILITY_ERROR',
        message: errorMessage,
      });
    }
  },

  async update(id: string, request: UpdateLiabilityRequest): Promise<ApiResponse<Liability>> {
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
            message: 'Liability name cannot be empty',
          });
        }
        updateData.name = request.name.trim();
      }

      if (request.current_balance !== undefined) {
        if (request.current_balance <= 0) {
          return createApiResponse(null as any, {
            code: 'VALIDATION_ERROR',
            message: 'Current balance must be greater than 0',
          });
        }
        updateData.current_balance = request.current_balance;
      }

      if (request.category !== undefined) {
        updateData.category = request.category;
      }

      if (request.liability_type !== undefined) {
        updateData.liability_type = request.liability_type;
      }

      if (request.original_balance !== undefined) {
        updateData.original_balance = request.original_balance;
      }

      if (request.interest_rate !== undefined) {
        if (request.interest_rate < 0) {
          return createApiResponse(null as any, {
            code: 'VALIDATION_ERROR',
            message: 'Interest rate cannot be negative',
          });
        }
        updateData.interest_rate = request.interest_rate;
      }

      if (request.monthly_payment !== undefined) {
        if (request.monthly_payment < 0) {
          return createApiResponse(null as any, {
            code: 'VALIDATION_ERROR',
            message: 'Monthly payment cannot be negative',
          });
        }
        updateData.monthly_payment = request.monthly_payment;
      }

      if (request.due_date !== undefined) {
        updateData.due_date = request.due_date;
      }

      if (request.description !== undefined) {
        updateData.description = request.description?.trim() || null;
      }

      if (request.is_active !== undefined) {
        updateData.is_active = request.is_active;
      }

      // Add updated timestamp
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('liabilities')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return createApiResponse(null as any, {
            code: 'LIABILITY_NOT_FOUND',
            message: 'Liability not found or you do not have permission to update it',
          });
        }
        throw error;
      }

      return createApiResponse(data);
    } catch (error) {
      const errorMessage = handleApiError(error);
      return createApiResponse(null as any, {
        code: 'UPDATE_LIABILITY_ERROR',
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
        .from('liabilities')
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
            code: 'LIABILITY_NOT_FOUND',
            message: 'Liability not found or you do not have permission to delete it',
          });
        }
        throw error;
      }

      return createApiResponse(undefined);
    } catch (error) {
      const errorMessage = handleApiError(error);
      return createApiResponse(undefined, {
        code: 'DELETE_LIABILITY_ERROR',
        message: errorMessage,
      });
    }
  },

  async getTotalBalance(): Promise<ApiResponse<{ totalBalance: number; liabilityCount: number }>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return createApiResponse({ totalBalance: 0, liabilityCount: 0 }, {
          code: 'AUTH_ERROR',
          message: 'Authentication required',
        });
      }

      const { data, error } = await supabase
        .from('liabilities')
        .select('current_balance')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      const totalBalance = (data || []).reduce((sum, liability) => sum + (liability.current_balance || 0), 0);
      const liabilityCount = (data || []).length;

      return createApiResponse({ totalBalance, liabilityCount });
    } catch (error) {
      const errorMessage = handleApiError(error);
      return createApiResponse({ totalBalance: 0, liabilityCount: 0 }, {
        code: 'FETCH_TOTAL_BALANCE_ERROR',
        message: errorMessage,
      });
    }
  },

  async getCategoryBreakdown(): Promise<ApiResponse<{ category: LiabilityCategory; total: number; count: number }[]>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return createApiResponse([], {
          code: 'AUTH_ERROR',
          message: 'Authentication required',
        });
      }

      const { data, error } = await supabase
        .from('liabilities')
        .select('category, current_balance')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      // Group by category and calculate totals
      const breakdown = (data || []).reduce((acc, liability) => {
        const category = liability.category as LiabilityCategory;
        if (!acc[category]) {
          acc[category] = { total: 0, count: 0 };
        }
        acc[category].total += liability.current_balance || 0;
        acc[category].count += 1;
        return acc;
      }, {} as Record<LiabilityCategory, { total: number; count: number }>);

      const result = Object.entries(breakdown).map(([category, data]) => ({
        category: category as LiabilityCategory,
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