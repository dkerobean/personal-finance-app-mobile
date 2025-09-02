import { supabase } from '@/services/supabaseClient';
import { handleApiError, createApiResponse } from '@/services/apiClient';
import type { ApiResponse } from '@/types/api';

export type SyncStatus = 'idle' | 'fetching' | 'storing' | 'completed' | 'error';

export interface SyncProgress {
  status: SyncStatus;
  message: string;
  transactionCount?: number;
  accountType?: 'bank' | 'mobile_money';
  institutionName?: string;
  error?: string;
}

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

class MTNSyncService {
  private getEdgeFunctionUrl(): string {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }
    return `${supabaseUrl}/functions/v1/accounts-sync`;
  }

  async syncAccount(accountId: string, dateRange?: SyncRequest['dateRange']): Promise<ApiResponse<SyncResult>> {
    try {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        return {
          data: null,
          error: {
            code: 'AUTH_ERROR',
            message: 'Not authenticated. Please log in again.',
          },
        };
      }

      const requestBody: SyncRequest = {
        accountId,
        dateRange,
      };

      const response = await fetch(this.getEdgeFunctionUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const responseData: SyncResponse = await response.json();

      if (!response.ok || !responseData.success) {
        return {
          data: null,
          error: {
            code: responseData.error?.code || 'SYNC_ERROR',
            message: responseData.error?.message || 'Failed to sync transactions',
          },
        };
      }

      return createApiResponse(responseData.data || {
        totalTransactions: 0,
        newTransactions: 0,
        updatedTransactions: 0,
        accountType: 'mobile_money' as const,
        institutionName: 'MTN Mobile Money',
        errors: [],
      });

    } catch (error) {
      console.error('MTN sync service error:', error);
      return {
        data: null,
        error: {
          code: 'SYNC_ERROR',
          message: handleApiError(error),
        },
      };
    }
  }

  async syncAccountWithProgress(
    accountId: string,
    onProgress?: (progress: SyncProgress) => void,
    dateRange?: SyncRequest['dateRange']
  ): Promise<ApiResponse<SyncResult>> {
    try {
      // Notify start of fetching
      onProgress?.({
        status: 'fetching',
        message: 'Fetching MTN MoMo transactions...',
        accountType: 'mobile_money',
        institutionName: 'MTN Mobile Money',
      });

      // Simulate some delay for fetching stage
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Notify start of storing
      onProgress?.({
        status: 'storing',
        message: 'Storing transactions...',
        accountType: 'mobile_money',
        institutionName: 'MTN Mobile Money',
      });

      // Call the actual sync service
      const result = await this.syncAccount(accountId, dateRange);

      // Simulate some delay for storing stage
      await new Promise(resolve => setTimeout(resolve, 800));

      // Notify completion
      if (!result.error && result.data) {
        onProgress?.({
          status: 'completed',
          message: `Imported ${result.data.newTransactions} mobile money transactions`,
          transactionCount: result.data.newTransactions,
          accountType: 'mobile_money',
          institutionName: 'MTN Mobile Money',
        });
      } else if (result.error) {
        onProgress?.({
          status: 'error',
          message: result.error.message,
          error: result.error.message,
          accountType: 'mobile_money',
          institutionName: 'MTN Mobile Money',
        });
      }

      return result;
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('MTN sync with progress error:', error);
      
      onProgress?.({
        status: 'error',
        message: errorMessage,
        error: errorMessage,
        accountType: 'mobile_money',
        institutionName: 'MTN Mobile Money',
      });

      return {
        data: null,
        error: {
          code: 'SYNC_ERROR',
          message: errorMessage,
        },
      };
    }
  }

  /**
   * Sync transactions for the last 30 days (default behavior)
   */
  async syncLast30Days(accountId: string): Promise<ApiResponse<SyncResult>> {
    const endDate = new Date();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    return this.syncAccount(accountId, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  }

  /**
   * Sync transactions for a custom date range
   */
  async syncDateRange(
    accountId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ApiResponse<SyncResult>> {
    return this.syncAccount(accountId, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  }

  /**
   * Validate if an account is properly configured for syncing
   */
  async validateAccount(accountId: string): Promise<ApiResponse<{ isValid: boolean; message?: string }>> {
    try {
      // Get account from database
      const { data: account, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (error) {
        return createApiResponse({ isValid: false, message: 'Account not found' }, {
          code: 'ACCOUNT_NOT_FOUND',
          message: 'Account not found',
        });
      }

      if (!account.is_active) {
        return createApiResponse({
          isValid: false,
          message: 'Account is inactive',
        });
      }

      if (account.account_type !== 'mobile_money') {
        return createApiResponse({
          isValid: false,
          message: 'Account is not a mobile money account',
        });
      }

      if (!account.mtn_reference_id && !account.mtn_phone_number) {
        return createApiResponse({
          isValid: false,
          message: 'Account is missing MTN MoMo configuration',
        });
      }

      return createApiResponse({
        isValid: true,
        message: 'Account is valid for syncing',
      });

    } catch (error) {
      const errorMessage = handleApiError(error);
      return createApiResponse({ isValid: false, message: errorMessage }, {
        code: 'VALIDATION_ERROR',
        message: errorMessage,
      });
    }
  }

  /**
   * Get sync history for an account
   */
  async getSyncHistory(accountId: string, limit: number = 10): Promise<ApiResponse<any[]>> {
    try {
      // This would typically fetch from a sync_history table
      // For now, return empty array as placeholder
      return createApiResponse([]);

    } catch (error) {
      return createApiResponse([], {
        code: 'SYNC_HISTORY_ERROR',
        message: handleApiError(error),
      });
    }
  }
}

export const mtnSyncService = new MTNSyncService();