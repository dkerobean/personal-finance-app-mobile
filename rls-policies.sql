-- RLS Policies for Personal Finance App
-- Execute these commands in Supabase SQL Editor

-- ============================================================================
-- TRANSACTIONS TABLE RLS POLICIES
-- ============================================================================

-- Enable RLS (already enabled according to schema, but included for completeness)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to INSERT their own transactions
CREATE POLICY "Users can insert their own transactions" 
ON public.transactions 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow authenticated users to SELECT their own transactions
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Policy: Allow authenticated users to UPDATE their own transactions
CREATE POLICY "Users can update their own transactions" 
ON public.transactions 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow authenticated users to DELETE their own transactions
CREATE POLICY "Users can delete their own transactions" 
ON public.transactions 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- ============================================================================
-- CATEGORIES TABLE RLS POLICIES
-- ============================================================================

-- Enable RLS for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to view their own categories and default categories
CREATE POLICY "Users can view their own and default categories" 
ON public.categories 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Allow authenticated users to INSERT their own categories
CREATE POLICY "Users can insert their own categories" 
ON public.categories 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow authenticated users to UPDATE their own categories
CREATE POLICY "Users can update their own categories" 
ON public.categories 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow authenticated users to DELETE their own categories
CREATE POLICY "Users can delete their own categories" 
ON public.categories 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- ============================================================================
-- PROFILES TABLE RLS POLICIES
-- ============================================================================

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view and manage their own profile
CREATE POLICY "Users can manage their own profile" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('transactions', 'categories', 'profiles')
ORDER BY tablename, policyname;

-- Test user access (replace with actual user ID after running)
-- SELECT auth.uid() as current_user_id;