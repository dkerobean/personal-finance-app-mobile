import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0';
import { corsHeaders } from '../shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface MonthlyReportSummary {
  month: string;
  total_income: number;
  total_expenses: number;
  net_income: number;
  transaction_count: number;
  income_transaction_count: number;
  expense_transaction_count: number;
  avg_transaction_amount: number;
}

interface CategorySpending {
  category_id: string;
  category_name: string;
  category_icon: string;
  total_amount: number;
  transaction_count: number;
  avg_transaction_amount: number;
  transaction_type: string;
  percentage: number;
}

interface LargestTransaction {
  largest_expense_amount?: number;
  largest_expense_description?: string;
  largest_expense_category?: string;
  largest_expense_date?: string;
  largest_income_amount?: number;
  largest_income_description?: string;
  largest_income_category?: string;
  largest_income_date?: string;
}

interface AvailableMonth {
  month: string;
  transaction_count: number;
  total_amount: number;
}

function validateMonthFormat(month: string): boolean {
  return /^\d{4}-\d{2}$/.test(month);
}

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const monthNum = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${monthNum}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
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

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
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
    const url = new URL(req.url);
    
    if (req.method === 'GET') {
      const path = url.pathname.split('/').pop();
      
      if (path === 'available-months') {
        const limit = parseInt(url.searchParams.get('limit') || '12');
        
        const { data: availableMonths, error: monthsError } = await supabase
          .rpc('get_user_available_months', {
            p_user_id: userId,
            p_limit: limit
          });

        if (monthsError) {
          console.error('Error fetching available months:', monthsError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: { code: 'DATABASE_ERROR', message: 'Failed to fetch available months' } 
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
            data: availableMonths || [] 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } 
      
      else if (path === 'comparison') {
        const currentMonth = url.searchParams.get('current_month');
        const previousMonth = url.searchParams.get('previous_month');
        
        if (!currentMonth || !previousMonth) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: { code: 'MISSING_PARAMETERS', message: 'Both current_month and previous_month are required' } 
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        if (!validateMonthFormat(currentMonth) || !validateMonthFormat(previousMonth)) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: { code: 'INVALID_FORMAT', message: 'Month format must be YYYY-MM' } 
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        const { data: comparison, error: comparisonError } = await supabase
          .rpc('get_report_comparison', {
            p_user_id: userId,
            p_current_month: currentMonth,
            p_previous_month: previousMonth
          });

        if (comparisonError) {
          console.error('Error fetching report comparison:', comparisonError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: { code: 'DATABASE_ERROR', message: 'Failed to fetch report comparison' } 
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
            data: comparison 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } 
      
      else {
        const month = url.searchParams.get('month') || getCurrentMonth();
        
        if (!validateMonthFormat(month)) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: { code: 'INVALID_FORMAT', message: 'Month format must be YYYY-MM' } 
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        const { data: reportData, error: reportError } = await supabase
          .rpc('get_complete_monthly_report', {
            p_user_id: userId,
            p_month: month
          });

        if (reportError) {
          console.error('Error fetching monthly report:', reportError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: { code: 'DATABASE_ERROR', message: 'Failed to fetch monthly report' } 
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
            data: reportData 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

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