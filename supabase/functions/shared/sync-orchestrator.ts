interface SyncAccount {
  id: string;
  user_id: string;
  phone_number: string;
  account_name: string;
  last_sync_at: string | null;
  sync_status: string | null;
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
}

export class SyncOrchestrator {
  private supabaseClient: any;
  private syncQueue: SyncQueueItem[] = [];
  private activeSyncs: Map<string, Promise<any>> = new Map();
  private maxConcurrentSyncs: number;
  private metrics: SyncMetrics;
  private notificationService: any;

  constructor(supabaseClient: any, maxConcurrentSyncs: number = 5) {
    this.supabaseClient = supabaseClient;
    this.maxConcurrentSyncs = maxConcurrentSyncs;
    this.metrics = this.initializeMetrics();
    this.initializeNotificationService();
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
    };
  }

  /**
   * Load accounts that need syncing into the queue
   */
  async loadAccountsForSync(forceSync: boolean = false): Promise<void> {
    try {
      console.log('Loading accounts for sync...');

      let query = this.supabaseClient
        .from('momo_account_links')
        .select('id, user_id, phone_number, account_name, last_sync_at, sync_status')
        .eq('is_active', true);

      // If not force sync, only sync accounts that haven't been synced in the last 24 hours
      if (!forceSync) {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        query = query.or(`last_sync_at.is.null,last_sync_at.lt.${twentyFourHoursAgo}`);
      }

      const { data: accounts, error } = await query.order('last_sync_at', { ascending: true, nullsFirst: true });

      if (error) {
        throw new Error(`Failed to load accounts: ${error.message}`);
      }

      if (!accounts || accounts.length === 0) {
        console.log('No accounts found for syncing');
        return;
      }

      // Clear existing queue and add accounts with priority
      this.syncQueue = [];
      accounts.forEach((account: SyncAccount) => {
        const priority = this.calculateSyncPriority(account);
        this.syncQueue.push({
          account,
          priority,
          retryCount: 0,
          lastAttempt: null,
        });
      });

      // Sort queue by priority (higher priority first)
      this.syncQueue.sort((a, b) => b.priority - a.priority);

      this.metrics.totalAccounts = accounts.length;
      console.log(`Loaded ${accounts.length} accounts for syncing`);

    } catch (error) {
      console.error('Failed to load accounts for sync:', error);
      throw error;
    }
  }

  /**
   * Calculate sync priority based on account characteristics
   */
  private calculateSyncPriority(account: SyncAccount): number {
    let priority = 50; // Base priority

    // Higher priority for accounts that have never been synced
    if (!account.last_sync_at) {
      priority += 30;
    } else {
      // Higher priority for accounts that haven't been synced in longer
      const daysSinceLastSync = (Date.now() - new Date(account.last_sync_at).getTime()) / (1000 * 60 * 60 * 24);
      priority += Math.min(daysSinceLastSync * 2, 20);
    }

    // Lower priority for accounts with authentication errors (they might need manual intervention)
    if (account.sync_status === 'auth_required') {
      priority -= 20;
    }

    // Higher priority for accounts with errors (to retry them)
    if (account.sync_status === 'error') {
      priority += 10;
    }

    return Math.max(1, Math.min(100, priority)); // Clamp between 1-100
  }

  /**
   * Process the sync queue with concurrency control
   */
  async processQueue(): Promise<SyncMetrics> {
    try {
      console.log(`Starting queue processing with max concurrency: ${this.maxConcurrentSyncs}`);

      while (this.syncQueue.length > 0 || this.activeSyncs.size > 0) {
        // Start new syncs if we have capacity and items in queue
        while (this.activeSyncs.size < this.maxConcurrentSyncs && this.syncQueue.length > 0) {
          const queueItem = this.syncQueue.shift()!;
          await this.startAccountSync(queueItem);
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

      console.log('Queue processing completed', this.metrics);
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
   * Handle sync completion/failure
   */
  private handleSyncCompletion(accountId: string, result: any, error: any): void {
    if (error) {
      if (this.isAuthenticationError(error)) {
        this.metrics.authErrorSyncs++;
      } else {
        this.metrics.failedSyncs++;
      }
    } else {
      this.metrics.successfulSyncs++;
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
   * Update account sync status in database
   */
  private async updateAccountSyncStatus(
    accountId: string, 
    status: string, 
    error?: any
  ): Promise<void> {
    try {
      const updateData: any = {
        sync_status: status,
        last_sync_attempt: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (status === 'active') {
        updateData.last_sync_at = new Date().toISOString();
      }

      await this.supabaseClient
        .from('momo_account_links')
        .update(updateData)
        .eq('id', accountId);

    } catch (updateError) {
      console.error(`Failed to update sync status for account ${accountId}:`, updateError);
    }
  }

  /**
   * Perform the actual account sync (reusing existing logic)
   */
  private async performAccountSync(account: SyncAccount): Promise<any> {
    // This would call the same logic as in accounts-sync function
    // For now, we'll import/reuse the mtnClient and sync logic
    const { mtnClient } = await import('./mtn-client.ts');

    // Calculate date range for incremental sync
    const endDate = new Date();
    const startDate = account.last_sync_at 
      ? new Date(account.last_sync_at)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days

    // Initialize MTN client
    await mtnClient.initialize();

    // Fetch transactions from MTN MoMo API
    const transactions = await mtnClient.getTransactions(
      account.phone_number,
      startDate.toISOString(),
      endDate.toISOString()
    );

    // Process transactions (similar to accounts-sync logic)
    let totalTransactions = 0;
    let newTransactions = 0;

    for (const mtnTransaction of transactions) {
      // Check if transaction already exists
      const { data: existingTransaction } = await this.supabaseClient
        .from('transactions')
        .select('id')
        .eq('momo_external_id', mtnTransaction.externalId)
        .eq('user_id', account.user_id)
        .single();

      if (!existingTransaction) {
        // Get default category
        let categoryId = null;
        const { data: defaultCategory } = await this.supabaseClient
          .from('categories')
          .select('id')
          .eq('name', 'Uncategorized')
          .eq('user_id', account.user_id)
          .single();

        if (defaultCategory) {
          categoryId = defaultCategory.id;
        }

        // Insert new transaction
        const transactionData = {
          user_id: account.user_id,
          account_id: account.id,
          category_id: categoryId,
          amount: parseFloat(mtnTransaction.amount),
          type: mtnTransaction.amount.startsWith('-') ? 'expense' : 'income',
          description: mtnTransaction.payerMessage || `MTN MoMo transaction`,
          transaction_date: mtnTransaction.createdAt || new Date().toISOString(),
          momo_external_id: mtnTransaction.externalId,
          momo_reference_id: mtnTransaction.externalId,
          momo_status: mtnTransaction.status,
          momo_payer_info: mtnTransaction.payer,
          momo_financial_transaction_id: mtnTransaction.financialTransactionId,
          is_synced: true,
          auto_categorized: false,
        };

        const { error: insertError } = await this.supabaseClient
          .from('transactions')
          .insert(transactionData);

        if (!insertError) {
          newTransactions++;
        }
      }

      totalTransactions++;
    }

    return {
      accountId: account.id,
      phoneNumber: account.phone_number,
      status: 'success',
      transactionsSynced: newTransactions,
      totalProcessed: totalTransactions,
    };
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