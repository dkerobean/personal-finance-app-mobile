import { supabase } from '@/services/supabaseClient';
import { transactionCategorizer } from '@/services/transactionCategorizer';
import { alertProcessingService } from '@/services/alertProcessingService';
import type { Transaction, Category } from '@/types/models';
import type { CreateTransactionRequest, UpdateTransactionRequest, ApiResponse } from '@/types/api';
import { handleApiError, createApiResponse } from '@/services/apiClient';

const isSyncedTransaction = (transaction: any): boolean => {
  return !!(
    transaction.is_synced || 
    transaction.mono_transaction_id || 
    transaction.mtn_reference_id ||
    transaction.momo_external_id || 
    transaction.momo_transaction_id
  );
};

export { isSyncedTransaction };

export const transactionsApi = {
  async list(): Promise<ApiResponse<Transaction[]>> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(*),
          account:accounts(id, account_name, account_type, institution_name, mono_account_id, mtn_reference_id)
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
      // Get the current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id, // Explicitly set the user_id
          amount: request.amount,
          type: request.type,
          category_id: request.category_id,
          transaction_date: request.transaction_date,
          description: request.description,
        })
        .select(`
          *,
          category:categories(*),
          account:accounts(id, account_name, account_type, institution_name, mono_account_id, mtn_reference_id)
        `)
        .single();

      if (error) {
        throw error;
      }

      // Trigger alert processing for new expense transactions
      if (data && data.type === 'expense') {
        alertProcessingService.onTransactionCreated(data).catch(error => {
          console.error('Alert processing failed for new transaction:', error);
        });
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
      // First, get the existing transaction to check if it's synced
      const existingResponse = await this.getById(id);
      if (existingResponse.error || !existingResponse.data) {
        return createApiResponse({} as Transaction, {
          code: 'TRANSACTION_NOT_FOUND',
          message: 'Transaction not found',
        });
      }

      const existingTransaction = existingResponse.data;
      const isSync = isSyncedTransaction(existingTransaction);

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // For synced transactions, only allow category updates
      if (isSync) {
        if (request.category_id !== undefined) updateData.category_id = request.category_id;
        // Ignore other fields for synced transactions
      } else {
        // For manual transactions, allow all updates
        if (request.amount !== undefined) updateData.amount = request.amount;
        if (request.type !== undefined) updateData.type = request.type;
        if (request.category_id !== undefined) updateData.category_id = request.category_id;
        if (request.transaction_date !== undefined) updateData.transaction_date = request.transaction_date;
        if (request.description !== undefined) updateData.description = request.description;
      }

      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          category:categories(*),
          account:accounts(id, account_name, account_type, institution_name, mono_account_id, mtn_reference_id)
        `)
        .single();

      if (error) {
        throw error;
      }

      // Trigger alert processing for updated transactions that affect budgets
      if (data) {
        alertProcessingService.onTransactionUpdated(id, existingTransaction, data).catch(error => {
          console.error('Alert processing failed for updated transaction:', error);
        });
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
      // Get the transaction before deleting to trigger alerts
      const existingResponse = await this.getById(id);
      const existingTransaction = existingResponse.data;

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Trigger alert processing for deleted expense transactions
      if (existingTransaction) {
        alertProcessingService.onTransactionDeleted(existingTransaction).catch(error => {
          console.error('Alert processing failed for deleted transaction:', error);
        });
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
          category:categories(*),
          account:accounts(id, account_name, account_type, institution_name, mono_account_id, mtn_reference_id)
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

  async getCategorySuggestions(description: string, amount: number, merchantName?: string): Promise<ApiResponse<Category[]>> {
    try {
      // Use the transaction categorizer to get suggestions
      const categorization = transactionCategorizer.categorizeTransaction(
        description,
        amount,
        undefined,
        merchantName
      );

      // Get all categories for the user
      const { data: userCategories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .or('user_id.is.null,user_id.eq.' + (await supabase.auth.getUser()).data.user?.id)
        .order('name');

      if (categoriesError) {
        throw categoriesError;
      }

      // Find similar transactions for additional suggestions
      const { data: similarTransactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('category_id, categories(id, name, icon_name, user_id, created_at, updated_at)')
        .ilike('description', `%${description.split(' ')[0]}%`)
        .limit(5);

      if (transactionsError) {
        throw transactionsError;
      }

      // Combine categorization result with user's past categorizations
      const suggestions = new Map<string, Category>();
      
      // Add the AI suggestion first (highest priority)
      const primaryCategory = userCategories?.find(cat => 
        cat.name.toLowerCase().includes(categorization.category_id.toLowerCase().replace('_', ' '))
      );
      if (primaryCategory) {
        suggestions.set(primaryCategory.id, primaryCategory);
      }

      // Add categories from similar transactions
      similarTransactions?.forEach(tx => {
        if (tx.categories) {
          const category = Array.isArray(tx.categories) ? tx.categories[0] : tx.categories;
          if (category && !suggestions.has(category.id)) {
            suggestions.set(category.id, category as Category);
          }
        }
      });

      // Add fallback "Uncategorized" category
      const uncategorizedCategory = userCategories?.find(cat => 
        cat.name.toLowerCase() === 'uncategorized' && cat.user_id === null
      );
      if (uncategorizedCategory && !suggestions.has(uncategorizedCategory.id)) {
        suggestions.set(uncategorizedCategory.id, uncategorizedCategory);
      }

      return createApiResponse(Array.from(suggestions.values()).slice(0, 5));
    } catch (error) {
      const errorMessage = handleApiError(error);
      return createApiResponse([] as Category[], {
        code: 'FETCH_SUGGESTIONS_ERROR',
        message: errorMessage,
      });
    }
  },

  async provideCategoryFeedback(
    transactionId: string, 
    originalCategoryId: string, 
    newCategoryId: string,
    confidence: number
  ): Promise<ApiResponse<void>> {
    try {
      // This could store feedback for improving categorization accuracy
      // For now, we'll just update the transaction and mark it as manually categorized
      const { error } = await supabase
        .from('transactions')
        .update({
          category_id: newCategoryId,
          auto_categorized: false, // Mark as manually corrected
          categorization_confidence: null, // Clear auto confidence
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId);

      if (error) {
        throw error;
      }

      // In a more advanced implementation, this would:
      // 1. Store the feedback in a categorization_feedback table
      // 2. Use this data to improve future categorization rules
      // 3. Train ML models with user corrections

      return createApiResponse();
    } catch (error) {
      const errorMessage = handleApiError(error);
      return createApiResponse(undefined, {
        code: 'FEEDBACK_ERROR',
        message: errorMessage,
      });
    }
  },

  async bulkRecategorize(
    transactionIds: string[],
    newCategoryId: string
  ): Promise<ApiResponse<{ updated: number; errors: string[] }>> {
    try {
      let updated = 0;
      const errors: string[] = [];

      for (const transactionId of transactionIds) {
        try {
          const { error } = await supabase
            .from('transactions')
            .update({
              category_id: newCategoryId,
              auto_categorized: false, // Mark as manually categorized
              categorization_confidence: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', transactionId);

          if (error) {
            throw error;
          }
          updated++;
        } catch (error) {
          errors.push(`Transaction ${transactionId}: ${handleApiError(error)}`);
        }
      }

      // Trigger alert processing for bulk categorization changes
      if (updated > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          alertProcessingService.onBulkTransactionChanges(user.id, [newCategoryId]).catch(error => {
            console.error('Alert processing failed for bulk recategorization:', error);
          });
        }
      }

      return createApiResponse({ updated, errors });
    } catch (error) {
      const errorMessage = handleApiError(error);
      return createApiResponse({ updated: 0, errors: [errorMessage] }, {
        code: 'BULK_RECATEGORIZE_ERROR',
        message: errorMessage,
      });
    }
  },
};