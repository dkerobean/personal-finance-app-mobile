-- Migration: Add background sync cron job and required database updates
-- File: add_background_sync_cron.sql

-- ============================================================================
-- UPDATE ACCOUNTS TABLE FOR SYNC TRACKING
-- ============================================================================

-- Add sync-related fields to momo_account_links table if they don't exist
DO $$ 
BEGIN 
    -- Add last_sync_attempt field if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'momo_account_links' 
        AND column_name = 'last_sync_attempt'
    ) THEN
        ALTER TABLE public.momo_account_links ADD COLUMN last_sync_attempt TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add sync_status field if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'momo_account_links' 
        AND column_name = 'sync_status'
    ) THEN
        ALTER TABLE public.momo_account_links ADD COLUMN sync_status VARCHAR(20) DEFAULT 'active';
    END IF;
END $$;

-- Create index for sync status queries
CREATE INDEX IF NOT EXISTS idx_momo_account_links_sync_status ON public.momo_account_links(sync_status);
CREATE INDEX IF NOT EXISTS idx_momo_account_links_last_sync_attempt ON public.momo_account_links(last_sync_attempt);

-- ============================================================================
-- UPDATE TRANSACTION_SYNC_LOG TABLE
-- ============================================================================

-- Add sync_type column if using custom values
DO $$ 
BEGIN 
    -- Update sync_type to include 'background' if not already present
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_sync_log' 
        AND column_name = 'sync_type'
    ) THEN
        -- No constraint to update, it's already VARCHAR(20)
        NULL;
    END IF;
END $$;

-- ============================================================================
-- CRON JOB CONFIGURATION
-- ============================================================================

-- Enable the pg_cron extension if not already enabled
-- Note: This requires superuser privileges and may need to be run manually
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to trigger background sync
CREATE OR REPLACE FUNCTION trigger_background_sync()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log the cron job execution
  INSERT INTO public.transaction_sync_log (
    user_id,
    momo_account_id,
    sync_type,
    sync_status,
    transactions_synced,
    sync_started_at,
    created_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid, -- System user ID for cron jobs
    '00000000-0000-0000-0000-000000000000'::uuid, -- System account ID for cron jobs
    'background_cron',
    'in_progress',
    0,
    NOW(),
    NOW()
  );

  -- Trigger the background sync Edge Function
  -- Note: This is a placeholder - actual HTTP request would be made by external scheduler
  RAISE NOTICE 'Background sync cron job triggered at %', NOW();
END;
$$;

-- ============================================================================
-- BACKGROUND SYNC CONFIGURATION TABLE
-- ============================================================================

-- Create table to store sync configuration
CREATE TABLE IF NOT EXISTS public.background_sync_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_frequency_hours INTEGER DEFAULT 24,
    max_concurrent_accounts INTEGER DEFAULT 5,
    enabled BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO public.background_sync_config (sync_frequency_hours, max_concurrent_accounts, enabled)
VALUES (24, 5, true)
ON CONFLICT DO NOTHING;

-- Enable RLS on background_sync_config
ALTER TABLE public.background_sync_config ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access
CREATE POLICY "Service role can manage sync config" 
ON public.background_sync_config 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS FOR SYNC MANAGEMENT
-- ============================================================================

-- Function to get accounts that need syncing
CREATE OR REPLACE FUNCTION get_accounts_needing_sync(hours_threshold INTEGER DEFAULT 24)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    phone_number VARCHAR(20),
    account_name VARCHAR(100),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20)
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        mal.id,
        mal.user_id,
        mal.phone_number,
        mal.account_name,
        mal.last_sync_at,
        mal.sync_status
    FROM public.momo_account_links mal
    WHERE mal.is_active = true
    AND (
        mal.last_sync_at IS NULL 
        OR mal.last_sync_at < NOW() - INTERVAL '1 hour' * hours_threshold
    )
    AND (mal.sync_status IS NULL OR mal.sync_status IN ('active', 'error'))
    ORDER BY mal.last_sync_at ASC NULLS FIRST;
$$;

-- Function to update next sync time
CREATE OR REPLACE FUNCTION update_next_sync_time()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    config_row RECORD;
BEGIN
    -- Get current config
    SELECT * INTO config_row 
    FROM public.background_sync_config 
    WHERE enabled = true 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF FOUND THEN
        -- Update last run and calculate next run
        UPDATE public.background_sync_config
        SET 
            last_run_at = NOW(),
            next_run_at = NOW() + INTERVAL '1 hour' * config_row.sync_frequency_hours,
            updated_at = NOW()
        WHERE id = config_row.id;
    END IF;
END;
$$;

-- ============================================================================
-- ADDITIONAL DATABASE OPTIMIZATIONS
-- ============================================================================

-- Add optimized indexes for background sync queries
CREATE INDEX IF NOT EXISTS idx_transactions_sync_log_id ON public.transactions(sync_log_id);
CREATE INDEX IF NOT EXISTS idx_transactions_is_synced ON public.transactions(is_synced);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_momo_account_links_last_sync ON public.momo_account_links(last_sync_at, sync_status);

-- Composite index for efficient sync queries
CREATE INDEX IF NOT EXISTS idx_momo_account_links_sync_query 
ON public.momo_account_links(is_active, sync_status, last_sync_at) 
WHERE is_active = true;

-- Index for transaction deduplication
CREATE INDEX IF NOT EXISTS idx_transactions_momo_dedup 
ON public.transactions(momo_external_id, user_id) 
WHERE momo_external_id IS NOT NULL;

-- Index for sync log queries
CREATE INDEX IF NOT EXISTS idx_transaction_sync_log_account_status 
ON public.transaction_sync_log(momo_account_id, sync_status, created_at DESC);

-- ============================================================================
-- SYNC STATUS MANAGEMENT
-- ============================================================================

-- Function to mark account sync status
CREATE OR REPLACE FUNCTION update_account_sync_status(
    account_id UUID,
    new_status VARCHAR(20),
    error_message TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.momo_account_links
    SET 
        sync_status = new_status,
        last_sync_attempt = NOW(),
        updated_at = NOW()
    WHERE id = account_id;
    
    -- If there's an error, log it
    IF error_message IS NOT NULL THEN
        INSERT INTO public.transaction_sync_log (
            user_id,
            momo_account_id,
            sync_type,
            sync_status,
            transactions_synced,
            error_message,
            sync_started_at,
            sync_completed_at,
            created_at
        ) 
        SELECT 
            user_id,
            account_id,
            'background_error',
            'failed',
            0,
            error_message,
            NOW(),
            NOW(),
            NOW()
        FROM public.momo_account_links
        WHERE id = account_id;
    END IF;
END;
$$;