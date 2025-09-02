import { supabase } from '@/services/supabaseClient';
import { handleApiError, createApiResponse } from '@/services/apiClient';
import type { ApiResponse } from '@/types/api';

interface BackgroundSyncStatus {
  isEnabled: boolean;
  frequencyHours: number;
  maxConcurrentAccounts: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

interface SyncMetrics {
  totalAccounts: number;
  successfulSyncs: number;
  failedSyncs: number;
  authErrorSyncs: number;
  totalTransactionsSynced: number;
  averageSyncDuration: number;
  notificationsSent: number;
}

interface AccountSyncStatus {
  id: string;
  accountName: string;
  phoneNumber: string;
  syncStatus: 'active' | 'auth_required' | 'error' | 'in_progress';
  lastSyncAt: string | null;
  lastSyncAttempt: string | null;
  errorMessage?: string;
}

class BackgroundSyncService {
  private getEdgeFunctionUrl(): string {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      console.warn('Supabase URL not configured. Background sync will be disabled.');
      return '';
    }
    return `${supabaseUrl}/functions/v1/background-sync`;
  }

  private isServiceAvailable(): boolean {
    return !!process.env.EXPO_PUBLIC_SUPABASE_URL;
  }

  /**
   * Get background sync configuration and status
   */
  async getSyncStatus(): Promise<ApiResponse<BackgroundSyncStatus>> {
    if (!this.isServiceAvailable()) {
      return {
        data: {
          isEnabled: false,
          frequencyHours: 24,
          maxConcurrentAccounts: 5,
          lastRunAt: null,
          nextRunAt: null,
        },
        error: null,
      };
    }

    try {
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

      const { data: config, error } = await supabase
        .from('background_sync_config')
        .select('*')
        .eq('enabled', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      const syncStatus: BackgroundSyncStatus = {
        isEnabled: config?.enabled || false,
        frequencyHours: config?.sync_frequency_hours || 24,
        maxConcurrentAccounts: config?.max_concurrent_accounts || 5,
        lastRunAt: config?.last_run_at || null,
        nextRunAt: config?.next_run_at || null,
      };

      return createApiResponse(syncStatus);

    } catch (error) {
      console.error('Failed to get sync status:', error);
      return {
        data: null,
        error: {
          code: 'SYNC_STATUS_ERROR',
          message: handleApiError(error),
        },
      };
    }
  }

  /**
   * Get sync status for all user's accounts
   */
  async getAccountSyncStatuses(): Promise<ApiResponse<AccountSyncStatus[]>> {
    try {
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

      const { data: accounts, error } = await supabase
        .from('accounts')
        .select('id, account_name, phone_number, sync_status, last_synced_at, last_sync_attempt, platform_source')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .in('platform_source', ['mtn_momo', 'mono'])
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Get recent error messages for accounts with errors
      const accountStatuses: AccountSyncStatus[] = await Promise.all(
        (accounts || []).map(async (account) => {
          let errorMessage: string | undefined;

          if (account.sync_status === 'error') {
            const { data: recentError } = await supabase
              .from('transaction_sync_log')
              .select('error_message')
              .eq('momo_account_id', account.id)
              .eq('sync_status', 'failed')
              .not('error_message', 'is', null)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            errorMessage = recentError?.error_message;
          }

          return {
            id: account.id,
            accountName: account.account_name,
            phoneNumber: account.phone_number,
            syncStatus: account.sync_status || 'active',
            lastSyncAt: account.last_synced_at,
            lastSyncAttempt: account.last_sync_attempt,
            errorMessage,
          };
        })
      );

      return createApiResponse(accountStatuses);

    } catch (error) {
      console.error('Failed to get account sync statuses:', error);
      return {
        data: null,
        error: {
          code: 'ACCOUNT_STATUS_ERROR',
          message: handleApiError(error),
        },
      };
    }
  }

  /**
   * Trigger background sync manually (admin function)
   */
  async triggerBackgroundSync(forceSync: boolean = false): Promise<ApiResponse<SyncMetrics>> {
    try {
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

      const response = await fetch(this.getEdgeFunctionUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          forceSync,
          maxConcurrentAccounts: 5,
        }),
      });

      if (!response.ok) {
        throw new Error(`Background sync failed: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(responseData.error || 'Background sync failed');
      }

      const metrics: SyncMetrics = {
        totalAccounts: responseData.accountsProcessed || 0,
        successfulSyncs: responseData.results?.filter((r: any) => r.status === 'success').length || 0,
        failedSyncs: responseData.results?.filter((r: any) => r.status === 'failed').length || 0,
        authErrorSyncs: responseData.results?.filter((r: any) => r.status === 'auth_error').length || 0,
        totalTransactionsSynced: responseData.totalTransactionsSynced || 0,
        averageSyncDuration: responseData.duration / Math.max(responseData.accountsProcessed, 1),
        notificationsSent: 0, // This would come from the orchestrator metrics
      };

      return createApiResponse(metrics);

    } catch (error) {
      console.error('Failed to trigger background sync:', error);
      return {
        data: null,
        error: {
          code: 'BACKGROUND_SYNC_ERROR',
          message: handleApiError(error),
        },
      };
    }
  }

  /**
   * Update background sync configuration
   */
  async updateSyncConfiguration(config: {
    enabled?: boolean;
    frequencyHours?: number;
    maxConcurrentAccounts?: number;
  }): Promise<ApiResponse<boolean>> {
    try {
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

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (config.enabled !== undefined) {
        updateData.enabled = config.enabled;
      }
      if (config.frequencyHours !== undefined) {
        updateData.sync_frequency_hours = config.frequencyHours;
      }
      if (config.maxConcurrentAccounts !== undefined) {
        updateData.max_concurrent_accounts = config.maxConcurrentAccounts;
      }

      const { error } = await supabase
        .from('background_sync_config')
        .update(updateData)
        .eq('enabled', true); // Update the currently active config

      if (error) {
        throw error;
      }

      return createApiResponse(true);

    } catch (error) {
      console.error('Failed to update sync configuration:', error);
      return {
        data: null,
        error: {
          code: 'CONFIG_UPDATE_ERROR',
          message: handleApiError(error),
        },
      };
    }
  }

  /**
   * Get recent sync history
   */
  async getSyncHistory(limit: number = 20): Promise<ApiResponse<Array<{
    id: string;
    accountName: string;
    syncType: string;
    syncStatus: string;
    transactionsSynced: number;
    startedAt: string;
    completedAt: string | null;
    duration: number | null;
    errorMessage: string | null;
  }>>> {
    try {
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

      const { data: syncLogs, error } = await supabase
        .from('transaction_sync_log')
        .select(`
          id,
          sync_type,
          sync_status,
          transactions_synced,
          sync_started_at,
          sync_completed_at,
          error_message,
          account:accounts (
            account_name,
            platform_source
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      const history = (syncLogs || []).map(log => ({
        id: log.id,
        accountName: Array.isArray(log.account) 
          ? (log.account[0] as any)?.account_name || 'Unknown Account'
          : (log.account as any)?.account_name || 'Unknown Account',
        syncType: log.sync_type,
        syncStatus: log.sync_status,
        transactionsSynced: log.transactions_synced || 0,
        startedAt: log.sync_started_at,
        completedAt: log.sync_completed_at,
        duration: log.sync_completed_at && log.sync_started_at
          ? new Date(log.sync_completed_at).getTime() - new Date(log.sync_started_at).getTime()
          : null,
        errorMessage: log.error_message,
      }));

      return createApiResponse(history);

    } catch (error) {
      console.error('Failed to get sync history:', error);
      return {
        data: null,
        error: {
          code: 'SYNC_HISTORY_ERROR',
          message: handleApiError(error),
        },
      };
    }
  }

  /**
   * Check if background sync is healthy
   */
  async checkSyncHealth(): Promise<ApiResponse<{
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  }>> {
    try {
      const syncStatusResult = await this.getSyncStatus();
      const accountStatusesResult = await this.getAccountSyncStatuses();

      if (syncStatusResult.error || accountStatusesResult.error) {
        return createApiResponse({
          isHealthy: false,
          issues: ['Failed to fetch sync status'],
          recommendations: ['Check your internet connection and try again'],
        });
      }

      const syncStatus = syncStatusResult.data!;
      const accountStatuses = accountStatusesResult.data!;

      const issues: string[] = [];
      const recommendations: string[] = [];

      // Check if sync is enabled
      if (!syncStatus.isEnabled) {
        issues.push('Background sync is disabled');
        recommendations.push('Enable background sync in settings');
      }

      // Check for accounts needing reauth
      const authRequiredAccounts = accountStatuses.filter(acc => acc.syncStatus === 'auth_required');
      if (authRequiredAccounts.length > 0) {
        issues.push(`${authRequiredAccounts.length} account(s) need re-authentication`);
        recommendations.push('Re-link your MTN MoMo accounts in account settings');
      }

      // Check for accounts with errors
      const errorAccounts = accountStatuses.filter(acc => acc.syncStatus === 'error');
      if (errorAccounts.length > 0) {
        issues.push(`${errorAccounts.length} account(s) have sync errors`);
        recommendations.push('Check account settings and try manual sync');
      }

      // Check if any accounts haven't synced recently
      const staleAccounts = accountStatuses.filter(acc => {
        if (!acc.lastSyncAt) return true;
        const lastSync = new Date(acc.lastSyncAt);
        const daysSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceSync > syncStatus.frequencyHours / 24 + 1; // Allow some buffer
      });

      if (staleAccounts.length > 0) {
        issues.push(`${staleAccounts.length} account(s) haven't synced recently`);
        recommendations.push('Check your internet connection and account settings');
      }

      return createApiResponse({
        isHealthy: issues.length === 0,
        issues,
        recommendations,
      });

    } catch (error) {
      console.error('Failed to check sync health:', error);
      return {
        data: null,
        error: {
          code: 'HEALTH_CHECK_ERROR',
          message: handleApiError(error),
        },
      };
    }
  }
}

export const backgroundSyncService = new BackgroundSyncService();