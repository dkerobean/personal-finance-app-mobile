import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0';
import { corsHeaders } from '../shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface BudgetWithSpending {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: string;
  created_at: string;
  updated_at: string;
  category_name?: string;
  category_icon_name?: string;
  spent: number;
  percentage: number;
  remaining: number;
  status: 'on_track' | 'warning' | 'over_budget';
  transaction_count: number;
}

function calculateBudgetStatus(percentage: number): 'on_track' | 'warning' | 'over_budget' {
  if (percentage < 75) return 'on_track';
  if (percentage <= 90) return 'warning';
  return 'over_budget';
}

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log(`Budget tracking ${req.method} request received`, { url: req.url });
    
    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: { code: 'UNAUTHORIZED', message: 'Authorization header required' } 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the JWT token and get user
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      console.error('Authentication failed', { userError: userError?.message, hasUser: !!userData.user });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const userId = userData.user.id;
    console.log('User authenticated', { userId, email: userData.user.email });
    const url = new URL(req.url);
    
    if (req.method === 'GET') {
      // Get query parameters
      const month = url.searchParams.get('month') || getCurrentMonth();
      const budgetId = url.searchParams.get('budget_id');

      if (budgetId) {
        // Get transactions for a specific budget
        const { data: budget, error: budgetError } = await supabase
          .from('budgets')
          .select(`
            *,
            categories (
              name,
              icon_name
            )
          `)
          .eq('id', budgetId)
          .eq('user_id', userId)
          .single();

        if (budgetError || !budget) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: { code: 'BUDGET_NOT_FOUND', message: 'Budget not found' } 
            }),
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Get transactions for this budget's category in the specified month
        const monthStart = new Date(month);
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
        
        const { data: transactions, error: transError } = await supabase
          .from('transactions')
          .select(`
            *,
            categories (
              name,
              icon_name
            )
          `)
          .eq('user_id', userId)
          .eq('category_id', budget.category_id)
          .eq('type', 'expense')
          .gte('transaction_date', monthStart.toISOString().split('T')[0])
          .lte('transaction_date', monthEnd.toISOString().split('T')[0])
          .order('transaction_date', { ascending: false });

        if (transError) {
          console.error('Error fetching transactions:', transError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: { code: 'DATABASE_ERROR', message: 'Failed to fetch transactions' } 
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            data: {
              budget: {
                ...budget,
                category_name: budget.categories?.name,
                category_icon_name: budget.categories?.icon_name
              },
              transactions: transactions || []
            }
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else {
        // Get all budgets with spending calculations
        const { data: budgets, error: budgetsError } = await supabase
          .from('budgets')
          .select(`
            *,
            categories (
              name,
              icon_name
            )
          `)
          .eq('user_id', userId)
          .eq('month', month)
          .order('created_at', { ascending: true });

        if (budgetsError) {
          console.error('Error fetching budgets:', budgetsError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: { code: 'DATABASE_ERROR', message: 'Failed to fetch budgets' } 
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Calculate spending for each budget
        const budgetsWithSpending: BudgetWithSpending[] = [];
        
        for (const budget of budgets || []) {
          // Calculate monthly spending for this category
          const monthStart = new Date(month);
          const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
          
          const { data: spendingData, error: spendingError } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', userId)
            .eq('category_id', budget.category_id)
            .eq('type', 'expense')
            .gte('transaction_date', monthStart.toISOString().split('T')[0])
            .lte('transaction_date', monthEnd.toISOString().split('T')[0]);

          if (spendingError) {
            console.error('Error calculating spending:', spendingError);
            continue;
          }

          const spent = spendingData?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;
          const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
          const remaining = budget.amount - spent;
          const status = calculateBudgetStatus(percentage);
          const transaction_count = spendingData?.length || 0;

          budgetsWithSpending.push({
            ...budget,
            category_name: budget.categories?.name,
            category_icon_name: budget.categories?.icon_name,
            spent: Math.round(spent * 100) / 100, // Round to 2 decimal places
            percentage: Math.round(percentage * 100) / 100,
            remaining: Math.round(remaining * 100) / 100,
            status,
            transaction_count
          });
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            data: budgetsWithSpending 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } 
      }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});