-- Migration: Create Budgets Table
-- File: 20240821_create_budgets_table.sql
-- Creates budgets table for Epic 3 Budget Creation & Management

-- ============================================================================
-- CREATE BUDGETS TABLE
-- ============================================================================

-- Create budgets table for monthly spending limits by category
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    month DATE NOT NULL, -- Format: 'YYYY-MM-01'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one budget per category per month per user
    UNIQUE(user_id, category_id, month)
);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on budgets table
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Policy: Users can read their own budgets
CREATE POLICY "Users can read their own budgets" 
ON public.budgets FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can create their own budgets
CREATE POLICY "Users can create their own budgets" 
ON public.budgets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own budgets
CREATE POLICY "Users can update their own budgets" 
ON public.budgets FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own budgets
CREATE POLICY "Users can delete their own budgets" 
ON public.budgets FOR DELETE 
USING (auth.uid() = user_id);

-- Policy: Service role can manage all budgets
CREATE POLICY "Service role can manage all budgets" 
ON public.budgets FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for efficient budget queries by user
CREATE INDEX IF NOT EXISTS idx_budgets_user_id 
ON public.budgets(user_id);

-- Index for budget queries by user and month
CREATE INDEX IF NOT EXISTS idx_budgets_user_month 
ON public.budgets(user_id, month DESC);

-- Index for budget queries by category
CREATE INDEX IF NOT EXISTS idx_budgets_category_id 
ON public.budgets(category_id);

-- Composite index for unique constraint and common queries
CREATE INDEX IF NOT EXISTS idx_budgets_user_category_month 
ON public.budgets(user_id, category_id, month);

-- ============================================================================
-- CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to get budgets for a specific month with category information
CREATE OR REPLACE FUNCTION get_budgets_for_month(
    target_user_id UUID,
    target_month DATE
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    category_id UUID,
    category_name VARCHAR(255),
    category_icon_name VARCHAR(100),
    amount DECIMAL(10,2),
    month DATE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        b.id,
        b.user_id,
        b.category_id,
        c.name as category_name,
        c.icon_name as category_icon_name,
        b.amount,
        b.month,
        b.created_at,
        b.updated_at
    FROM public.budgets b
    INNER JOIN public.categories c ON b.category_id = c.id
    WHERE b.user_id = target_user_id
    AND b.month = target_month
    ORDER BY c.name ASC;
$$;

-- Function to get all budgets for a user with category information
CREATE OR REPLACE FUNCTION get_user_budgets(target_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    category_id UUID,
    category_name VARCHAR(255),
    category_icon_name VARCHAR(100),
    amount DECIMAL(10,2),
    month DATE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        b.id,
        b.user_id,
        b.category_id,
        c.name as category_name,
        c.icon_name as category_icon_name,
        b.amount,
        b.month,
        b.created_at,
        b.updated_at
    FROM public.budgets b
    INNER JOIN public.categories c ON b.category_id = c.id
    WHERE b.user_id = target_user_id
    ORDER BY b.month DESC, c.name ASC;
$$;

-- Function to create a new budget with validation
CREATE OR REPLACE FUNCTION create_budget(
    target_user_id UUID,
    target_category_id UUID,
    target_amount DECIMAL(10,2),
    target_month DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_budget_id UUID;
    category_exists BOOLEAN;
    user_owns_category BOOLEAN;
BEGIN
    -- Validate amount is positive
    IF target_amount <= 0 THEN
        RAISE EXCEPTION 'Budget amount must be positive';
    END IF;
    
    -- Normalize month to first day of month
    target_month := DATE_TRUNC('month', target_month)::DATE;
    
    -- Check if category exists and belongs to user or is default
    SELECT EXISTS (
        SELECT 1 FROM public.categories 
        WHERE id = target_category_id
    ) INTO category_exists;
    
    IF NOT category_exists THEN
        RAISE EXCEPTION 'Category does not exist';
    END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM public.categories 
        WHERE id = target_category_id 
        AND (user_id = target_user_id OR user_id IS NULL)
    ) INTO user_owns_category;
    
    IF NOT user_owns_category THEN
        RAISE EXCEPTION 'User does not have access to this category';
    END IF;
    
    -- Insert the budget
    INSERT INTO public.budgets (
        user_id,
        category_id,
        amount,
        month
    ) VALUES (
        target_user_id,
        target_category_id,
        target_amount,
        target_month
    ) RETURNING id INTO new_budget_id;
    
    RETURN new_budget_id;
END;
$$;

-- Function to update budget amount
CREATE OR REPLACE FUNCTION update_budget_amount(
    budget_id UUID,
    new_amount DECIMAL(10,2),
    requesting_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    budget_user_id UUID;
BEGIN
    -- Validate amount is positive
    IF new_amount <= 0 THEN
        RAISE EXCEPTION 'Budget amount must be positive';
    END IF;
    
    -- Get budget owner
    SELECT user_id INTO budget_user_id
    FROM public.budgets
    WHERE id = budget_id;
    
    IF budget_user_id IS NULL THEN
        RAISE EXCEPTION 'Budget not found';
    END IF;
    
    -- Check ownership
    IF budget_user_id != requesting_user_id THEN
        RAISE EXCEPTION 'User does not own this budget';
    END IF;
    
    -- Update the budget
    UPDATE public.budgets
    SET 
        amount = new_amount,
        updated_at = NOW()
    WHERE id = budget_id;
    
    RETURN TRUE;
END;
$$;

-- ============================================================================
-- CREATE UPDATE TRIGGER
-- ============================================================================

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_budgets_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_budgets_updated_at
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_budgets_updated_at();