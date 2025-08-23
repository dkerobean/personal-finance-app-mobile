import { supabase } from '@/services/supabaseClient';
import { mtnMomoService } from '@/services/api/mtnMomoService';
import { transactionCategorizer } from '@/services/transactionCategorizer';
import { 
  MoMoError, 
  ValidationError,
  handleMoMoApiError, 
  validateInput, 
  validators, 
  logError,
  ERROR_CODES
} from '@/lib/errorUtilsPolyfill';
import type { 
  MoMoTransaction, 
  MoMoAccountLink,
  MoMoTransactionStatusResponse
} from '@/types/mtnMomo';
import { MoMoTransactionStatus, TransactionType } from '@/types/mtnMomo';
import type { ApiResponse } from '@/types/api';
import { handleApiError, createApiResponse } from '@/services/apiClient';

interface SyncResult {
  totalTransactions: number;
  newTransactions: number;
  updatedTransactions: number;
  errors: string[];
}

interface MoMoAccountLinkRequest {
  phone_number: string;
  account_name: string;
}

class TransactionSyncService {
  
  // ============================================================================
  // MOMO ACCOUNT MANAGEMENT
  // ============================================================================

  async linkMoMoAccount(request: MoMoAccountLinkRequest): Promise<ApiResponse<MoMoAccountLink>> {
    try {
      // Validate inputs
      validateInput('phoneNumber', request.phone_number, validators.phoneNumber, 'Please enter a valid Ghana phone number');
      validateInput('accountName', request.account_name, validators.accountName, 'Account name must be between 2 and 50 characters');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new MoMoError(
          ERROR_CODES.AUTH_USER_NOT_FOUND,
          'User not authenticated',
          { authError },
          'linkMoMoAccount'
        );
      }

      // Check if account is already linked
      const { data: existingLink } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('phone_number', request.phone_number)
        .eq('platform_source', 'mtn_momo')
        .single();

      if (existingLink) {
        throw new MoMoError(
          ERROR_CODES.ACCOUNT_ALREADY_LINKED,
          'This MTN MoMo account is already linked to your profile',
          { phoneNumber: request.phone_number },
          'linkMoMoAccount'
        );
      }

      // Create new account link in unified accounts table
      const { data, error } = await supabase
        .from('accounts')
        .insert({
          user_id: user.id,
          phone_number: request.phone_number,
          account_name: request.account_name,
          account_type: 'mobile_money',
          platform_source: 'mtn_momo',
          mtn_reference_id: request.phone_number,
          is_active: true,
        })
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      return createApiResponse(data);
    } catch (error) {
      logError(error as Error, 'linkMoMoAccount');
      
      if (error instanceof ValidationError) {
        return createApiResponse({} as MoMoAccountLink, {
          code: ERROR_CODES.VALIDATION_INVALID_FORMAT,
          message: error.message,
        });
      }
      
      if (error instanceof MoMoError) {
        return createApiResponse({} as MoMoAccountLink, {
          code: error.code,
          message: error.message,
        });
      }
      
      const errorMessage = handleApiError(error);
      return createApiResponse({} as MoMoAccountLink, {
        code: 'LINK_ACCOUNT_ERROR',
        message: errorMessage,
      });
    }
  }

  async getMoMoAccounts(): Promise<ApiResponse<MoMoAccountLink[]>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new MoMoError(
          ERROR_CODES.AUTH_USER_NOT_FOUND,
          'User not authenticated',
          { authError },
          'getMoMoAccounts'
        );
      }

      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform_source', 'mtn_momo')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return createApiResponse(data || []);
    } catch (error) {
      logError(error as Error, 'getMoMoAccounts');
      
      if (error instanceof MoMoError) {
        return createApiResponse([] as MoMoAccountLink[], {
          code: error.code,
          message: error.message,
        });
      }
      
      const errorMessage = handleApiError(error);
      return createApiResponse([] as MoMoAccountLink[], {
        code: 'FETCH_ACCOUNTS_ERROR',
        message: errorMessage,
      });
    }
  }

  async deactivateMoMoAccount(accountId: string): Promise<ApiResponse<void>> {
    try {
      validateInput('accountId', accountId, (val) => val.trim().length > 0, 'Account ID is required');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new MoMoError(
          ERROR_CODES.AUTH_USER_NOT_FOUND,
          'User not authenticated',
          { authError },
          'deactivateMoMoAccount'
        );
      }

      // First check if account exists and belongs to user
      const { data: existingAccount } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .eq('user_id', user.id)
        .eq('platform_source', 'mtn_momo')
        .single();

      if (!existingAccount) {
        throw new MoMoError(
          ERROR_CODES.ACCOUNT_NOT_FOUND,
          'MTN MoMo account not found or does not belong to you',
          { accountId },
          'deactivateMoMoAccount'
        );
      }

      const { error } = await supabase
        .from('accounts')
        .update({ is_active: false })
        .eq('id', accountId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      return createApiResponse();
    } catch (error) {
      logError(error as Error, 'deactivateMoMoAccount');
      
      if (error instanceof ValidationError) {
        return createApiResponse(undefined, {
          code: ERROR_CODES.VALIDATION_REQUIRED_FIELD,
          message: error.message,
        });
      }
      
      if (error instanceof MoMoError) {
        return createApiResponse(undefined, {
          code: error.code,
          message: error.message,
        });
      }
      
      const errorMessage = handleApiError(error);
      return createApiResponse(undefined, {
        code: 'DEACTIVATE_ACCOUNT_ERROR',
        message: errorMessage,
      });
    }
  }

  // ============================================================================
  // TRANSACTION SYNCHRONIZATION
  // ============================================================================

  async syncTransactionsFromMoMo(): Promise<ApiResponse<SyncResult>> {
    let syncLogId: string | undefined;
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new MoMoError(
          ERROR_CODES.AUTH_USER_NOT_FOUND,
          'User not authenticated',
          { authError },
          'syncTransactionsFromMoMo'
        );
      }

      // Get active MoMo accounts
      const accountsResponse = await this.getMoMoAccounts();
      if (!accountsResponse.data || accountsResponse.error) {
        throw new MoMoError(
          ERROR_CODES.ACCOUNT_NOT_FOUND,
          'Failed to fetch MoMo accounts',
          { error: accountsResponse.error },
          'syncTransactionsFromMoMo'
        );
      }

      const activeAccounts = accountsResponse.data.filter(account => account.is_active);
      if (activeAccounts.length === 0) {
        throw new MoMoError(
          ERROR_CODES.ACCOUNT_NOT_FOUND,
          'No active MoMo accounts found. Please link an MTN MoMo account first.',
          { totalAccounts: accountsResponse.data.length },
          'syncTransactionsFromMoMo'
        );
      }

      let totalTransactions = 0;
      let newTransactions = 0;
      let updatedTransactions = 0;
      const errors: string[] = [];

      // Initialize MTN MoMo service for sandbox
      const initResponse = await mtnMomoService.initializeForSandbox();
      if (!initResponse.success) {
        throw new MoMoError(
          ERROR_CODES.MOMO_SERVICE_UNAVAILABLE,
          `Failed to initialize MTN MoMo service: ${initResponse.error?.message}`,
          { initResponse },
          'syncTransactionsFromMoMo'
        );
      }

      // Log sync start
      syncLogId = await this.createSyncLog(user.id, activeAccounts[0].id, 'manual');

      try {
        // For demo purposes, we'll simulate some transactions since we can't fetch historical transactions
        // In a real implementation, you would have access to transaction history APIs
        const mockTransactions = await this.generateMockTransactions();
        
        for (const momoTransaction of mockTransactions) {
          try {
            const result = await this.processMoMoTransaction(user.id, momoTransaction);
            totalTransactions++;
            
            if (result.isNew) {
              newTransactions++;
            } else {
              updatedTransactions++;
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Failed to process transaction ${momoTransaction.externalId}: ${errorMessage}`);
            logError(error as Error, `processMoMoTransaction-${momoTransaction.externalId}`);
          }
        }

        // Update sync log
        await this.updateSyncLog(syncLogId, 'success', totalTransactions);

        return createApiResponse({
          totalTransactions,
          newTransactions,
          updatedTransactions,
          errors,
        });

      } catch (error) {
        if (syncLogId) {
          await this.updateSyncLog(syncLogId, 'failed', 0, error instanceof Error ? error.message : 'Unknown error');
        }
        throw error;
      }

    } catch (error) {
      logError(error as Error, 'syncTransactionsFromMoMo');
      
      if (error instanceof MoMoError) {
        return createApiResponse({} as SyncResult, {
          code: error.code,
          message: error.message,
        });
      }
      
      const errorMessage = handleApiError(error);
      return createApiResponse({} as SyncResult, {
        code: ERROR_CODES.SYNC_FAILED,
        message: errorMessage,
      });
    }
  }

  private async processMoMoTransaction(
    userId: string, 
    momoTransaction: MoMoTransactionStatusResponse
  ): Promise<{ isNew: boolean; transaction: MoMoTransaction }> {
    try {
      // Validate inputs
      validateInput('userId', userId, (val) => val.trim().length > 0, 'User ID is required');
      validateInput('externalId', momoTransaction.externalId, (val) => val.trim().length > 0, 'Transaction external ID is required');
      validateInput('amount', momoTransaction.amount, validators.amount, 'Transaction amount is invalid');
      
      // Check if transaction already exists
      const { data: existingTransaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('momo_external_id', momoTransaction.externalId)
        .eq('user_id', userId)
        .single();

      // Extract merchant name and location
      const merchantName = transactionCategorizer.extractMerchantName(
        momoTransaction.payerMessage, 
        momoTransaction.payeeNote
      );

      // Categorize the transaction
      const amount = parseFloat(momoTransaction.amount);
      if (isNaN(amount)) {
        throw new ValidationError('amount', 'Invalid transaction amount', momoTransaction.amount);
      }
      
      const categorization = transactionCategorizer.categorizeTransaction(
        momoTransaction.payerMessage + ' ' + (momoTransaction.payeeNote || ''),
        amount,
        momoTransaction.payer,
        merchantName
      );

      // Get or create category
      const categoryId = await this.ensureCategoryExists(userId, categorization.category_id, categorization.suggested_type);

      const transactionData = {
        user_id: userId,
        amount: amount,
        type: categorization.suggested_type,
        category_id: categoryId,
        transaction_date: new Date().toISOString(), // In real implementation, use actual transaction date
        description: momoTransaction.payerMessage || `MTN MoMo transaction`,
        momo_transaction_id: momoTransaction.financialTransactionId || undefined,
        momo_external_id: momoTransaction.externalId,
        momo_reference_id: momoTransaction.externalId, // Using externalId as reference
        momo_status: momoTransaction.status,
        momo_payer_info: momoTransaction.payer,
        momo_financial_transaction_id: momoTransaction.financialTransactionId,
        merchant_name: merchantName,
        auto_categorized: true,
        categorization_confidence: categorization.confidence / 100,
      };

      if (existingTransaction) {
        // Update existing transaction
        const { data, error } = await supabase
          .from('transactions')
          .update({
            ...transactionData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingTransaction.id)
          .select('*')
          .single();

        if (error) {
          throw error;
        }

        return { isNew: false, transaction: data as MoMoTransaction };
      } else {
        // Create new transaction
        const { data, error } = await supabase
          .from('transactions')
          .insert(transactionData)
          .select('*')
          .single();

        if (error) {
          throw error;
        }

        return { isNew: true, transaction: data as MoMoTransaction };
      }
    } catch (error) {
      logError(error as Error, `processMoMoTransaction-${momoTransaction.externalId}`);
      
      if (error instanceof ValidationError) {
        throw new MoMoError(
          ERROR_CODES.VALIDATION_INVALID_FORMAT,
          `Transaction validation failed: ${error.message}`,
          { field: error.field, value: error.value, transactionId: momoTransaction.externalId },
          'processMoMoTransaction'
        );
      }
      
      throw error;
    }
  }

  private async ensureCategoryExists(userId: string, categoryId: string, type: TransactionType): Promise<string> {
    try {
      validateInput('userId', userId, (val) => val.trim().length > 0, 'User ID is required');
      validateInput('categoryId', categoryId, (val) => val.trim().length > 0, 'Category ID is required');
      
      // First, try to find existing category by name/type
      let { data: existingCategory } = await supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${userId},user_id.is.null`)
        .ilike('name', `%${categoryId.replace('_', ' ')}%`)
        .single();

      if (existingCategory) {
        return existingCategory.id;
      }

      // Create new category if it doesn't exist
      const categoryName = categoryId.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');

      const { data: newCategory, error } = await supabase
        .from('categories')
        .insert({
          user_id: userId,
          name: categoryName,
          icon_name: this.getCategoryIcon(categoryId),
        })
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      return newCategory.id;
    } catch (error) {
      logError(error as Error, `ensureCategoryExists-${categoryId}`);
      
      if (error instanceof ValidationError) {
        throw new MoMoError(
          ERROR_CODES.VALIDATION_INVALID_FORMAT,
          `Category validation failed: ${error.message}`,
          { field: error.field, value: error.value },
          'ensureCategoryExists'
        );
      }
      
      throw error;
    }
  }

  private getCategoryIcon(categoryId: string): string {
    const iconMap: Record<string, string> = {
      'food_dining': 'restaurant',
      'transportation': 'car',
      'utilities': 'lightbulb',
      'shopping': 'shopping-bag',
      'healthcare': 'heart',
      'education': 'book',
      'entertainment': 'play',
      'transfer_sent': 'send',
      'transfer_received': 'download',
      'salary': 'briefcase',
      'business_income': 'trending-up',
      'investment_income': 'pie-chart',
      'freelance': 'user',
      'subscription': 'repeat',
      'banking_fees': 'credit-card',
    };

    return iconMap[categoryId] || 'circle';
  }

  // ============================================================================
  // SYNC LOGGING
  // ============================================================================

  private async createSyncLog(userId: string, momoAccountId: string, syncType: string): Promise<string> {
    try {
      validateInput('userId', userId, (val) => val.trim().length > 0, 'User ID is required');
      validateInput('momoAccountId', momoAccountId, (val) => val.trim().length > 0, 'MoMo Account ID is required');
      validateInput('syncType', syncType, (val) => val.trim().length > 0, 'Sync type is required');
      
      const { data, error } = await supabase
        .from('transaction_sync_log')
        .insert({
          user_id: userId,
          momo_account_id: momoAccountId,
          sync_type: syncType,
          sync_status: 'in_progress', // Will be updated later
          transactions_synced: 0,
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      return data.id;
    } catch (error) {
      logError(error as Error, 'createSyncLog');
      
      if (error instanceof ValidationError) {
        throw new MoMoError(
          ERROR_CODES.VALIDATION_INVALID_FORMAT,
          `Sync log validation failed: ${error.message}`,
          { field: error.field, value: error.value },
          'createSyncLog'
        );
      }
      
      throw error;
    }
  }

  private async updateSyncLog(
    syncLogId: string, 
    status: string, 
    transactionCount: number, 
    errorMessage?: string
  ): Promise<void> {
    try {
      validateInput('syncLogId', syncLogId, (val) => val.trim().length > 0, 'Sync log ID is required');
      validateInput('status', status, (val) => val.trim().length > 0, 'Status is required');
      validateInput('transactionCount', transactionCount.toString(), (val) => !isNaN(Number(val)) && Number(val) >= 0, 'Transaction count must be a non-negative number');
      
      const updateData: any = {
        sync_status: status,
        transactions_synced: transactionCount,
        sync_completed_at: new Date().toISOString(),
      };

      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

      const { error } = await supabase
        .from('transaction_sync_log')
        .update(updateData)
        .eq('id', syncLogId);

      if (error) {
        throw error;
      }
    } catch (error) {
      logError(error as Error, `updateSyncLog-${syncLogId}`);
      // Don't throw here as this is a logging function - log and continue
    }
  }

  // ============================================================================
  // MOCK DATA GENERATION (For Demo Purposes)
  // ============================================================================

  private async generateMockTransactions(): Promise<MoMoTransactionStatusResponse[]> {
    // Generate some mock transactions for demonstration
    const mockTransactions: MoMoTransactionStatusResponse[] = [
      {
        amount: '25.50',
        currency: 'GHS',
        externalId: 'mock-ext-001',
        payer: { partyIdType: 'MSISDN', partyId: '233241234567' },
        payerMessage: 'Lunch at KFC Accra Mall',
        payeeNote: 'Food purchase',
        status: MoMoTransactionStatus.SUCCESSFUL,
        partyId: '233241234567',
        financialTransactionId: 'mock-fin-001'
      },
      {
        amount: '15.00',
        currency: 'GHS',
        externalId: 'mock-ext-002',
        payer: { partyIdType: 'MSISDN', partyId: '233241234567' },
        payerMessage: 'Uber ride to work',
        payeeNote: 'Transportation',
        status: MoMoTransactionStatus.SUCCESSFUL,
        partyId: '233241234567',
        financialTransactionId: 'mock-fin-002'
      },
      {
        amount: '100.00',
        currency: 'GHS',
        externalId: 'mock-ext-003',
        payer: { partyIdType: 'MSISDN', partyId: '233241234567' },
        payerMessage: 'ECG electricity bill payment',
        payeeNote: 'Utility bill',
        status: MoMoTransactionStatus.SUCCESSFUL,
        partyId: '233241234567',
        financialTransactionId: 'mock-fin-003'
      },
      {
        amount: '2000.00',
        currency: 'GHS',
        externalId: 'mock-ext-004',
        payer: { partyIdType: 'MSISDN', partyId: '233241234567' },
        payerMessage: 'Monthly salary deposit',
        payeeNote: 'Salary payment',
        status: MoMoTransactionStatus.SUCCESSFUL,
        partyId: '233241234567',
        financialTransactionId: 'mock-fin-004'
      },
      {
        amount: '50.00',
        currency: 'GHS',
        externalId: 'mock-ext-005',
        payer: { partyIdType: 'MSISDN', partyId: '233241234567' },
        payerMessage: 'Shopping at Shoprite',
        payeeNote: 'Grocery shopping',
        status: MoMoTransactionStatus.SUCCESSFUL,
        partyId: '233241234567',
        financialTransactionId: 'mock-fin-005'
      }
    ];

    return mockTransactions;
  }

  // ============================================================================
  // TRANSACTION QUERIES
  // ============================================================================

  async getMoMoTransactions(): Promise<ApiResponse<MoMoTransaction[]>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new MoMoError(
          ERROR_CODES.AUTH_USER_NOT_FOUND,
          'User not authenticated',
          { authError },
          'getMoMoTransactions'
        );
      }

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('user_id', user.id)
        .not('momo_external_id', 'is', null)
        .order('transaction_date', { ascending: false });

      if (error) {
        throw error;
      }

      return createApiResponse(data || []);
    } catch (error) {
      logError(error as Error, 'getMoMoTransactions');
      
      if (error instanceof MoMoError) {
        return createApiResponse([] as MoMoTransaction[], {
          code: error.code,
          message: error.message,
        });
      }
      
      const errorMessage = handleApiError(error);
      return createApiResponse([] as MoMoTransaction[], {
        code: 'FETCH_MOMO_TRANSACTIONS_ERROR',
        message: errorMessage,
      });
    }
  }

  async getSyncHistory(): Promise<ApiResponse<any[]>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new MoMoError(
          ERROR_CODES.AUTH_USER_NOT_FOUND,
          'User not authenticated',
          { authError },
          'getSyncHistory'
        );
      }

      const { data, error } = await supabase
        .from('transaction_sync_log')
        .select(`
          *,
          account:accounts(id, phone_number, account_name, platform_source)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        throw error;
      }

      return createApiResponse(data || []);
    } catch (error) {
      logError(error as Error, 'getSyncHistory');
      
      if (error instanceof MoMoError) {
        return createApiResponse([], {
          code: error.code,
          message: error.message,
        });
      }
      
      const errorMessage = handleApiError(error);
      return createApiResponse([], {
        code: 'FETCH_SYNC_HISTORY_ERROR',
        message: errorMessage,
      });
    }
  }
}

export const transactionSyncService = new TransactionSyncService();