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
          data: undefined,
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
          data: undefined,
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
        errors: [],
      });

    } catch (error) {
      console.error('MTN sync service error:', error);
      return {
        data: undefined,
        error: {
          code: 'SYNC_ERROR',
          message: handleApiError(error),
        },
      };
    }
  }

  async syncAccountWithProgress(
    accountId: string,
    onProgress?: (status: 'fetching' | 'storing' | 'completed') => void,
    dateRange?: SyncRequest['dateRange']
  ): Promise<ApiResponse<SyncResult>> {
    try {
      // Notify start of fetching
      onProgress?.('fetching');

      // Simulate some delay for fetching stage
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Notify start of storing
      onProgress?.('storing');

      // Call the actual sync service
      const result = await this.syncAccount(accountId, dateRange);

      // Simulate some delay for storing stage
      await new Promise(resolve => setTimeout(resolve, 800));

      // Notify completion
      if (!result.error) {
        onProgress?.('completed');
      }

      return result;
    } catch (error) {
      console.error('MTN sync with progress error:', error);
      return {
        data: undefined,
        error: {
          code: 'SYNC_ERROR',
          message: handleApiError(error),
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
}

export const mtnSyncService = new MTNSyncService();