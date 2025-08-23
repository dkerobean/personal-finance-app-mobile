import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../shared/cors.ts'
import { SyncOrchestrator } from '../shared/sync-orchestrator.ts'

interface BackgroundSyncRequest {
  forceSync?: boolean;
  maxConcurrentAccounts?: number;
}

interface AccountSyncResult {
  accountId: string;
  phoneNumber?: string;
  platform: 'mono' | 'mtn_momo';
  accountName: string;
  status: 'success' | 'failed' | 'auth_error';
  transactionsSynced: number;
  totalProcessed: number;
  error?: string;
  duration: number;
}

interface BackgroundSyncResponse {
  success: boolean;
  accountsProcessed: number;
  totalTransactionsSynced: number;
  results: AccountSyncResult[];
  startTime: string;
  endTime: string;
  duration: number;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = new Date();
  const results: AccountSyncResult[] = [];

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Only POST requests are allowed'
        }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify service account authentication
    const authHeader = req.headers.get('Authorization');
    const cronSecret = req.headers.get('X-Cron-Secret');
    
    // Allow either service account auth OR cron secret for scheduled jobs
    if (!authHeader && !cronSecret) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing authorization header or cron secret'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client with service role key for background operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role for background sync
      {
        global: {
          headers: authHeader ? { Authorization: authHeader } : {},
        },
      }
    );

    // Parse request body
    const requestBody: BackgroundSyncRequest = await req.json().catch(() => ({}));
    const { forceSync = false, maxConcurrentAccounts = 5 } = requestBody;

    console.log(`Starting background sync - forceSync: ${forceSync}, maxConcurrent: ${maxConcurrentAccounts}`);

    // Check sync configuration
    const { data: syncConfig } = await supabaseClient
      .from('background_sync_config')
      .select('*')
      .eq('enabled', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!syncConfig && !forceSync) {
      console.log('Background sync is disabled');
      const endTime = new Date();
      const response: BackgroundSyncResponse = {
        success: true,
        accountsProcessed: 0,
        totalTransactionsSynced: 0,
        results: [],
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: endTime.getTime() - startTime.getTime(),
      };

      return new Response(
        JSON.stringify(response),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Use configured max concurrent accounts if available, with platform-specific defaults
    const monoMaxConcurrent = syncConfig?.mono_max_concurrent || Math.floor(maxConcurrentAccounts * 0.6);
    const mtnMaxConcurrent = syncConfig?.mtn_max_concurrent || Math.floor(maxConcurrentAccounts * 0.4);
    
    console.log(`Platform limits - Mono: ${monoMaxConcurrent}, MTN MoMo: ${mtnMaxConcurrent}`);

    // Initialize SyncOrchestrator with dual platform limits
    const syncOrchestrator = new SyncOrchestrator(supabaseClient, {
      mono: monoMaxConcurrent,
      mtn_momo: mtnMaxConcurrent
    });

    // Load accounts for syncing using dual platform function
    await syncOrchestrator.loadAccountsForDualPlatformSync(
      forceSync,
      syncConfig?.mono_sync_frequency_hours || 6,
      syncConfig?.mtn_sync_frequency_hours || 4
    );

    if (syncOrchestrator.getTotalQueueLength() === 0) {
      console.log('No accounts found for background sync');
      const endTime = new Date();
      const response: BackgroundSyncResponse = {
        success: true,
        accountsProcessed: 0,
        totalTransactionsSynced: 0,
        results: [],
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: endTime.getTime() - startTime.getTime(),
      };

      return new Response(
        JSON.stringify(response),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Found ${syncOrchestrator.getTotalQueueLength()} accounts to sync (Mono: ${syncOrchestrator.getMonoQueueLength()}, MTN MoMo: ${syncOrchestrator.getMtnMomoQueueLength()})`);

    // Process the dual platform sync queue
    const metrics = await syncOrchestrator.processDualPlatformQueue();

    // Update sync configuration with last run time
    if (syncConfig) {
      await supabaseClient
        .from('background_sync_config')
        .update({
          last_run_at: new Date().toISOString(),
          next_run_at: new Date(Date.now() + (syncConfig.sync_frequency_hours * 60 * 60 * 1000)).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', syncConfig.id);
    }

    // Convert metrics to response format with platform-specific results
    const syncResults: AccountSyncResult[] = [...metrics.monoResults, ...metrics.mtnMomoResults];

    const endTime = new Date();
    const response: BackgroundSyncResponse = {
      success: true,
      accountsProcessed: metrics.totalAccounts,
      totalTransactionsSynced: metrics.totalTransactionsSynced,
      results: syncResults,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: endTime.getTime() - startTime.getTime(),
    };

    console.log(`Background sync completed: ${metrics.totalAccounts} accounts processed, ${metrics.totalTransactionsSynced} transactions synced`);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Background sync error:', error);
    
    const endTime = new Date();
    const response: BackgroundSyncResponse = {
      success: false,
      accountsProcessed: 0,
      totalTransactionsSynced: 0,
      results: [],
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: endTime.getTime() - startTime.getTime(),
      error: error instanceof Error ? error.message : 'Unknown error during background sync',
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