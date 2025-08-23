import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../shared/cors.ts'
import { mtnClient } from '../shared/mtn-client.ts'
import { monoClient } from '../shared/mono-client.ts'

interface SyncRequest {
  accountId: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

interface SyncResponse {
  success: boolean;
  data?: {
    totalTransactions: number;
    newTransactions: number;
    updatedTransactions: number;
    accountType: 'bank' | 'mobile_money';
    institutionName: string;
    errors: string[];
  };
  error?: {
    code: string;
    message: string;
  };
}

interface Account {
  id: string;
  user_id: string;
  account_name: string;
  account_type: 'bank' | 'mobile_money';
  institution_name: string;
  balance: number;
  mono_account_id?: string;
  mtn_reference_id?: string;
  mtn_phone_number?: string;
  is_active: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ 
          error: { 
            code: 'METHOD_NOT_ALLOWED', 
            message: 'Only POST requests are allowed' 
          } 
        }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          error: { 
            code: 'UNAUTHORIZED', 
            message: 'Missing authorization header' 
          } 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ 
          error: { 
            code: 'UNAUTHORIZED', 
            message: 'Invalid or expired token' 
          } 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const requestBody: SyncRequest = await req.json();
    const { accountId, dateRange } = requestBody;

    if (!accountId) {
      return new Response(
        JSON.stringify({ 
          error: { 
            code: 'INVALID_REQUEST', 
            message: 'Account ID is required' 
          } 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get account from unified accounts table
    const { data: account, error: accountError } = await supabaseClient
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (accountError || !account) {
      return new Response(
        JSON.stringify({ 
          error: { 
            code: 'ACCOUNT_NOT_FOUND', 
            message: 'Account not found or does not belong to you' 
          } 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const typedAccount = account as Account;

    // Calculate date range (default to last 30 days)
    const endDate = dateRange?.endDate ? new Date(dateRange.endDate) : new Date();
    const startDate = dateRange?.startDate 
      ? new Date(dateRange.startDate) 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    // Create sync log entry
    const { data: syncLog, error: syncLogError } = await supabaseClient
      .from('transaction_sync_log')
      .insert({
        user_id: user.id,
        account_id: accountId,
        sync_type: 'api_triggered',
        sync_status: 'in_progress',
        transactions_synced: 0,
        account_type: typedAccount.account_type,
      })
      .select('id')
      .single();

    if (syncLogError) {
      console.error('Failed to create sync log:', syncLogError);
    }

    const syncLogId = syncLog?.id;

    try {
      let totalTransactions = 0;
      let newTransactions = 0;
      let updatedTransactions = 0;
      const errors: string[] = [];

      // Route to appropriate platform client based on account type
      if (typedAccount.account_type === 'bank') {
        // Handle Mono bank account sync
        if (!typedAccount.mono_account_id) {
          throw new Error('Bank account is missing Mono Account ID');
        }

        console.log(`Syncing bank account via Mono: ${typedAccount.mono_account_id}`);
        
        // Get account and transactions from Mono
        const monoData = await monoClient.getAccountSyncData(
          typedAccount.mono_account_id,
          startDate.toISOString(),
          endDate.toISOString()
        );

        // Update account balance
        await supabaseClient
          .from('accounts')
          .update({ 
            balance: monoData.account.balance,
            last_synced_at: new Date().toISOString(),
          })
          .eq('id', accountId);

        // Process each transaction
        for (const monoTransaction of monoData.transactions) {
          try {
            // Check if transaction already exists
            const { data: existingTransaction } = await supabaseClient
              .from('transactions')
              .select('id')
              .eq('mono_transaction_id', monoTransaction.id)
              .eq('user_id', user.id)
              .single();

            // Import categorization logic
            const { transactionCategorizer } = await import('../shared/transaction-categorizer.ts');
            
            const categorization = transactionCategorizer.categorizeTransaction(
              monoTransaction.description,
              monoTransaction.amount,
              '',
              ''
            );
            
            // Get or create the categorized category
            let categoryId = null;
            const categoryName = categorization.category_id.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            
            const { data: existingCategory } = await supabaseClient
              .from('categories')
              .select('id')
              .or(`user_id.eq.${user.id},user_id.is.null`)
              .ilike('name', `%${categoryName}%`)
              .single();

            if (existingCategory) {
              categoryId = existingCategory.id;
            } else {
              // Create new category if it doesn't exist
              const iconMap: Record<string, string> = {
                'Food Dining': 'restaurant',
                'Transportation': 'car',
                'Utilities': 'lightbulb',
                'Shopping': 'shopping-bag',
                'Healthcare': 'heart',
                'Education': 'book',
                'Entertainment': 'play',
                'Transfer Sent': 'send',
                'Transfer Received': 'download',
                'Salary': 'briefcase',
                'Business Income': 'trending-up',
                'Investment Income': 'pie-chart',
                'Freelance': 'user',
                'Subscription': 'repeat',
                'Banking Fees': 'credit-card',
              };
              
              const { data: newCategory } = await supabaseClient
                .from('categories')
                .insert({
                  user_id: user.id,
                  name: categoryName,
                  icon_name: iconMap[categoryName] || 'circle',
                })
                .select('id')
                .single();
              categoryId = newCategory?.id;
            }

            // Map Mono transaction to internal format
            const transactionData = {
              user_id: user.id,
              account_id: accountId,
              category_id: categoryId,
              amount: monoTransaction.amount,
              type: monoTransaction.type,
              description: monoTransaction.description,
              transaction_date: monoTransaction.date,
              mono_transaction_id: monoTransaction.id,
              institution_name: typedAccount.institution_name,
              is_synced: true,
              auto_categorized: true,
              categorization_confidence: categorization.confidence / 100,
              sync_log_id: syncLogId,
            };

            if (existingTransaction) {
              // Update existing transaction
              const { error: updateError } = await supabaseClient
                .from('transactions')
                .update({
                  ...transactionData,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingTransaction.id);

              if (updateError) {
                throw updateError;
              }
              updatedTransactions++;
            } else {
              // Create new transaction
              const { error: insertError } = await supabaseClient
                .from('transactions')
                .insert(transactionData);

              if (insertError) {
                throw insertError;
              }
              newTransactions++;
            }

            totalTransactions++;
          } catch (transactionError) {
            const errorMessage = transactionError instanceof Error 
              ? transactionError.message 
              : 'Unknown error processing transaction';
            errors.push(`Transaction ${monoTransaction.id}: ${errorMessage}`);
            console.error('Transaction processing error:', transactionError);
          }
        }

      } else if (typedAccount.account_type === 'mobile_money') {
        // Handle MTN MoMo mobile money account sync
        if (!typedAccount.mtn_phone_number) {
          throw new Error('Mobile money account is missing phone number');
        }

        console.log(`Syncing MTN MoMo account: ${typedAccount.mtn_phone_number}`);
        
        // Initialize MTN MoMo client
        await mtnClient.initialize();

        // Fetch transactions from MTN MoMo API
        const transactions = await mtnClient.getTransactions(
          typedAccount.mtn_phone_number,
          startDate.toISOString(),
          endDate.toISOString()
        );

        // Process each transaction (similar to existing logic but updated for consistency)
        for (const mtnTransaction of transactions) {
          try {
            // Check if transaction already exists
            const { data: existingTransaction } = await supabaseClient
              .from('transactions')
              .select('id')
              .eq('mtn_reference_id', mtnTransaction.externalId)
              .eq('user_id', user.id)
              .single();

            // Import categorization logic
            const { transactionCategorizer } = await import('../shared/transaction-categorizer.ts');
            
            // Extract merchant name and categorize transaction
            const merchantName = transactionCategorizer.extractMerchantName(
              mtnTransaction.payerMessage || '',
              mtnTransaction.payeeNote
            );
            
            const amount = parseFloat(mtnTransaction.amount);
            const categorization = transactionCategorizer.categorizeTransaction(
              (mtnTransaction.payerMessage || '') + ' ' + (mtnTransaction.payeeNote || ''),
              amount,
              mtnTransaction.payer,
              merchantName
            );
            
            // Get or create the categorized category
            let categoryId = null;
            const categoryName = categorization.category_id.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            
            const { data: existingCategory } = await supabaseClient
              .from('categories')
              .select('id')
              .or(`user_id.eq.${user.id},user_id.is.null`)
              .ilike('name', `%${categoryName}%`)
              .single();

            if (existingCategory) {
              categoryId = existingCategory.id;
            } else {
              // Create new category if it doesn't exist
              const iconMap: Record<string, string> = {
                'Food Dining': 'restaurant',
                'Transportation': 'car',
                'Utilities': 'lightbulb',
                'Shopping': 'shopping-bag',
                'Healthcare': 'heart',
                'Education': 'book',
                'Entertainment': 'play',
                'Transfer Sent': 'send',
                'Transfer Received': 'download',
                'Salary': 'briefcase',
                'Business Income': 'trending-up',
                'Investment Income': 'pie-chart',
                'Freelance': 'user',
                'Subscription': 'repeat',
                'Banking Fees': 'credit-card',
              };
              
              const { data: newCategory } = await supabaseClient
                .from('categories')
                .insert({
                  user_id: user.id,
                  name: categoryName,
                  icon_name: iconMap[categoryName] || 'circle',
                })
                .select('id')
                .single();
              categoryId = newCategory?.id;
            }

            // Map MTN MoMo transaction to internal format
            const transactionData = {
              user_id: user.id,
              account_id: accountId,
              category_id: categoryId,
              amount: amount,
              type: categorization.suggested_type,
              description: mtnTransaction.payerMessage || `MTN MoMo transaction`,
              transaction_date: mtnTransaction.createdAt || new Date().toISOString(),
              mtn_reference_id: mtnTransaction.externalId,
              momo_status: mtnTransaction.status,
              momo_payer_info: mtnTransaction.payer,
              momo_financial_transaction_id: mtnTransaction.financialTransactionId,
              merchant_name: merchantName,
              institution_name: typedAccount.institution_name,
              is_synced: true,
              auto_categorized: true,
              categorization_confidence: categorization.confidence / 100,
              sync_log_id: syncLogId,
            };

            if (existingTransaction) {
              // Update existing transaction
              const { error: updateError } = await supabaseClient
                .from('transactions')
                .update({
                  ...transactionData,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingTransaction.id);

              if (updateError) {
                throw updateError;
              }
              updatedTransactions++;
            } else {
              // Create new transaction
              const { error: insertError } = await supabaseClient
                .from('transactions')
                .insert(transactionData);

              if (insertError) {
                throw insertError;
              }
              newTransactions++;
            }

            totalTransactions++;
          } catch (transactionError) {
            const errorMessage = transactionError instanceof Error 
              ? transactionError.message 
              : 'Unknown error processing transaction';
            errors.push(`Transaction ${mtnTransaction.externalId}: ${errorMessage}`);
            console.error('Transaction processing error:', transactionError);
          }
        }
      } else {
        throw new Error(`Unsupported account type: ${typedAccount.account_type}`);
      }

      // Update sync log with success
      if (syncLogId) {
        await supabaseClient
          .from('transaction_sync_log')
          .update({
            sync_status: 'success',
            transactions_synced: totalTransactions,
            sync_completed_at: new Date().toISOString(),
          })
          .eq('id', syncLogId);
      }

      const response: SyncResponse = {
        success: true,
        data: {
          totalTransactions,
          newTransactions,
          updatedTransactions,
          accountType: typedAccount.account_type,
          institutionName: typedAccount.institution_name,
          errors,
        },
      };

      return new Response(
        JSON.stringify(response),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } catch (syncError) {
      // Update sync log with failure
      if (syncLogId) {
        await supabaseClient
          .from('transaction_sync_log')
          .update({
            sync_status: 'failed',
            transactions_synced: 0,
            sync_completed_at: new Date().toISOString(),
            error_message: syncError instanceof Error ? syncError.message : 'Unknown sync error',
          })
          .eq('id', syncLogId);
      }

      throw syncError;
    }

  } catch (error) {
    console.error('Accounts sync error:', error);
    
    const response: SyncResponse = {
      success: false,
      error: {
        code: 'SYNC_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error during sync',
      },
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});