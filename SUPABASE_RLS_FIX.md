# Supabase RLS Policy Fix Guide

## Problem
The app is getting a "new row violates row-level security policy for table 'transactions'" error because the tables have RLS enabled but lack proper policies.

## Solution Steps

### Step 1: Execute RLS Policies in Supabase

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor** in the left sidebar

2. **Run the RLS Policies**
   - Copy the contents of `rls-policies.sql` 
   - Paste into the SQL Editor
   - Click **Run** to execute all policies

### Step 2: Verify Policies Are Applied

After running the SQL, verify the policies are created:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('transactions', 'categories', 'profiles')
ORDER BY tablename, policyname;
```

You should see policies for:
- **transactions**: insert, select, update, delete policies
- **categories**: insert, select, update, delete policies  
- **profiles**: all operations policy

### Step 3: Test the Fix

1. **Restart the Expo development server**
2. **Try creating a transaction again**
3. **Check the console logs** for any remaining errors

## What These Policies Do

### Transactions Table
- **INSERT**: Users can only create transactions with their own `user_id`
- **SELECT**: Users can only view their own transactions
- **UPDATE/DELETE**: Users can only modify their own transactions

### Categories Table
- **SELECT**: Users can see their own categories AND default categories (where `user_id` IS NULL)
- **INSERT/UPDATE/DELETE**: Users can only manage their own categories

### Profiles Table
- **ALL**: Users can only access their own profile data

## Code Changes Made

The following API files were updated to explicitly set `user_id`:

1. **`src/services/api/transactions.ts`**
   - Added authentication check before INSERT
   - Explicitly set `user_id: user.id` in transaction creation

2. **`src/services/api/categories.ts`**
   - Added authentication check for category creation
   - Added `user_id` to default category seeding

## Expected Behavior After Fix

- ✅ Transaction creation should work without RLS errors
- ✅ Users will only see their own transactions and categories
- ✅ Default categories will be visible to all users
- ✅ Each user's data is properly isolated

## Troubleshooting

If you still get RLS errors after applying the fix:

1. **Check if policies were created**:
   ```sql
   \d+ transactions
   ```

2. **Verify current user authentication**:
   ```sql
   SELECT auth.uid();
   ```

3. **Check RLS is enabled**:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename IN ('transactions', 'categories', 'profiles');
   ```

## Database Requirements

Make sure your Supabase database has:
- ✅ `auth.users` table (created by Supabase Auth)
- ✅ `public.profiles` table 
- ✅ `public.categories` table
- ✅ `public.transactions` table
- ✅ All tables have RLS enabled
- ✅ Proper foreign key relationships established