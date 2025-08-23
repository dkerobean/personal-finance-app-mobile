-- Migration: Fix Accounts Table and Foreign Key Relationships
-- File: 20240821_fix_accounts_foreign_key.sql
-- Creates unified accounts table and fixes foreign key relationships for dual-platform sync

-- ============================================================================
-- CREATE UNIFIED ACCOUNTS TABLE
-- ============================================================================

-- Create accounts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(20) NOT NULL DEFAULT 'mobile_money', -- 'bank', 'mobile_money', 'manual'
    institution_name VARCHAR(255),
    
    -- Platform identification
    platform_source VARCHAR(20) DEFAULT 'manual', -- 'mono', 'mtn_momo', 'manual'
    
    -- Mono bank account fields
    mono_account_id VARCHAR(255) UNIQUE,
    mono_institution_id VARCHAR(255),
    mono_account_number VARCHAR(50),
    mono_account_type VARCHAR(50),
    mono_balance DECIMAL(15,2),
    mono_currency VARCHAR(3) DEFAULT 'GHS',
    
    -- MTN MoMo fields
    phone_number VARCHAR(20),
    mtn_reference_id VARCHAR(255),
    momo_account_id VARCHAR(255),
    
    -- Account status and sync management
    is_active BOOLEAN DEFAULT true,
    balance DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'GHS',
    last_synced_at TIMESTAMP WITH TIME ZONE,
    last_sync_attempt TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20) DEFAULT 'active', -- 'active', 'auth_required', 'error', 'in_progress'
    sync_error_message TEXT,
    consecutive_sync_failures INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT accounts_platform_check CHECK (
        (platform_source = 'mono' AND mono_account_id IS NOT NULL) OR
        (platform_source = 'mtn_momo' AND phone_number IS NOT NULL) OR
        (platform_source = 'manual')
    ),
    CONSTRAINT accounts_phone_number_check CHECK (
        phone_number IS NULL OR phone_number ~ '^\+233[0-9]{9}$'
    )
);

-- Enable RLS on accounts table
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for accounts
DROP POLICY IF EXISTS "Users can read their own accounts" ON public.accounts;
CREATE POLICY "Users can read their own accounts" 
ON public.accounts FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own accounts" ON public.accounts;
CREATE POLICY "Users can insert their own accounts" 
ON public.accounts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own accounts" ON public.accounts;
CREATE POLICY "Users can update their own accounts" 
ON public.accounts FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own accounts" ON public.accounts;
CREATE POLICY "Users can delete their own accounts" 
ON public.accounts FOR DELETE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all accounts" ON public.accounts;
CREATE POLICY "Service role can manage all accounts" 
ON public.accounts FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- ============================================================================
-- MIGRATE DATA FROM MOMO_ACCOUNT_LINKS TO ACCOUNTS
-- ============================================================================

-- Insert MTN MoMo accounts from momo_account_links into unified accounts table
INSERT INTO public.accounts (
    user_id,
    account_name,
    account_type,
    platform_source,
    phone_number,
    mtn_reference_id,
    is_active,
    last_synced_at,
    created_at,
    updated_at
)
SELECT 
    user_id,
    account_name,
    'mobile_money',
    'mtn_momo',
    phone_number,
    phone_number AS mtn_reference_id, -- Use phone number as reference ID for now
    is_active,
    last_sync_at,
    created_at,
    updated_at
FROM public.momo_account_links mal
WHERE NOT EXISTS (
    -- Avoid duplicates if migration has already been run
    SELECT 1 FROM public.accounts a 
    WHERE a.user_id = mal.user_id 
    AND a.phone_number = mal.phone_number 
    AND a.platform_source = 'mtn_momo'
);

-- ============================================================================
-- FIX TRANSACTIONS TABLE FOREIGN KEY RELATIONSHIP
-- ============================================================================

-- Add account_id foreign key constraint to transactions table if it doesn't exist
DO $$ 
BEGIN 
    -- Check if foreign key constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'transactions_account_id_fkey' 
        AND table_name = 'transactions'
    ) THEN
        -- Add foreign key constraint
        ALTER TABLE public.transactions 
        ADD CONSTRAINT transactions_account_id_fkey 
        FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- UPDATE EXISTING TRANSACTIONS WITH ACCOUNT RELATIONSHIPS
-- ============================================================================

-- Update transactions that have MTN MoMo data but no account_id
UPDATE public.transactions t
SET account_id = a.id
FROM public.accounts a
WHERE t.account_id IS NULL
AND a.platform_source = 'mtn_momo'
AND a.phone_number IS NOT NULL
AND (
    -- Match by MTN reference or external IDs
    t.mtn_reference_id = a.phone_number OR
    t.momo_external_id IS NOT NULL OR
    t.momo_transaction_id IS NOT NULL
)
AND t.user_id = a.user_id;

-- Update transactions that have Mono data but no account_id
UPDATE public.transactions t
SET account_id = a.id
FROM public.accounts a
WHERE t.account_id IS NULL
AND a.platform_source = 'mono'
AND a.mono_account_id IS NOT NULL
AND t.mono_transaction_id IS NOT NULL
AND t.user_id = a.user_id;

-- ============================================================================
-- CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Indexes for accounts table
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_platform_source ON public.accounts(platform_source);
CREATE INDEX IF NOT EXISTS idx_accounts_mono_account_id ON public.accounts(mono_account_id) WHERE mono_account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_accounts_phone_number ON public.accounts(phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_accounts_sync_status ON public.accounts(sync_status, last_synced_at);
CREATE INDEX IF NOT EXISTS idx_accounts_active_platform ON public.accounts(platform_source, is_active, sync_status) WHERE is_active = true;

-- Indexes for transactions with account relationship
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id) WHERE account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_user_account ON public.transactions(user_id, account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date_account ON public.transactions(transaction_date DESC, account_id);

-- ============================================================================
-- UPDATE TRIGGER FOR ACCOUNTS TABLE
-- ============================================================================

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_accounts_updated_at_trigger ON public.accounts;
CREATE TRIGGER update_accounts_updated_at_trigger
    BEFORE UPDATE ON public.accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_accounts_updated_at();

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- Validate that accounts table has proper data
DO $$
DECLARE
    account_count INTEGER;
    transaction_count INTEGER;
    linked_transaction_count INTEGER;
BEGIN
    -- Count accounts
    SELECT COUNT(*) INTO account_count FROM public.accounts;
    RAISE NOTICE 'Total accounts created: %', account_count;
    
    -- Count transactions
    SELECT COUNT(*) INTO transaction_count FROM public.transactions;
    RAISE NOTICE 'Total transactions: %', transaction_count;
    
    -- Count transactions with account links
    SELECT COUNT(*) INTO linked_transaction_count 
    FROM public.transactions WHERE account_id IS NOT NULL;
    RAISE NOTICE 'Transactions linked to accounts: %', linked_transaction_count;
    
    -- Verify foreign key constraint works
    PERFORM 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'transactions_account_id_fkey' 
    AND table_name = 'transactions';
    
    IF FOUND THEN
        RAISE NOTICE 'Foreign key constraint successfully created';
    ELSE
        RAISE WARNING 'Foreign key constraint was not created';
    END IF;
END $$;