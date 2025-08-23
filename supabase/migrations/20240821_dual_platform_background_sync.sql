-- Migration: Dual Platform Background Sync Support
-- File: 20240821_dual_platform_background_sync.sql
-- Enhances existing background sync to support both Mono and MTN MoMo platforms

-- ============================================================================
-- EXTEND ACCOUNTS TABLE FOR DUAL PLATFORM SYNC
-- ============================================================================

-- Add sync fields to main accounts table for unified management
DO $$ 
BEGIN 
    -- Add platform_source field if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accounts' 
        AND column_name = 'platform_source'
    ) THEN
        ALTER TABLE public.accounts ADD COLUMN platform_source VARCHAR(20) DEFAULT 'manual';
    END IF;

    -- Add last_sync_attempt field if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accounts' 
        AND column_name = 'last_sync_attempt'
    ) THEN
        ALTER TABLE public.accounts ADD COLUMN last_sync_attempt TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add sync_status field if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accounts' 
        AND column_name = 'sync_status'
    ) THEN
        ALTER TABLE public.accounts ADD COLUMN sync_status VARCHAR(20) DEFAULT 'active';
    END IF;

    -- Add sync_error_message field if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accounts' 
        AND column_name = 'sync_error_message'
    ) THEN
        ALTER TABLE public.accounts ADD COLUMN sync_error_message TEXT;
    END IF;

    -- Add consecutive_failures field for exponential backoff
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accounts' 
        AND column_name = 'consecutive_sync_failures'
    ) THEN
        ALTER TABLE public.accounts ADD COLUMN consecutive_sync_failures INTEGER DEFAULT 0;
    END IF;
END $$;

-- Update platform_source based on existing account data
UPDATE public.accounts 
SET platform_source = CASE 
    WHEN mono_account_id IS NOT NULL THEN 'mono'
    WHEN mtn_reference_id IS NOT NULL THEN 'mtn_momo'
    ELSE 'manual'
END
WHERE platform_source = 'manual' OR platform_source IS NULL;

-- ============================================================================
-- ENHANCE TRANSACTION_SYNC_LOG FOR DUAL PLATFORM TRACKING
-- ============================================================================

DO $$ 
BEGIN 
    -- Add platform_source to sync log if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_sync_log' 
        AND column_name = 'platform_source'
    ) THEN
        ALTER TABLE public.transaction_sync_log ADD COLUMN platform_source VARCHAR(20) DEFAULT 'mtn_momo';
    END IF;

    -- Add account_id for unified tracking
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_sync_log' 
        AND column_name = 'account_id'
    ) THEN
        ALTER TABLE public.transaction_sync_log ADD COLUMN account_id UUID;
    END IF;

    -- Add retry_count for exponential backoff tracking
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_sync_log' 
        AND column_name = 'retry_count'
    ) THEN
        ALTER TABLE public.transaction_sync_log ADD COLUMN retry_count INTEGER DEFAULT 0;
    END IF;

    -- Add platform_specific_error for debugging
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_sync_log' 
        AND column_name = 'platform_specific_error'
    ) THEN
        ALTER TABLE public.transaction_sync_log ADD COLUMN platform_specific_error TEXT;
    END IF;
END $$;

-- ============================================================================
-- DUAL PLATFORM BACKGROUND SYNC CONFIGURATION
-- ============================================================================

-- Enhance background sync config for platform-specific settings
DO $$ 
BEGIN 
    -- Add platform-specific fields
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'background_sync_config' 
        AND column_name = 'mono_sync_enabled'
    ) THEN
        ALTER TABLE public.background_sync_config ADD COLUMN mono_sync_enabled BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'background_sync_config' 
        AND column_name = 'mtn_momo_sync_enabled'
    ) THEN
        ALTER TABLE public.background_sync_config ADD COLUMN mtn_momo_sync_enabled BOOLEAN DEFAULT true;
    END IF;

    -- Platform-specific frequency settings
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'background_sync_config' 
        AND column_name = 'mono_sync_frequency_hours'
    ) THEN
        ALTER TABLE public.background_sync_config ADD COLUMN mono_sync_frequency_hours INTEGER DEFAULT 6;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'background_sync_config' 
        AND column_name = 'mtn_momo_sync_frequency_hours'
    ) THEN
        ALTER TABLE public.background_sync_config ADD COLUMN mtn_momo_sync_frequency_hours INTEGER DEFAULT 4;
    END IF;

    -- Platform-specific concurrency limits
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'background_sync_config' 
        AND column_name = 'max_concurrent_mono_accounts'
    ) THEN
        ALTER TABLE public.background_sync_config ADD COLUMN max_concurrent_mono_accounts INTEGER DEFAULT 3;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'background_sync_config' 
        AND column_name = 'max_concurrent_mtn_momo_accounts'
    ) THEN
        ALTER TABLE public.background_sync_config ADD COLUMN max_concurrent_mtn_momo_accounts INTEGER DEFAULT 5;
    END IF;
END $$;

-- Update existing config with platform-specific settings
UPDATE public.background_sync_config
SET 
    mono_sync_enabled = true,
    mtn_momo_sync_enabled = true,
    mono_sync_frequency_hours = 6,
    mtn_momo_sync_frequency_hours = 4,
    max_concurrent_mono_accounts = 3,
    max_concurrent_mtn_momo_accounts = 5
WHERE mono_sync_enabled IS NULL;

-- ============================================================================
-- NOTIFICATION TRACKING TABLE
-- ============================================================================

-- Create table for tracking platform-specific notifications
CREATE TABLE IF NOT EXISTS public.sync_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    platform_source VARCHAR(20) NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- 'auth_failure', 'sync_error', 'reauth_required'
    notification_title VARCHAR(200) NOT NULL,
    notification_body TEXT NOT NULL,
    deep_link_url TEXT,
    onesignal_id VARCHAR(100), -- OneSignal notification ID
    delivery_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'delivered'
    delivery_attempts INTEGER DEFAULT 0,
    last_delivery_attempt TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on sync_notifications
ALTER TABLE public.sync_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for sync_notifications
CREATE POLICY "Users can read their own sync notifications" 
ON public.sync_notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all sync notifications" 
ON public.sync_notifications FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- ============================================================================
-- DUAL PLATFORM SYNC PERFORMANCE INDEXES
-- ============================================================================

-- Indexes for accounts table dual platform queries
CREATE INDEX IF NOT EXISTS idx_accounts_platform_sync_status 
ON public.accounts(platform_source, sync_status, last_synced_at) 
WHERE platform_source IN ('mono', 'mtn_momo');

CREATE INDEX IF NOT EXISTS idx_accounts_sync_failures 
ON public.accounts(consecutive_sync_failures, last_sync_attempt) 
WHERE consecutive_sync_failures > 0;

-- Indexes for transaction_sync_log dual platform queries
CREATE INDEX IF NOT EXISTS idx_transaction_sync_log_platform 
ON public.transaction_sync_log(platform_source, sync_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transaction_sync_log_account_platform 
ON public.transaction_sync_log(account_id, platform_source, created_at DESC);

-- Indexes for sync_notifications
CREATE INDEX IF NOT EXISTS idx_sync_notifications_user_platform 
ON public.sync_notifications(user_id, platform_source, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_notifications_delivery_status 
ON public.sync_notifications(delivery_status, last_delivery_attempt) 
WHERE delivery_status IN ('pending', 'failed');

-- ============================================================================
-- DUAL PLATFORM HELPER FUNCTIONS
-- ============================================================================

-- Function to get accounts needing sync across both platforms
CREATE OR REPLACE FUNCTION get_dual_platform_accounts_needing_sync(
    mono_hours_threshold INTEGER DEFAULT 6,
    mtn_momo_hours_threshold INTEGER DEFAULT 4
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    account_name VARCHAR(255),
    account_type VARCHAR(20),
    platform_source VARCHAR(20),
    mono_account_id VARCHAR(255),
    mtn_reference_id VARCHAR(255),
    last_synced_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20),
    consecutive_sync_failures INTEGER
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        a.id,
        a.user_id,
        a.account_name,
        a.account_type,
        a.platform_source,
        a.mono_account_id,
        a.mtn_reference_id,
        a.last_synced_at,
        a.sync_status,
        a.consecutive_sync_failures
    FROM public.accounts a
    WHERE a.is_active = true
    AND a.platform_source IN ('mono', 'mtn_momo')
    AND (
        (a.platform_source = 'mono' AND (
            a.last_synced_at IS NULL 
            OR a.last_synced_at < NOW() - INTERVAL '1 hour' * mono_hours_threshold
        ))
        OR
        (a.platform_source = 'mtn_momo' AND (
            a.last_synced_at IS NULL 
            OR a.last_synced_at < NOW() - INTERVAL '1 hour' * mtn_momo_hours_threshold
        ))
    )
    AND (a.sync_status IS NULL OR a.sync_status IN ('active', 'error'))
    -- Apply exponential backoff for failed accounts
    AND (
        a.consecutive_sync_failures = 0 
        OR a.last_sync_attempt < NOW() - INTERVAL '1 minute' * POWER(2, LEAST(a.consecutive_sync_failures, 6))
    )
    ORDER BY 
        a.consecutive_sync_failures ASC, -- Prioritize accounts without failures
        a.last_synced_at ASC NULLS FIRST,
        a.platform_source; -- Group by platform for efficiency
$$;

-- Function to update account sync status with exponential backoff
CREATE OR REPLACE FUNCTION update_dual_platform_sync_status(
    account_id UUID,
    platform VARCHAR(20),
    new_status VARCHAR(20),
    transactions_synced INTEGER DEFAULT 0,
    error_message TEXT DEFAULT NULL,
    platform_error TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_uuid UUID;
    failure_count INTEGER;
BEGIN
    -- Get user_id and current failure count
    SELECT user_id, consecutive_sync_failures 
    INTO user_uuid, failure_count
    FROM public.accounts
    WHERE id = account_id;

    -- Update account sync status
    UPDATE public.accounts
    SET 
        sync_status = new_status,
        last_sync_attempt = NOW(),
        sync_error_message = error_message,
        consecutive_sync_failures = CASE 
            WHEN new_status = 'active' THEN 0 
            WHEN new_status IN ('error', 'auth_required') THEN COALESCE(consecutive_sync_failures, 0) + 1
            ELSE COALESCE(consecutive_sync_failures, 0)
        END,
        last_synced_at = CASE 
            WHEN new_status = 'active' THEN NOW()
            ELSE last_synced_at
        END,
        updated_at = NOW()
    WHERE id = account_id;

    -- Log the sync attempt
    INSERT INTO public.transaction_sync_log (
        user_id,
        account_id,
        platform_source,
        sync_type,
        sync_status,
        transactions_synced,
        error_message,
        platform_specific_error,
        sync_started_at,
        sync_completed_at,
        created_at
    ) VALUES (
        user_uuid,
        account_id,
        platform,
        'background_sync',
        CASE 
            WHEN new_status = 'active' THEN 'success'
            WHEN new_status = 'auth_required' THEN 'auth_error'
            ELSE 'failed'
        END,
        transactions_synced,
        error_message,
        platform_error,
        NOW(),
        NOW(),
        NOW()
    );

    -- If auth failure or repeated failures, create notification
    IF new_status = 'auth_required' OR (new_status = 'error' AND failure_count >= 2) THEN
        INSERT INTO public.sync_notifications (
            user_id,
            account_id,
            platform_source,
            notification_type,
            notification_title,
            notification_body,
            deep_link_url
        ) VALUES (
            user_uuid,
            account_id,
            platform,
            CASE 
                WHEN new_status = 'auth_required' THEN 'auth_failure'
                ELSE 'sync_error'
            END,
            CASE 
                WHEN platform = 'mono' AND new_status = 'auth_required' THEN 'Bank Account Re-authentication Required'
                WHEN platform = 'mtn_momo' AND new_status = 'auth_required' THEN 'MTN MoMo Re-authentication Required'
                WHEN platform = 'mono' THEN 'Bank Account Sync Issue'
                ELSE 'MTN MoMo Sync Issue'
            END,
            CASE 
                WHEN platform = 'mono' AND new_status = 'auth_required' THEN 'Your bank account connection needs to be renewed. Tap to reconnect.'
                WHEN platform = 'mtn_momo' AND new_status = 'auth_required' THEN 'Your MTN MoMo connection needs to be renewed. Tap to reconnect.'
                WHEN platform = 'mono' THEN 'There was an issue syncing your bank account. We''ll keep trying automatically.'
                ELSE 'There was an issue syncing your MTN MoMo account. We''ll keep trying automatically.'
            END,
            CASE 
                WHEN new_status = 'auth_required' THEN 'kippo://accounts/reauth?platform=' || platform
                ELSE 'kippo://accounts'
            END
        );
    END IF;
END;
$$;

-- Function to get sync metrics by platform
CREATE OR REPLACE FUNCTION get_dual_platform_sync_metrics(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
    platform_source VARCHAR(20),
    total_syncs BIGINT,
    successful_syncs BIGINT,
    failed_syncs BIGINT,
    auth_error_syncs BIGINT,
    total_transactions_synced BIGINT,
    average_sync_duration FLOAT,
    unique_accounts_synced BIGINT,
    success_rate FLOAT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        tsl.platform_source,
        COUNT(*) as total_syncs,
        COUNT(*) FILTER (WHERE tsl.sync_status = 'success') as successful_syncs,
        COUNT(*) FILTER (WHERE tsl.sync_status = 'failed') as failed_syncs,
        COUNT(*) FILTER (WHERE tsl.sync_status = 'auth_error') as auth_error_syncs,
        COALESCE(SUM(tsl.transactions_synced), 0) as total_transactions_synced,
        COALESCE(AVG(EXTRACT(EPOCH FROM (tsl.sync_completed_at - tsl.sync_started_at))), 0) as average_sync_duration,
        COUNT(DISTINCT tsl.account_id) as unique_accounts_synced,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE tsl.sync_status = 'success')::FLOAT / COUNT(*)::FLOAT) * 100, 2)
            ELSE 0 
        END as success_rate
    FROM public.transaction_sync_log tsl
    WHERE tsl.platform_source IN ('mono', 'mtn_momo')
    AND tsl.sync_type = 'background_sync'
    AND tsl.created_at >= NOW() - INTERVAL '1 day' * days_back
    GROUP BY tsl.platform_source
    ORDER BY tsl.platform_source;
$$;