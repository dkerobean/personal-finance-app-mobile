-- MTN MoMo Integration Database Schema
-- Execute these commands in Supabase SQL Editor after the base schema

-- ============================================================================
-- EXTEND TRANSACTIONS TABLE FOR MTN MOMO
-- ============================================================================

-- Add MTN MoMo specific columns to existing transactions table
ALTER TABLE public.transactions 
ADD COLUMN momo_transaction_id UUID,
ADD COLUMN momo_external_id VARCHAR(255),
ADD COLUMN momo_reference_id VARCHAR(255),
ADD COLUMN momo_status VARCHAR(20) DEFAULT 'PENDING',
ADD COLUMN momo_payer_info JSONB,
ADD COLUMN momo_financial_transaction_id VARCHAR(255),
ADD COLUMN merchant_name VARCHAR(255),
ADD COLUMN location VARCHAR(255),
ADD COLUMN auto_categorized BOOLEAN DEFAULT false,
ADD COLUMN categorization_confidence DECIMAL(3,2);

-- Create index for MTN MoMo fields for faster queries
CREATE INDEX idx_transactions_momo_transaction_id ON public.transactions(momo_transaction_id);
CREATE INDEX idx_transactions_momo_external_id ON public.transactions(momo_external_id);
CREATE INDEX idx_transactions_momo_reference_id ON public.transactions(momo_reference_id);
CREATE INDEX idx_transactions_momo_status ON public.transactions(momo_status);
CREATE INDEX idx_transactions_auto_categorized ON public.transactions(auto_categorized);

-- ============================================================================
-- MTN MOMO ACCOUNT LINKS TABLE
-- ============================================================================

-- Table to store user's linked MTN MoMo accounts
CREATE TABLE public.momo_account_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Constraints
    UNIQUE(user_id, phone_number)
);

-- Enable RLS on momo_account_links
ALTER TABLE public.momo_account_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for momo_account_links
CREATE POLICY "Users can manage their own momo account links" 
ON public.momo_account_links 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TRANSACTION CATEGORIZATION RULES TABLE
-- ============================================================================

-- Table to store custom categorization rules
CREATE TABLE public.transaction_categorization_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    rule_type VARCHAR(20) NOT NULL, -- 'keyword', 'merchant', 'amount_range', 'pattern'
    rule_value TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on transaction_categorization_rules
ALTER TABLE public.transaction_categorization_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transaction_categorization_rules
CREATE POLICY "Users can manage their own categorization rules" 
ON public.transaction_categorization_rules 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id OR user_id IS NULL) 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ============================================================================
-- TRANSACTION SYNC LOG TABLE
-- ============================================================================

-- Table to track sync operations and prevent duplicates
CREATE TABLE public.transaction_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    momo_account_id UUID NOT NULL REFERENCES public.momo_account_links(id) ON DELETE CASCADE,
    sync_type VARCHAR(20) NOT NULL, -- 'manual', 'automatic', 'webhook'
    sync_status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'partial'
    transactions_synced INTEGER DEFAULT 0,
    error_message TEXT,
    sync_started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    sync_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on transaction_sync_log
ALTER TABLE public.transaction_sync_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transaction_sync_log
CREATE POLICY "Users can view their own sync logs" 
ON public.transaction_sync_log 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync logs" 
ON public.transaction_sync_log 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for momo_account_links
CREATE INDEX idx_momo_account_links_user_id ON public.momo_account_links(user_id);
CREATE INDEX idx_momo_account_links_phone_number ON public.momo_account_links(phone_number);
CREATE INDEX idx_momo_account_links_is_active ON public.momo_account_links(is_active);

-- Indexes for transaction_categorization_rules
CREATE INDEX idx_categorization_rules_user_id ON public.transaction_categorization_rules(user_id);
CREATE INDEX idx_categorization_rules_category_id ON public.transaction_categorization_rules(category_id);
CREATE INDEX idx_categorization_rules_rule_type ON public.transaction_categorization_rules(rule_type);
CREATE INDEX idx_categorization_rules_is_active ON public.transaction_categorization_rules(is_active);

-- Indexes for transaction_sync_log
CREATE INDEX idx_sync_log_user_id ON public.transaction_sync_log(user_id);
CREATE INDEX idx_sync_log_momo_account_id ON public.transaction_sync_log(momo_account_id);
CREATE INDEX idx_sync_log_sync_status ON public.transaction_sync_log(sync_status);
CREATE INDEX idx_sync_log_created_at ON public.transaction_sync_log(created_at);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to new tables
CREATE TRIGGER update_momo_account_links_updated_at 
    BEFORE UPDATE ON public.momo_account_links 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categorization_rules_updated_at 
    BEFORE UPDATE ON public.transaction_categorization_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DEFAULT CATEGORIZATION RULES (SYSTEM LEVEL)
-- ============================================================================

-- Insert some default categorization rules (these have user_id = NULL, making them system-wide)
-- These will be used as fallback when users haven't created custom rules

-- Food & Dining keywords
INSERT INTO public.transaction_categorization_rules (user_id, category_id, rule_type, rule_value, priority)
SELECT NULL, c.id, 'keyword', 'restaurant,food,dining,cafe,bar,kitchen,eatery', 10
FROM public.categories c WHERE c.name = 'Food & Dining' AND c.user_id IS NULL;

-- Transportation keywords  
INSERT INTO public.transaction_categorization_rules (user_id, category_id, rule_type, rule_value, priority)
SELECT NULL, c.id, 'keyword', 'uber,bolt,taxi,trotro,fuel,petrol,transport', 10
FROM public.categories c WHERE c.name = 'Transportation' AND c.user_id IS NULL;

-- Utilities keywords
INSERT INTO public.transaction_categorization_rules (user_id, category_id, rule_type, rule_value, priority)
SELECT NULL, c.id, 'keyword', 'ecg,gwcl,electricity,water,internet,airtime,data', 10
FROM public.categories c WHERE c.name = 'Utilities' AND c.user_id IS NULL;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that new tables are created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('momo_account_links', 'transaction_categorization_rules', 'transaction_sync_log');

-- Check that columns were added to transactions table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'transactions' 
AND column_name LIKE 'momo_%' OR column_name IN ('merchant_name', 'location', 'auto_categorized', 'categorization_confidence');

-- Check RLS policies for new tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('momo_account_links', 'transaction_categorization_rules', 'transaction_sync_log')
ORDER BY tablename, policyname;