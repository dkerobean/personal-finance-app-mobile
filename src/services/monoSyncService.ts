import { supabase } from '@/services/supabaseClient';
import { handleApiError, createApiResponse } from '@/services/apiClient';
import type { ApiResponse } from '@/types/api';

interface SyncRequest {
  accountId: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

interface SyncResult {
  totalTransactions: number;
  newTransactions: number;
  updatedTransactions: number;
  accountType: 'bank' | 'mobile_money';
  institutionName: string;
  errors: string[];
}

interface SyncResponse {
  success: boolean;
  data?: SyncResult;
  error?: {
    code: string;
    message: string;
  };
}

export type SyncStatus = 'idle' | 'fetching' | 'storing' | 'completed' | 'error';

export interface SyncProgress {
  status: SyncStatus;
  message: string;
  transactionCount?: number;
  accountType?: 'bank' | 'mobile_money';
  institutionName?: string;
  error?: string;
}

class MonoSyncService {
  private getEdgeFunctionUrl(): string {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }
    return `${supabaseUrl}/functions/v1/accounts-sync`;
  }

  /**
   * Sync a bank account via Mono API
   */
  async syncBankAccount(accountId: string, dateRange?: SyncRequest['dateRange']): Promise<ApiResponse<SyncResult>> {
    try {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        return {
          data: undefined,
          error: {
            code: 'AUTH_ERROR',
            message: 'Not authenticated. Please log in again.',
          },
        };
      }

      // Make request to sync endpoint
      const response = await fetch(this.getEdgeFunctionUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          accountId,
          dateRange,
        }),
      });

      const data: SyncResponse = await response.json();

      if (!response.ok || !data.success) {
        return {
          data: undefined,
          error: {
            code: data.error?.code || 'SYNC_ERROR',
            message: data.error?.message || 'Failed to sync bank account',
          },
        };
      }

      return {
        data: data.data!,
        error: undefined,
      };

    } catch (error) {
      console.error('MonoSyncService: Error syncing bank account:', error);
      return {
        data: undefined,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error occurred. Please check your connection and try again.',
        },
      };
    }
  }

  /**
   * Sync bank account with progress callback
   */
  async syncBankAccountWithProgress(
    accountId: string,
    onProgress: (progress: SyncProgress) => void,
    dateRange?: SyncRequest['dateRange']
  ): Promise<ApiResponse<SyncResult>> {
    try {
      // Start sync
      onProgress({
        status: 'fetching',
        message: 'Connecting to your bank via Mono...',
        accountType: 'bank',
      });

      // Add small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 1000));

      onProgress({
        status: 'fetching',
        message: 'Fetching bank account information...',
        accountType: 'bank',
      });

      // Perform actual sync
      const result = await this.syncBankAccount(accountId, dateRange);

      if (result.error) {
        onProgress({
          status: 'error',
          message: 'Failed to sync bank account',
          error: result.error.message,
          accountType: 'bank',
        });
        return result;
      }

      // Update progress with storing status
      onProgress({
        status: 'storing',
        message: 'Processing bank transactions...',
        accountType: 'bank',
        institutionName: result.data?.institutionName,
      });

      // Add small delay to show storing progress
      await new Promise(resolve => setTimeout(resolve, 500));

      // Complete
      onProgress({
        status: 'completed',
        message: `Successfully imported ${result.data?.totalTransactions || 0} bank transactions`,
        transactionCount: result.data?.totalTransactions || 0,
        accountType: 'bank',
        institutionName: result.data?.institutionName,
      });

      return result;

    } catch (error) {
      console.error('MonoSyncService: Error in progress sync:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      onProgress({
        status: 'error',
        message: 'Failed to sync bank account',
        error: errorMessage,
        accountType: 'bank',
      });

      return {
        data: undefined,
        error: {
          code: 'SYNC_ERROR',
          message: errorMessage,
        },
      };
    }
  }

  /**
   * Validate bank account can be synced
   */
  async validateBankAccount(accountId: string): Promise<ApiResponse<boolean>> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        return {
          data: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'Not authenticated',
          },
        };
      }

      // Get account information
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('account_type, mono_account_id, institution_name')
        .eq('id', accountId)
        .eq('account_type', 'bank')
        .eq('is_active', true)
        .single();

      if (accountError || !account) {
        return {
          data: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Bank account not found',
          },
        };
      }

      if (!account.mono_account_id) {
        return {
          data: false,
          error: {
            code: 'INVALID_ACCOUNT',
            message: 'Bank account is missing Mono integration',
          },
        };
      }

      return {
        data: true,
        error: undefined,
      };

    } catch (error) {
      return {
        data: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown validation error',
        },
      };
    }
  }

  /**
   * Get sync history for bank account
   */
  async getSyncHistory(accountId: string, limit: number = 10): Promise<ApiResponse<Array<{
    id: string;
    sync_status: string;
    transactions_synced: number;
    sync_completed_at: string;
    error_message?: string;
  }>>> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        return {
          data: [],
          error: {
            code: 'AUTH_ERROR',
            message: 'Not authenticated',
          },
        };
      }

      const { data, error } = await supabase
        .from('transaction_sync_log')
        .select('id, sync_status, transactions_synced, sync_completed_at, error_message')
        .eq('account_id', accountId)
        .eq('account_type', 'bank')
        .order('sync_completed_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return {
        data: data || [],
        error: undefined,
      };

    } catch (error) {
      return {
        data: [],
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch sync history',
        },
      };
    }
  }
}

// Export singleton instance
export const monoSyncService = new MonoSyncService();