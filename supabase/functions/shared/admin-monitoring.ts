interface SyncHealthMetrics {
  totalAccounts: number;
  activeAccounts: number;
  accountsNeedingReauth: number;
  accountsWithErrors: number;
  lastSyncStats: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    averageDuration: number;
    totalTransactionsSynced: number;
  };
  recentErrors: Array<{
    account_id: string;
    error_message: string;
    created_at: string;
  }>;
}

interface SyncPerformanceStats {
  period: string;
  totalSyncs: number;
  successRate: number;
  averageDuration: number;
  totalTransactions: number;
  peakConcurrency: number;
  errorTypes: Record<string, number>;
}

export class AdminMonitoringService {
  private supabaseClient: any;

  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
  }

  /**
   * Get overall sync health metrics
   */
  async getSyncHealthMetrics(): Promise<SyncHealthMetrics> {
    try {
      // Get account statistics
      const { data: accountStats } = await this.supabaseClient
        .from('momo_account_links')
        .select('sync_status, is_active')
        .eq('is_active', true);

      const totalAccounts = accountStats?.length || 0;
      const activeAccounts = accountStats?.filter(acc => acc.sync_status === 'active').length || 0;
      const accountsNeedingReauth = accountStats?.filter(acc => acc.sync_status === 'auth_required').length || 0;
      const accountsWithErrors = accountStats?.filter(acc => acc.sync_status === 'error').length || 0;

      // Get recent sync statistics (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentSyncs } = await this.supabaseClient
        .from('transaction_sync_log')
        .select('sync_status, transactions_synced, sync_started_at, sync_completed_at')
        .gte('created_at', sevenDaysAgo);

      const totalRuns = recentSyncs?.length || 0;
      const successfulRuns = recentSyncs?.filter(sync => sync.sync_status === 'success').length || 0;
      const failedRuns = totalRuns - successfulRuns;

      // Calculate average duration for completed syncs
      const completedSyncs = recentSyncs?.filter(sync => 
        sync.sync_completed_at && sync.sync_started_at
      ) || [];
      
      const averageDuration = completedSyncs.length > 0
        ? completedSyncs.reduce((sum, sync) => {
            const duration = new Date(sync.sync_completed_at).getTime() - 
                            new Date(sync.sync_started_at).getTime();
            return sum + duration;
          }, 0) / completedSyncs.length
        : 0;

      const totalTransactionsSynced = recentSyncs?.reduce((sum, sync) => 
        sum + (sync.transactions_synced || 0), 0
      ) || 0;

      // Get recent errors
      const { data: recentErrors } = await this.supabaseClient
        .from('transaction_sync_log')
        .select('momo_account_id, error_message, created_at')
        .eq('sync_status', 'failed')
        .not('error_message', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        totalAccounts,
        activeAccounts,
        accountsNeedingReauth,
        accountsWithErrors,
        lastSyncStats: {
          totalRuns,
          successfulRuns,
          failedRuns,
          averageDuration,
          totalTransactionsSynced,
        },
        recentErrors: recentErrors?.map(error => ({
          account_id: error.momo_account_id,
          error_message: error.error_message,
          created_at: error.created_at,
        })) || [],
      };

    } catch (error) {
      console.error('Failed to get sync health metrics:', error);
      throw error;
    }
  }

  /**
   * Get performance statistics for a specific time period
   */
  async getSyncPerformanceStats(days: number = 7): Promise<SyncPerformanceStats> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: syncs } = await this.supabaseClient
        .from('transaction_sync_log')
        .select('*')
        .gte('created_at', startDate);

      if (!syncs || syncs.length === 0) {
        return {
          period: `Last ${days} days`,
          totalSyncs: 0,
          successRate: 0,
          averageDuration: 0,
          totalTransactions: 0,
          peakConcurrency: 0,
          errorTypes: {},
        };
      }

      const totalSyncs = syncs.length;
      const successfulSyncs = syncs.filter(sync => sync.sync_status === 'success').length;
      const successRate = (successfulSyncs / totalSyncs) * 100;

      // Calculate average duration
      const completedSyncs = syncs.filter(sync => 
        sync.sync_completed_at && sync.sync_started_at
      );
      
      const averageDuration = completedSyncs.length > 0
        ? completedSyncs.reduce((sum, sync) => {
            const duration = new Date(sync.sync_completed_at).getTime() - 
                            new Date(sync.sync_started_at).getTime();
            return sum + duration;
          }, 0) / completedSyncs.length
        : 0;

      const totalTransactions = syncs.reduce((sum, sync) => 
        sum + (sync.transactions_synced || 0), 0
      );

      // Analyze error types
      const failedSyncs = syncs.filter(sync => 
        sync.sync_status === 'failed' && sync.error_message
      );
      
      const errorTypes: Record<string, number> = {};
      failedSyncs.forEach(sync => {
        const errorMessage = sync.error_message.toLowerCase();
        if (errorMessage.includes('auth')) {
          errorTypes['Authentication'] = (errorTypes['Authentication'] || 0) + 1;
        } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
          errorTypes['Network'] = (errorTypes['Network'] || 0) + 1;
        } else if (errorMessage.includes('rate limit')) {
          errorTypes['Rate Limit'] = (errorTypes['Rate Limit'] || 0) + 1;
        } else {
          errorTypes['Other'] = (errorTypes['Other'] || 0) + 1;
        }
      });

      // Estimate peak concurrency (rough approximation)
      const peakConcurrency = this.estimatePeakConcurrency(syncs);

      return {
        period: `Last ${days} days`,
        totalSyncs,
        successRate,
        averageDuration,
        totalTransactions,
        peakConcurrency,
        errorTypes,
      };

    } catch (error) {
      console.error('Failed to get sync performance stats:', error);
      throw error;
    }
  }

  /**
   * Get accounts that need attention (errors, reauth required)
   */
  async getAccountsNeedingAttention(): Promise<Array<{
    id: string;
    user_id: string;
    account_name: string;
    phone_number: string;
    sync_status: string;
    last_sync_at: string | null;
    last_error: string | null;
    error_count: number;
  }>> {
    try {
      // Get accounts with issues
      const { data: problematicAccounts } = await this.supabaseClient
        .from('momo_account_links')
        .select('*')
        .eq('is_active', true)
        .in('sync_status', ['auth_required', 'error']);

      if (!problematicAccounts || problematicAccounts.length === 0) {
        return [];
      }

      // Get error counts and last errors for each account
      const accountsWithDetails = await Promise.all(
        problematicAccounts.map(async (account) => {
          const { data: recentErrors, count: errorCount } = await this.supabaseClient
            .from('transaction_sync_log')
            .select('error_message, created_at', { count: 'exact' })
            .eq('momo_account_id', account.id)
            .eq('sync_status', 'failed')
            .order('created_at', { ascending: false })
            .limit(1);

          return {
            id: account.id,
            user_id: account.user_id,
            account_name: account.account_name,
            phone_number: account.phone_number,
            sync_status: account.sync_status,
            last_sync_at: account.last_sync_at,
            last_error: recentErrors?.[0]?.error_message || null,
            error_count: errorCount || 0,
          };
        })
      );

      return accountsWithDetails;

    } catch (error) {
      console.error('Failed to get accounts needing attention:', error);
      throw error;
    }
  }

  /**
   * Get sync configuration status
   */
  async getSyncConfiguration(): Promise<{
    enabled: boolean;
    frequency_hours: number;
    max_concurrent_accounts: number;
    last_run_at: string | null;
    next_run_at: string | null;
  } | null> {
    try {
      const { data: config } = await this.supabaseClient
        .from('background_sync_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!config) {
        return null;
      }

      return {
        enabled: config.enabled,
        frequency_hours: config.sync_frequency_hours,
        max_concurrent_accounts: config.max_concurrent_accounts,
        last_run_at: config.last_run_at,
        next_run_at: config.next_run_at,
      };

    } catch (error) {
      console.error('Failed to get sync configuration:', error);
      return null;
    }
  }

  /**
   * Update sync configuration
   */
  async updateSyncConfiguration(config: {
    enabled?: boolean;
    frequency_hours?: number;
    max_concurrent_accounts?: number;
  }): Promise<boolean> {
    try {
      const { error } = await this.supabaseClient
        .from('background_sync_config')
        .update({
          ...config,
          updated_at: new Date().toISOString(),
        })
        .eq('enabled', true); // Update the currently active config

      if (error) {
        throw error;
      }

      return true;

    } catch (error) {
      console.error('Failed to update sync configuration:', error);
      return false;
    }
  }

  /**
   * Force sync for specific accounts
   */
  async forceSyncAccounts(accountIds: string[]): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // This would trigger the background sync function with specific account IDs
      // For now, we'll just log the request
      console.log('Force sync requested for accounts:', accountIds);

      // Update account sync status to trigger sync on next run
      const { error } = await this.supabaseClient
        .from('momo_account_links')
        .update({
          last_sync_at: null, // Reset last sync to force sync
          sync_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .in('id', accountIds);

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: `Force sync queued for ${accountIds.length} accounts`,
      };

    } catch (error) {
      console.error('Failed to force sync accounts:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Estimate peak concurrency from sync logs
   */
  private estimatePeakConcurrency(syncs: any[]): number {
    if (!syncs || syncs.length === 0) return 0;

    // Group syncs by minute to estimate concurrency
    const syncsByMinute: Record<string, number> = {};
    
    syncs.forEach(sync => {
      if (sync.sync_started_at) {
        const minute = sync.sync_started_at.substring(0, 16); // YYYY-MM-DDTHH:MM
        syncsByMinute[minute] = (syncsByMinute[minute] || 0) + 1;
      }
    });

    return Math.max(...Object.values(syncsByMinute), 0);
  }

  /**
   * Get sync trends over time
   */
  async getSyncTrends(days: number = 30): Promise<Array<{
    date: string;
    successful_syncs: number;
    failed_syncs: number;
    transactions_synced: number;
  }>> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const trends: Array<{
        date: string;
        successful_syncs: number;
        failed_syncs: number;
        transactions_synced: number;
      }> = [];

      for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const nextDateStr = new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const { data: daySyncs } = await this.supabaseClient
          .from('transaction_sync_log')
          .select('sync_status, transactions_synced')
          .gte('created_at', dateStr)
          .lt('created_at', nextDateStr);

        const successful_syncs = daySyncs?.filter(sync => sync.sync_status === 'success').length || 0;
        const failed_syncs = daySyncs?.filter(sync => sync.sync_status === 'failed').length || 0;
        const transactions_synced = daySyncs?.reduce((sum, sync) => sum + (sync.transactions_synced || 0), 0) || 0;

        trends.push({
          date: dateStr,
          successful_syncs,
          failed_syncs,
          transactions_synced,
        });
      }

      return trends;

    } catch (error) {
      console.error('Failed to get sync trends:', error);
      return [];
    }
  }
}