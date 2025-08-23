/**
 * Mono Sync Worker
 * Handles background synchronization for Mono-connected bank accounts
 */

interface MonoAccount {
  id: string;
  user_id: string;
  account_name: string;
  mono_account_id: string;
  last_synced_at: string | null;
  sync_status: string | null;
  consecutive_sync_failures: number;
}

interface MonoSyncResult {
  accountId: string;
  monoAccountId: string;
  platform: 'mono';
  status: 'success' | 'failed' | 'auth_error';
  transactionsSynced: number;
  totalProcessed: number;
  error?: string;
  duration: number;
}

export class MonoSyncWorker {
  private supabaseClient: any;
  private monoBaseUrl: string;
  private monoSecretKey: string;

  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
    this.monoBaseUrl = Deno.env.get('MONO_BASE_URL') || 'https://api.withmono.com';
    this.monoSecretKey = Deno.env.get('MONO_SECRET_KEY') || '';
  }

  /**
   * Sync a single Mono bank account
   */
  async syncAccount(account: MonoAccount): Promise<MonoSyncResult> {
    const startTime = Date.now();
    
    try {
      console.log(`Starting Mono sync for account ${account.id} (${account.mono_account_id})`);

      // Update account status to in_progress
      await this.updateSyncStatus(account.id, 'in_progress');

      // Calculate date range for incremental sync
      const endDate = new Date();
      const startDate = account.last_synced_at 
        ? new Date(account.last_synced_at)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days

      // Fetch transactions from Mono API
      const transactions = await this.fetchMonoTransactions(
        account.mono_account_id,
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
        monoAccountId: account.mono_account_id,
        platform: 'mono',
        status: 'success',
        transactionsSynced: syncResult.newTransactions,
        totalProcessed: syncResult.totalTransactions,
        duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`Mono sync failed for account ${account.id}:`, error);

      // Determine error type for proper status update
      const isAuthError = this.isAuthenticationError(error);
      const status = isAuthError ? 'auth_required' : 'error';
      
      await this.updateSyncStatus(account.id, status, 0, errorMessage);

      return {
        accountId: account.id,
        monoAccountId: account.mono_account_id,
        platform: 'mono',
        status: isAuthError ? 'auth_error' : 'failed',
        transactionsSynced: 0,
        totalProcessed: 0,
        error: errorMessage,
        duration
      };
    }
  }

  /**
   * Fetch transactions from Mono API
   */
  private async fetchMonoTransactions(
    monoAccountId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    try {
      const url = `${this.monoBaseUrl}/accounts/${monoAccountId}/transactions`;
      const params = new URLSearchParams({
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        paginate: 'false'
      });

      console.log(`Fetching Mono transactions: ${url}?${params}`);

      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.monoSecretKey}`,
          'mono-sec-key': this.monoSecretKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Mono API error (${response.status}):`, errorText);
        
        if (response.status === 401 || response.status === 403) {
          throw new Error(`Authentication failed: ${errorText}`);
        }
        
        throw new Error(`Mono API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const transactions = data.data || [];
      
      console.log(`Fetched ${transactions.length} transactions from Mono API`);
      return transactions;

    } catch (error) {
      console.error('Error fetching Mono transactions:', error);
      throw error;
    }
  }

  /**
   * Process transactions and store in database with deduplication and categorization
   */
  private async processTransactions(
    account: MonoAccount,
    monoTransactions: any[]
  ): Promise<{ newTransactions: number; totalTransactions: number }> {
    let newTransactions = 0;
    const totalTransactions = monoTransactions.length;

    for (const monoTransaction of monoTransactions) {
      try {
        // Check if transaction already exists (deduplication)
        const { data: existingTransaction } = await this.supabaseClient
          .from('transactions')
          .select('id')
          .eq('mono_transaction_id', monoTransaction._id)
          .eq('user_id', account.user_id)
          .single();

        if (existingTransaction) {
          console.log(`Transaction ${monoTransaction._id} already exists, skipping`);
          continue;
        }

        // Apply categorization using the transaction categorizer
        const categoryResult = await this.categorizeTransaction(
          account.user_id,
          monoTransaction.narration || monoTransaction.description || '',
          Math.abs(parseFloat(monoTransaction.amount)),
          monoTransaction.meta?.merchant || undefined
        );

        // Prepare transaction data for insertion
        const transactionData = {
          user_id: account.user_id,
          account_id: account.id,
          category_id: categoryResult.categoryId,
          amount: Math.abs(parseFloat(monoTransaction.amount)),
          type: parseFloat(monoTransaction.amount) >= 0 ? 'income' : 'expense',
          description: monoTransaction.narration || monoTransaction.description || 'Bank transaction',
          transaction_date: monoTransaction.date || new Date().toISOString(),
          merchant_name: monoTransaction.meta?.merchant || null,
          
          // Mono-specific fields
          mono_transaction_id: monoTransaction._id,
          mono_account_id: account.mono_account_id,
          mono_category: monoTransaction.category,
          mono_balance: parseFloat(monoTransaction.balance || '0'),
          
          // Sync and categorization metadata
          is_synced: true,
          platform_source: 'mono',
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
          console.error(`Failed to insert transaction ${monoTransaction._id}:`, insertError);
          continue;
        }

        newTransactions++;
        console.log(`Inserted new Mono transaction: ${monoTransaction._id}`);

      } catch (error) {
        console.error(`Error processing Mono transaction ${monoTransaction._id}:`, error);
        continue; // Continue with next transaction
      }
    }

    return { newTransactions, totalTransactions };
  }

  /**
   * Apply categorization to transaction
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
      
      // Apply categorization rules
      const categorization = transactionCategorizer.categorizeTransaction(
        description,
        amount,
        undefined,
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
        confidence: categorization.confidence || 0.5
      };

    } catch (error) {
      console.error('Error categorizing Mono transaction:', error);
      
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
        platform: 'mono',
        new_status: status,
        transactions_synced: transactionsSynced,
        error_message: errorMessage || null,
        platform_error: errorMessage || null
      });
    } catch (error) {
      console.error(`Failed to update Mono sync status for account ${accountId}:`, error);
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
           errorString.includes('invalid_token') ||
           errorString.includes('expired_token');
  }

  /**
   * Validate Mono account connection
   */
  async validateAccount(monoAccountId: string): Promise<boolean> {
    try {
      const url = `${this.monoBaseUrl}/accounts/${monoAccountId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.monoSecretKey}`,
          'mono-sec-key': this.monoSecretKey,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Mono account validation failed:', error);
      return false;
    }
  }
}