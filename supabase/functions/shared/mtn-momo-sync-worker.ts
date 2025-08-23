/**
 * MTN MoMo Sync Worker
 * Handles background synchronization for MTN Mobile Money accounts
 */

interface MtnMomoAccount {
  id: string;
  user_id: string;
  account_name: string;
  phone_number: string;
  mtn_reference_id: string;
  last_synced_at: string | null;
  sync_status: string | null;
  consecutive_sync_failures: number;
}

interface MtnMomoSyncResult {
  accountId: string;
  phoneNumber: string;
  platform: 'mtn_momo';
  status: 'success' | 'failed' | 'auth_error';
  transactionsSynced: number;
  totalProcessed: number;
  error?: string;
  duration: number;
}

export class MtnMomoSyncWorker {
  private supabaseClient: any;
  private mtnClient: any;

  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
    this.initializeMtnClient();
  }

  /**
   * Initialize MTN MoMo client
   */
  private async initializeMtnClient(): Promise<void> {
    try {
      const { mtnClient } = await import('./mtn-client.ts');
      this.mtnClient = mtnClient;
      await this.mtnClient.initialize();
    } catch (error) {
      console.error('Failed to initialize MTN MoMo client:', error);
      this.mtnClient = null;
    }
  }

  /**
   * Sync a single MTN MoMo account
   */
  async syncAccount(account: MtnMomoAccount): Promise<MtnMomoSyncResult> {
    const startTime = Date.now();
    
    try {
      console.log(`Starting MTN MoMo sync for account ${account.id} (${account.phone_number})`);

      if (!this.mtnClient) {
        throw new Error('MTN MoMo client not initialized');
      }

      // Update account status to in_progress
      await this.updateSyncStatus(account.id, 'in_progress');

      // Calculate date range for incremental sync
      const endDate = new Date();
      const startDate = account.last_synced_at 
        ? new Date(account.last_synced_at)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days

      // Fetch transactions from MTN MoMo API
      const transactions = await this.fetchMtnMomoTransactions(
        account.phone_number,
        startDate,
        endDate
      );

      // Process and store transactions with categorization
      const syncResult = await this.processTransactions(account, transactions);

      // Update account with successful sync
      await this.updateSyncStatus(account.id, 'active', syncResult.transactionsSynced);

      const duration = Date.now() - startTime;

      return {
        accountId: account.id,
        phoneNumber: account.phone_number,
        platform: 'mtn_momo',
        status: 'success',
        transactionsSynced: syncResult.newTransactions,
        totalProcessed: syncResult.totalTransactions,
        duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`MTN MoMo sync failed for account ${account.id}:`, error);

      // Determine error type for proper status update
      const isAuthError = this.isAuthenticationError(error);
      const status = isAuthError ? 'auth_required' : 'error';
      
      await this.updateSyncStatus(account.id, status, 0, errorMessage);

      return {
        accountId: account.id,
        phoneNumber: account.phone_number,
        platform: 'mtn_momo',
        status: isAuthError ? 'auth_error' : 'failed',
        transactionsSynced: 0,
        totalProcessed: 0,
        error: errorMessage,
        duration
      };
    }
  }

  /**
   * Fetch transactions from MTN MoMo API
   */
  private async fetchMtnMomoTransactions(
    phoneNumber: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    try {
      console.log(`Fetching MTN MoMo transactions for ${phoneNumber} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

      const transactions = await this.mtnClient.getTransactions(
        phoneNumber,
        startDate.toISOString(),
        endDate.toISOString()
      );

      console.log(`Fetched ${transactions.length} transactions from MTN MoMo API`);
      return transactions || [];

    } catch (error) {
      console.error('Error fetching MTN MoMo transactions:', error);
      throw error;
    }
  }

  /**
   * Process transactions and store in database with deduplication and categorization
   */
  private async processTransactions(
    account: MtnMomoAccount,
    mtnTransactions: any[]
  ): Promise<{ newTransactions: number; totalTransactions: number }> {
    let newTransactions = 0;
    const totalTransactions = mtnTransactions.length;

    for (const mtnTransaction of mtnTransactions) {
      try {
        // Check if transaction already exists (deduplication using multiple identifiers)
        const { data: existingTransaction } = await this.supabaseClient
          .from('transactions')
          .select('id')
          .eq('user_id', account.user_id)
          .or(`momo_external_id.eq.${mtnTransaction.externalId},mtn_reference_id.eq.${mtnTransaction.externalId},momo_reference_id.eq.${mtnTransaction.externalId}`)
          .single();

        if (existingTransaction) {
          console.log(`MTN MoMo transaction ${mtnTransaction.externalId} already exists, skipping`);
          continue;
        }

        // Apply categorization for MTN MoMo transaction patterns
        const categoryResult = await this.categorizeTransaction(
          account.user_id,
          mtnTransaction.payerMessage || mtnTransaction.payeeNote || 'MTN MoMo transaction',
          Math.abs(parseFloat(mtnTransaction.amount)),
          mtnTransaction.payer?.name || mtnTransaction.payee?.name
        );

        // Determine transaction type based on amount sign or context
        const amount = parseFloat(mtnTransaction.amount);
        const transactionType = amount >= 0 ? 'income' : 'expense';

        // Prepare transaction data for insertion
        const transactionData = {
          user_id: account.user_id,
          account_id: account.id,
          category_id: categoryResult.categoryId,
          amount: Math.abs(amount),
          type: transactionType,
          description: mtnTransaction.payerMessage || mtnTransaction.payeeNote || 'MTN MoMo transaction',
          transaction_date: mtnTransaction.createdAt || new Date().toISOString(),
          merchant_name: mtnTransaction.payer?.name || mtnTransaction.payee?.name || null,
          
          // MTN MoMo-specific fields
          momo_external_id: mtnTransaction.externalId,
          mtn_reference_id: mtnTransaction.externalId,
          momo_reference_id: mtnTransaction.externalId,
          momo_transaction_id: mtnTransaction.financialTransactionId,
          momo_status: mtnTransaction.status,
          momo_payer_info: mtnTransaction.payer,
          momo_payee_info: mtnTransaction.payee,
          momo_financial_transaction_id: mtnTransaction.financialTransactionId,
          
          // Sync and categorization metadata
          is_synced: true,
          platform_source: 'mtn_momo',
          auto_categorized: categoryResult.isAutoCategorized,
          categorization_confidence: categoryResult.confidence,
          
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Insert transaction
        const { error: insertError } = await this.supabaseClient
          .from('transactions')
          .insert(transactionData);

        if (insertError) {
          console.error(`Failed to insert MTN MoMo transaction ${mtnTransaction.externalId}:`, insertError);
          continue;
        }

        newTransactions++;
        console.log(`Inserted new MTN MoMo transaction: ${mtnTransaction.externalId}`);

      } catch (error) {
        console.error(`Error processing MTN MoMo transaction ${mtnTransaction.externalId}:`, error);
        continue; // Continue with next transaction
      }
    }

    return { newTransactions, totalTransactions };
  }

  /**
   * Apply categorization to MTN MoMo transaction with mobile money patterns
   */
  private async categorizeTransaction(
    userId: string,
    description: string,
    amount: number,
    merchantName?: string
  ): Promise<{
    categoryId: string;
    isAutoCategorized: boolean;
    confidence: number;
  }> {
    try {
      // Import categorization service
      const { transactionCategorizer } = await import('./transaction-categorizer.ts');
      
      // Apply mobile money specific categorization rules
      const categorization = transactionCategorizer.categorizeTransaction(
        description,
        amount,
        'mobile_money', // Specify account type for mobile money patterns
        merchantName
      );

      // Find matching category in database
      const { data: categories } = await this.supabaseClient
        .from('categories')
        .select('id, name')
        .or(`user_id.is.null,user_id.eq.${userId}`)
        .ilike('name', `%${categorization.category_id.replace('_', ' ')}%`);

      let categoryId = null;
      
      if (categories && categories.length > 0) {
        // Use the first matching category
        categoryId = categories[0].id;
      } else {
        // Fallback to "Uncategorized"
        const { data: uncategorized } = await this.supabaseClient
          .from('categories')
          .select('id')
          .eq('name', 'Uncategorized')
          .is('user_id', null)
          .single();
        
        categoryId = uncategorized?.id || null;
      }

      return {
        categoryId,
        isAutoCategorized: true,
        confidence: categorization.confidence || 0.6 // Slightly higher confidence for mobile money patterns
      };

    } catch (error) {
      console.error('Error categorizing MTN MoMo transaction:', error);
      
      // Fallback to uncategorized
      const { data: uncategorized } = await this.supabaseClient
        .from('categories')
        .select('id')
        .eq('name', 'Uncategorized')
        .is('user_id', null)
        .single();
      
      return {
        categoryId: uncategorized?.id || null,
        isAutoCategorized: false,
        confidence: 0
      };
    }
  }

  /**
   * Update account sync status using the dual platform function
   */
  private async updateSyncStatus(
    accountId: string,
    status: string,
    transactionsSynced: number = 0,
    errorMessage?: string
  ): Promise<void> {
    try {
      await this.supabaseClient.rpc('update_dual_platform_sync_status', {
        account_id: accountId,
        platform: 'mtn_momo',
        new_status: status,
        transactions_synced: transactionsSynced,
        error_message: errorMessage || null,
        platform_error: errorMessage || null
      });
    } catch (error) {
      console.error(`Failed to update MTN MoMo sync status for account ${accountId}:`, error);
    }
  }

  /**
   * Check if error is authentication-related
   */
  private isAuthenticationError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorString = JSON.stringify(error).toLowerCase();
    
    return errorMessage.includes('401') || 
           errorMessage.includes('403') || 
           errorMessage.includes('unauthorized') ||
           errorMessage.includes('authentication') ||
           errorMessage.includes('auth') ||
           errorMessage.includes('invalid_token') ||
           errorMessage.includes('expired_token') ||
           errorMessage.includes('invalid_key') ||
           errorString.includes('access_denied') ||
           errorString.includes('invalid_credentials');
  }

  /**
   * Validate MTN MoMo account connection
   */
  async validateAccount(phoneNumber: string): Promise<boolean> {
    try {
      if (!this.mtnClient) {
        return false;
      }

      // Try to fetch account info or recent transactions to validate connection
      const result = await this.mtnClient.getAccountInfo(phoneNumber);
      return !!result;
      
    } catch (error) {
      console.error('MTN MoMo account validation failed:', error);
      return false;
    }
  }

  /**
   * Get account balance from MTN MoMo API
   */
  async getAccountBalance(phoneNumber: string): Promise<number | null> {
    try {
      if (!this.mtnClient) {
        return null;
      }

      const accountInfo = await this.mtnClient.getAccountInfo(phoneNumber);
      return accountInfo?.balance ? parseFloat(accountInfo.balance) : null;
      
    } catch (error) {
      console.error('Failed to get MTN MoMo account balance:', error);
      return null;
    }
  }
}