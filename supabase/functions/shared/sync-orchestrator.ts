interface SyncAccount {
  id: string;
  user_id: string;
  phone_number?: string;
  account_name: string;
  account_type: 'bank' | 'mobile_money';
  platform_source: 'mono' | 'mtn_momo';
  mono_account_id?: string;
  mtn_reference_id?: string;
  last_sync_at: string | null;
  sync_status: string | null;
  consecutive_sync_failures: number;
}

interface SyncQueueItem {
  account: SyncAccount;
  priority: number;
  retryCount: number;
  lastAttempt: Date | null;
}

interface SyncMetrics {
  totalAccounts: number;
  successfulSyncs: number;
  failedSyncs: number;
  authErrorSyncs: number;
  totalTransactionsSynced: number;
  averageSyncDuration: number;
  startTime: Date;
  endTime: Date | null;
  notificationsSent: number;
  notificationErrors: number;
  // Platform-specific metrics
  monoAccounts: number;
  mtnMomoAccounts: number;
  monoSuccessfulSyncs: number;
  mtnMomoSuccessfulSyncs: number;
  monoFailedSyncs: number;
  mtnMomoFailedSyncs: number;
}

export class SyncOrchestrator {
  private supabaseClient: any;
  private syncQueue: SyncQueueItem[] = [];
  private activeSyncs: Map<string, Promise<any>> = new Map();
  private maxConcurrentSyncs: number;
  private maxConcurrentMonoSyncs: number;
  private maxConcurrentMtnMomoSyncs: number;
  private metrics: SyncMetrics;
  private notificationService: any;
  private monoSyncWorker: any;
  private mtnMomoSyncWorker: any;

  constructor(
    supabaseClient: any, 
    maxConcurrentSyncs: number = 5,
    maxConcurrentMonoSyncs: number = 3,
    maxConcurrentMtnMomoSyncs: number = 5
  ) {
    this.supabaseClient = supabaseClient;
    this.maxConcurrentSyncs = maxConcurrentSyncs;
    this.maxConcurrentMonoSyncs = maxConcurrentMonoSyncs;
    this.maxConcurrentMtnMomoSyncs = maxConcurrentMtnMomoSyncs;
    this.metrics = this.initializeMetrics();
    this.initializeNotificationService();
    this.initializeSyncWorkers();
  }

  private async initializeNotificationService(): Promise<void> {
    try {
      const { NotificationService } = await import('./notification-service.ts');
      this.notificationService = new NotificationService();
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      this.notificationService = null;
    }
  }

  private async initializeSyncWorkers(): Promise<void> {
    try {
      const { MonoSyncWorker } = await import('./mono-sync-worker.ts');
      const { MtnMomoSyncWorker } = await import('./mtn-momo-sync-worker.ts');
      
      this.monoSyncWorker = new MonoSyncWorker(this.supabaseClient);
      this.mtnMomoSyncWorker = new MtnMomoSyncWorker(this.supabaseClient);
    } catch (error) {
      console.error('Failed to initialize sync workers:', error);
      this.monoSyncWorker = null;
      this.mtnMomoSyncWorker = null;
    }
  }

  private initializeMetrics(): SyncMetrics {
    return {
      totalAccounts: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      authErrorSyncs: 0,
      totalTransactionsSynced: 0,
      averageSyncDuration: 0,
      startTime: new Date(),
      endTime: null,
      notificationsSent: 0,
      notificationErrors: 0,
      monoAccounts: 0,
      mtnMomoAccounts: 0,
      monoSuccessfulSyncs: 0,
      mtnMomoSuccessfulSyncs: 0,
      monoFailedSyncs: 0,
      mtnMomoFailedSyncs: 0,
    };
  }

  /**
   * Load accounts that need syncing into the queue using dual platform function
   */
  async loadAccountsForSync(
    forceSync: boolean = false,
    monoHoursThreshold: number = 6,
    mtnMomoHoursThreshold: number = 4
  ): Promise<void> {
    try {
      console.log('Loading dual platform accounts for sync...');

      // Use the new dual platform function
      const { data: accounts, error } = await this.supabaseClient
        .rpc('get_dual_platform_accounts_needing_sync', {
          mono_hours_threshold: forceSync ? 0 : monoHoursThreshold,
          mtn_momo_hours_threshold: forceSync ? 0 : mtnMomoHoursThreshold
        });

      if (error) {
        throw new Error(`Failed to load accounts: ${error.message}`);
      }

      if (!accounts || accounts.length === 0) {
        console.log('No accounts found for syncing');
        return;
      }

      // Clear existing queue and add accounts with priority
      this.syncQueue = [];
      const monoAccounts = accounts.filter((acc: SyncAccount) => acc.platform_source === 'mono');
      const mtnMomoAccounts = accounts.filter((acc: SyncAccount) => acc.platform_source === 'mtn_momo');

      accounts.forEach((account: SyncAccount) => {
        const priority = this.calculateSyncPriority(account);
        this.syncQueue.push({
          account,
          priority,
          retryCount: 0,
          lastAttempt: null,
        });
      });

      // Sort queue by priority (higher priority first), then group by platform for efficiency
      this.syncQueue.sort((a, b) => {
        if (a.priority === b.priority) {
          // Group platforms together for better resource utilization
          return a.account.platform_source.localeCompare(b.account.platform_source);
        }
        return b.priority - a.priority;
      });

      this.metrics.totalAccounts = accounts.length;
      this.metrics.monoAccounts = monoAccounts.length;
      this.metrics.mtnMomoAccounts = mtnMomoAccounts.length;
      
      console.log(`Loaded ${accounts.length} accounts for syncing (${monoAccounts.length} Mono, ${mtnMomoAccounts.length} MTN MoMo)`);

    } catch (error) {
      console.error('Failed to load accounts for sync:', error);
      throw error;
    }
  }

  /**
   * Calculate sync priority based on account characteristics and platform
   */
  private calculateSyncPriority(account: SyncAccount): number {
    let priority = 50; // Base priority

    // Platform-specific base priority adjustments
    if (account.platform_source === 'mono') {
      priority += 10; // Bank accounts generally have higher priority
    }

    // Higher priority for accounts that have never been synced
    if (!account.last_sync_at) {
      priority += 30;
    } else {
      // Higher priority for accounts that haven't been synced in longer
      const daysSinceLastSync = (Date.now() - new Date(account.last_sync_at).getTime()) / (1000 * 60 * 60 * 24);
      priority += Math.min(daysSinceLastSync * 2, 20);
    }

    // Apply exponential backoff for failed accounts
    const failureCount = account.consecutive_sync_failures || 0;
    if (failureCount > 0) {
      priority -= Math.min(failureCount * 5, 25); // Reduce priority for repeatedly failing accounts
    }

    // Lower priority for accounts with authentication errors (they might need manual intervention)
    if (account.sync_status === 'auth_required') {
      priority -= 20;
    }

    // Moderate priority adjustment for accounts with errors (to retry them but not overwhelm)
    if (account.sync_status === 'error' && failureCount < 3) {
      priority += 10;
    }

    return Math.max(1, Math.min(100, priority)); // Clamp between 1-100
  }

  /**
   * Process the sync queue with dual platform concurrency control
   */
  async processQueue(): Promise<SyncMetrics> {
    try {
      console.log(`Starting dual platform queue processing - Total: ${this.maxConcurrentSyncs}, Mono: ${this.maxConcurrentMonoSyncs}, MTN MoMo: ${this.maxConcurrentMtnMomoSyncs}`);

      while (this.syncQueue.length > 0 || this.activeSyncs.size > 0) {
        // Count active syncs by platform
        const activeSyncAccounts = Array.from(this.activeSyncs.keys()).map(id => {
          const queueItem = this.syncQueue.find(item => item.account.id === id);
          return queueItem?.account;
        }).filter(Boolean);

        const activeMonoSyncs = activeSyncAccounts.filter(acc => acc?.platform_source === 'mono').length;
        const activeMtnMomoSyncs = activeSyncAccounts.filter(acc => acc?.platform_source === 'mtn_momo').length;

        // Start new syncs respecting platform-specific limits
        while (
          this.activeSyncs.size < this.maxConcurrentSyncs && 
          this.syncQueue.length > 0
        ) {
          const queueItem = this.syncQueue.find(item => {
            const platform = item.account.platform_source;
            
            if (platform === 'mono') {
              return activeMonoSyncs < this.maxConcurrentMonoSyncs;
            } else if (platform === 'mtn_momo') {
              return activeMtnMomoSyncs < this.maxConcurrentMtnMomoSyncs;
            }
            
            return false;
          });

          if (!queueItem) {
            break; // No eligible accounts due to platform limits
          }

          // Remove the selected item from queue
          const index = this.syncQueue.indexOf(queueItem);
          this.syncQueue.splice(index, 1);

          await this.startAccountSync(queueItem);

          // Update active sync counts
          if (queueItem.account.platform_source === 'mono') {
            activeMonoSyncs++;
          } else if (queueItem.account.platform_source === 'mtn_momo') {
            activeMtnMomoSyncs++;
          }
        }

        // Wait for at least one active sync to complete
        if (this.activeSyncs.size > 0) {
          await Promise.race(Array.from(this.activeSyncs.values()));
        }

        // Small delay to prevent tight loop
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.metrics.endTime = new Date();
      
      // Calculate average sync duration
      if (this.metrics.successfulSyncs > 0) {
        const totalDuration = this.metrics.endTime.getTime() - this.metrics.startTime.getTime();
        this.metrics.averageSyncDuration = totalDuration / (this.metrics.successfulSyncs + this.metrics.failedSyncs);
      }

      console.log('Dual platform queue processing completed', this.metrics);
      return this.metrics;

    } catch (error) {
      console.error('Queue processing failed:', error);
      this.metrics.endTime = new Date();
      throw error;
    }
  }

  /**
   * Start syncing a single account
   */
  private async startAccountSync(queueItem: SyncQueueItem): Promise<void> {
    const { account } = queueItem;
    const syncPromise = this.syncSingleAccount(account, queueItem);
    
    this.activeSyncs.set(account.id, syncPromise);
    
    // Handle completion/failure
    syncPromise
      .then((result) => {
        this.handleSyncCompletion(account.id, result, null);
      })
      .catch((error) => {
        this.handleSyncCompletion(account.id, null, error);
      })
      .finally(() => {
        this.activeSyncs.delete(account.id);
      });
  }

  /**
   * Sync a single account with retry logic
   */
  private async syncSingleAccount(account: SyncAccount, queueItem: SyncQueueItem): Promise<any> {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        queueItem.lastAttempt = new Date();
        queueItem.retryCount = attempt;

        console.log(`Syncing account ${account.id} (attempt ${attempt + 1}/${maxRetries + 1})`);

        // Update account sync status to in_progress
        await this.updateAccountSyncStatus(account.id, 'in_progress');

        // Call the existing sync logic from accounts-sync
        const result = await this.performAccountSync(account);

        // Update account sync status to success
        await this.updateAccountSyncStatus(account.id, 'active');

        return result;

      } catch (error) {
        console.error(`Account ${account.id} sync attempt ${attempt + 1} failed:`, error);

        const isAuthError = this.isAuthenticationError(error);
        const isFinalAttempt = attempt === maxRetries;

        if (isFinalAttempt) {
          // Update account sync status based on error type
          const status = isAuthError ? 'auth_required' : 'error';
          await this.updateAccountSyncStatus(account.id, status, error);
          throw error;
        }

        // If not an auth error and not the final attempt, retry with exponential backoff
        if (!isAuthError) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.log(`Retrying account ${account.id} in ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // For auth errors, don't retry and send notification
          await this.updateAccountSyncStatus(account.id, 'auth_required', error);
          await this.sendAuthErrorNotification(account);
          throw error;
        }
      }
    }
  }

  /**
   * Check if error is authentication-related
   */
  private isAuthenticationError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    return errorMessage.includes('401') || 
           errorMessage.includes('403') || 
           errorMessage.includes('unauthorized') ||
           errorMessage.includes('authentication') ||
           errorMessage.includes('auth');
  }

  /**
   * Handle sync completion/failure with platform-specific metrics
   */
  private handleSyncCompletion(accountId: string, result: any, error: any): void {
    // Determine platform for metrics
    const account = this.syncQueue.find(item => item.account.id === accountId)?.account ||
                   Array.from(this.activeSyncs.keys()).find(id => id === accountId);
    
    const platform = result?.platform || 'unknown';

    if (error) {
      if (this.isAuthenticationError(error)) {
        this.metrics.authErrorSyncs++;
      } else {
        this.metrics.failedSyncs++;
        
        // Platform-specific failed sync metrics
        if (platform === 'mono') {
          this.metrics.monoFailedSyncs++;
        } else if (platform === 'mtn_momo') {
          this.metrics.mtnMomoFailedSyncs++;
        }
      }
    } else {
      this.metrics.successfulSyncs++;
      
      // Platform-specific successful sync metrics
      if (platform === 'mono') {
        this.metrics.monoSuccessfulSyncs++;
      } else if (platform === 'mtn_momo') {
        this.metrics.mtnMomoSuccessfulSyncs++;
      }
      
      if (result?.transactionsSynced) {
        this.metrics.totalTransactionsSynced += result.transactionsSynced;
        // Send sync completion notification if there are new transactions
        this.sendSyncCompletionNotification(result);
      }
    }
  }

  /**
   * Send notification for authentication errors
   */
  private async sendAuthErrorNotification(account: SyncAccount): Promise<void> {
    if (!this.notificationService) {
      console.log('Notification service not available, skipping auth error notification');
      return;
    }

    try {
      const result = await this.notificationService.sendReAuthNotification(
        account.user_id,
        account.account_name,
        account.phone_number
      );

      if (result.success) {
        this.metrics.notificationsSent++;
        console.log(`Re-auth notification sent for account ${account.id}`);
      } else {
        this.metrics.notificationErrors++;
        console.error(`Failed to send re-auth notification for account ${account.id}:`, result.error);
      }
    } catch (error) {
      this.metrics.notificationErrors++;
      console.error(`Error sending re-auth notification for account ${account.id}:`, error);
    }
  }

  /**
   * Send notification for successful sync with new transactions
   */
  private async sendSyncCompletionNotification(result: any): Promise<void> {
    if (!this.notificationService || !result.transactionsSynced || result.transactionsSynced === 0) {
      return;
    }

    try {
      // Get account details for the notification
      const { data: account } = await this.supabaseClient
        .from('momo_account_links')
        .select('user_id, account_name')
        .eq('id', result.accountId)
        .single();

      if (account) {
        const notificationResult = await this.notificationService.sendSyncCompletionNotification(
          account.user_id,
          account.account_name,
          result.transactionsSynced
        );

        if (notificationResult.success) {
          this.metrics.notificationsSent++;
          console.log(`Sync completion notification sent for account ${result.accountId}`);
        } else {
          this.metrics.notificationErrors++;
          console.error(`Failed to send sync completion notification:`, notificationResult.error);
        }
      }
    } catch (error) {
      this.metrics.notificationErrors++;
      console.error(`Error sending sync completion notification:`, error);
    }
  }

  /**
   * Update account sync status using dual platform function
   */
  private async updateAccountSyncStatus(
    accountId: string, 
    status: string, 
    error?: any
  ): Promise<void> {
    try {
      // Determine platform for the account
      const { data: account } = await this.supabaseClient
        .from('accounts')
        .select('platform_source')
        .eq('id', accountId)
        .single();

      if (!account) {
        console.error(`Account ${accountId} not found for sync status update`);
        return;
      }

      const platform = account.platform_source || 'mtn_momo'; // Default fallback
      const errorMessage = error ? (error.message || JSON.stringify(error)) : null;

      await this.supabaseClient.rpc('update_dual_platform_sync_status', {
        account_id: accountId,
        platform: platform,
        new_status: status,
        transactions_synced: 0,
        error_message: errorMessage,
        platform_error: errorMessage
      });

    } catch (updateError) {
      console.error(`Failed to update sync status for account ${accountId}:`, updateError);
    }
  }

  /**
   * Perform the actual account sync using platform-specific workers
   */
  private async performAccountSync(account: SyncAccount): Promise<any> {
    console.log(`Performing ${account.platform_source} sync for account ${account.id}`);

    try {
      if (account.platform_source === 'mono') {
        if (!this.monoSyncWorker) {
          throw new Error('Mono sync worker not available');
        }

        return await this.monoSyncWorker.syncAccount({
          id: account.id,
          user_id: account.user_id,
          account_name: account.account_name,
          mono_account_id: account.mono_account_id!,
          last_synced_at: account.last_sync_at,
          sync_status: account.sync_status,
          consecutive_sync_failures: account.consecutive_sync_failures
        });

      } else if (account.platform_source === 'mtn_momo') {
        if (!this.mtnMomoSyncWorker) {
          throw new Error('MTN MoMo sync worker not available');
        }

        return await this.mtnMomoSyncWorker.syncAccount({
          id: account.id,
          user_id: account.user_id,
          account_name: account.account_name,
          phone_number: account.phone_number!,
          mtn_reference_id: account.mtn_reference_id!,
          last_synced_at: account.last_sync_at,
          sync_status: account.sync_status,
          consecutive_sync_failures: account.consecutive_sync_failures
        });

      } else {
        throw new Error(`Unsupported platform source: ${account.platform_source}`);
      }

    } catch (error) {
      console.error(`Platform-specific sync failed for account ${account.id}:`, error);
      throw error;
    }
  }

  /**
   * Get current sync metrics
   */
  getMetrics(): SyncMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if sync is currently in progress
   */
  isActive(): boolean {
    return this.activeSyncs.size > 0;
  }

  /**
   * Get count of accounts in queue
   */
  getQueueLength(): number {
    return this.syncQueue.length;
  }

  /**
   * Get count of active syncs
   */
  getActiveSyncCount(): number {
    return this.activeSyncs.size;
  }
}