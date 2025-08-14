import { supabase } from '@/services/supabaseClient';
import type { Transaction } from '@/types/models';
import type { CreateTransactionRequest, UpdateTransactionRequest, ApiResponse } from '@/types/api';
import { handleApiError, createApiResponse } from '@/services/apiClient';

export const transactionsApi = {
  async list(): Promise<ApiResponse<Transaction[]>> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(*)
        `)
        .order('transaction_date', { ascending: false });

      if (error) {
        throw error;
      }

      return createApiResponse(data || []);
    } catch (error) {
      const errorMessage = handleApiError(error);
      return createApiResponse([] as Transaction[], {
        code: 'FETCH_TRANSACTIONS_ERROR',
        message: errorMessage,
      });
    }
  },

  async create(request: CreateTransactionRequest): Promise<ApiResponse<Transaction>> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          amount: request.amount,
          type: request.type,
          category_id: request.category_id,
          transaction_date: request.transaction_date,
          description: request.description,
        })
        .select(`
          *,
          category:categories(*)
        `)
        .single();

      if (error) {
        throw error;
      }

      return createApiResponse(data);
    } catch (error) {
      const errorMessage = handleApiError(error);
      return createApiResponse({} as Transaction, {
        code: 'CREATE_TRANSACTION_ERROR',
        message: errorMessage,
      });
    }
  },

  async update(id: string, request: UpdateTransactionRequest): Promise<ApiResponse<Transaction>> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (request.amount !== undefined) updateData.amount = request.amount;
      if (request.type !== undefined) updateData.type = request.type;
      if (request.category_id !== undefined) updateData.category_id = request.category_id;
      if (request.transaction_date !== undefined) updateData.transaction_date = request.transaction_date;
      if (request.description !== undefined) updateData.description = request.description;

      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          category:categories(*)
        `)
        .single();

      if (error) {
        throw error;
      }

      return createApiResponse(data);
    } catch (error) {
      const errorMessage = handleApiError(error);
      return createApiResponse({} as Transaction, {
        code: 'UPDATE_TRANSACTION_ERROR',
        message: errorMessage,
      });
    }
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return createApiResponse();
    } catch (error) {
      const errorMessage = handleApiError(error);
      return createApiResponse(undefined, {
        code: 'DELETE_TRANSACTION_ERROR',
        message: errorMessage,
      });
    }
  },

  async getById(id: string): Promise<ApiResponse<Transaction>> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return createApiResponse(data);
    } catch (error) {
      const errorMessage = handleApiError(error);
      return createApiResponse({} as Transaction, {
        code: 'FETCH_TRANSACTION_ERROR',
        message: errorMessage,
      });
    }
  },
};