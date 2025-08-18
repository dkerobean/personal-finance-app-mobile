-- Add categorization fields to transactions table
-- This migration adds the auto_categorized and categorization_confidence fields required for Story 2.4

-- Add auto_categorized field to track if transaction was automatically categorized
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS auto_categorized BOOLEAN DEFAULT false;

-- Add categorization_confidence field to store confidence score (0.0 to 1.0)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS categorization_confidence DECIMAL(3,2) DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN transactions.auto_categorized IS 'Whether this transaction was automatically categorized by the system';
COMMENT ON COLUMN transactions.categorization_confidence IS 'Confidence score for categorization (0.0 to 1.0)';

-- Create index for performance on auto_categorized queries
CREATE INDEX IF NOT EXISTS idx_transactions_auto_categorized ON transactions(auto_categorized);

-- Create index for performance on categorization_confidence queries  
CREATE INDEX IF NOT EXISTS idx_transactions_categorization_confidence ON transactions(categorization_confidence);

-- Update existing synced transactions to have auto_categorized = false (manual categorization)
UPDATE transactions 
SET auto_categorized = false 
WHERE auto_categorized IS NULL 
  AND (momo_external_id IS NOT NULL OR momo_transaction_id IS NOT NULL);

-- Create system "Uncategorized" category if it doesn't exist
INSERT INTO categories (user_id, name, icon_name, created_at, updated_at)
SELECT 
    NULL as user_id,
    'Uncategorized' as name,
    'help-circle' as icon_name,
    NOW() as created_at,
    NOW() as updated_at
WHERE NOT EXISTS (
    SELECT 1 FROM categories WHERE name = 'Uncategorized' AND user_id IS NULL
);

-- Create categorization rules table for persistent rule storage
CREATE TABLE IF NOT EXISTS transaction_categorization_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('keyword', 'merchant', 'amount_range', 'pattern')),
    rule_value TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for categorization rules
CREATE INDEX IF NOT EXISTS idx_categorization_rules_category_id ON transaction_categorization_rules(category_id);
CREATE INDEX IF NOT EXISTS idx_categorization_rules_type_active ON transaction_categorization_rules(rule_type, is_active);
CREATE INDEX IF NOT EXISTS idx_categorization_rules_priority ON transaction_categorization_rules(priority DESC);

-- Add comment for documentation
COMMENT ON TABLE transaction_categorization_rules IS 'Rules for automated transaction categorization';