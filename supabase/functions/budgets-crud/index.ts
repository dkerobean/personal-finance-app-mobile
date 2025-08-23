import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../shared/cors.ts'

interface CreateBudgetRequest {
  category_id: string;
  amount: number;
  month: string; // Format: 'YYYY-MM-01'
}

interface UpdateBudgetRequest {
  amount: number;
}

interface BudgetResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
}

interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: string;
  created_at: string;
  updated_at: string;
  category_name?: string;
  category_icon_name?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log(`Budget CRUD ${req.method} request received`, { url: req.url });
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: { 
            code: 'UNAUTHORIZED', 
            message: 'Missing authorization header' 
          } 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed', { authError: authError?.message, hasUser: !!user });
      return new Response(
        JSON.stringify({ 
          success: false,
          error: { 
            code: 'UNAUTHORIZED', 
            message: 'Invalid or expired token' 
          } 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('User authenticated', { userId: user.id, email: user.email });

    const url = new URL(req.url);
    const budgetId = url.pathname.split('/').pop();

    // Route based on HTTP method
    switch (req.method) {
      case 'GET': {
        try {
          console.log('Fetching budgets for user', { userId: user.id });
          
          // Get all budgets for the user with category information
          const { data: budgets, error: budgetsError } = await supabaseClient
            .rpc('get_user_budgets', { target_user_id: user.id });

          if (budgetsError) {
            console.error('Error calling get_user_budgets function', { error: budgetsError });
            throw budgetsError;
          }

          console.log('Successfully fetched budgets', { count: budgets?.length || 0 });

          const response: BudgetResponse = {
            success: true,
            data: budgets || [],
          };

          return new Response(
            JSON.stringify(response),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } catch (error) {
          console.error('Budget fetch error', { error: error instanceof Error ? error.message : error });
          
          const response: BudgetResponse = {
            success: false,
            error: {
              code: 'FETCH_ERROR',
              message: error instanceof Error ? error.message : 'Failed to fetch budgets',
            },
          };

          return new Response(
            JSON.stringify(response),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }

      case 'POST': {
        try {
          console.log('Creating budget for user', { userId: user.id });
          
          const requestBody: CreateBudgetRequest = await req.json();
          const { category_id, amount, month } = requestBody;

          console.log('Budget creation request', { category_id, amount, month });

          // Validate required fields
          if (!category_id || !amount || !month) {
            console.error('Missing required fields', { category_id, amount, month });
            return new Response(
              JSON.stringify({ 
                success: false,
                error: { 
                  code: 'INVALID_REQUEST', 
                  message: 'Missing required fields: category_id, amount, and month are required' 
                } 
              }),
              { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }

          // Validate amount is positive
          if (amount <= 0) {
            return new Response(
              JSON.stringify({ 
                error: { 
                  code: 'INVALID_AMOUNT', 
                  message: 'Budget amount must be positive' 
                } 
              }),
              { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }

          // Validate month format
          const monthDate = new Date(month);
          if (isNaN(monthDate.getTime()) || !month.match(/^\d{4}-\d{2}-01$/)) {
            return new Response(
              JSON.stringify({ 
                error: { 
                  code: 'INVALID_MONTH', 
                  message: 'Month must be in format YYYY-MM-01' 
                } 
              }),
              { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }

          // Create budget using database function
          console.log('Calling create_budget RPC function', {
            target_user_id: user.id,
            target_category_id: category_id,
            target_amount: amount,
            target_month: month
          });
          
          const { data: budgetId, error: createError } = await supabaseClient
            .rpc('create_budget', {
              target_user_id: user.id,
              target_category_id: category_id,
              target_amount: amount,
              target_month: month
            });

          if (createError) {
            console.error('Error creating budget', { createError });
            // Handle specific error cases
            if (createError.message.includes('unique')) {
              return new Response(
                JSON.stringify({ 
                  error: { 
                    code: 'BUDGET_EXISTS', 
                    message: 'A budget already exists for this category and month' 
                  } 
                }),
                { 
                  status: 409, 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
              );
            }

            if (createError.message.includes('Category does not exist')) {
              return new Response(
                JSON.stringify({ 
                  error: { 
                    code: 'CATEGORY_NOT_FOUND', 
                    message: 'Category not found' 
                  } 
                }),
                { 
                  status: 404, 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
              );
            }

            if (createError.message.includes('does not have access')) {
              return new Response(
                JSON.stringify({ 
                  error: { 
                    code: 'CATEGORY_ACCESS_DENIED', 
                    message: 'You do not have access to this category' 
                  } 
                }),
                { 
                  status: 403, 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
              );
            }

            throw createError;
          }

          // Get the created budget with category information
          const { data: createdBudget, error: fetchError } = await supabaseClient
            .from('budgets')
            .select(`
              id,
              user_id,
              category_id,
              amount,
              month,
              created_at,
              updated_at,
              category:categories(name, icon_name)
            `)
            .eq('id', budgetId)
            .single();

          if (fetchError) {
            throw fetchError;
          }

          const response: BudgetResponse = {
            success: true,
            data: {
              ...createdBudget,
              category_name: createdBudget.category?.name,
              category_icon_name: createdBudget.category?.icon_name,
            },
          };

          return new Response(
            JSON.stringify(response),
            { 
              status: 201, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } catch (error) {
          console.error('Budget creation error', { error: error instanceof Error ? error.message : error });
          
          const response: BudgetResponse = {
            success: false,
            error: {
              code: 'CREATE_ERROR',
              message: error instanceof Error ? error.message : 'Failed to create budget',
            },
          };

          return new Response(
            JSON.stringify(response),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }

      case 'PATCH': {
        if (!budgetId || budgetId === 'budgets-crud') {
          return new Response(
            JSON.stringify({ 
              error: { 
                code: 'INVALID_REQUEST', 
                message: 'Budget ID is required for updates' 
              } 
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        try {
          const requestBody: UpdateBudgetRequest = await req.json();
          const { amount } = requestBody;

          if (!amount) {
            return new Response(
              JSON.stringify({ 
                error: { 
                  code: 'INVALID_REQUEST', 
                  message: 'Amount is required' 
                } 
              }),
              { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }

          // Update budget using database function
          const { data: success, error: updateError } = await supabaseClient
            .rpc('update_budget_amount', {
              budget_id: budgetId,
              new_amount: amount,
              requesting_user_id: user.id
            });

          if (updateError) {
            if (updateError.message.includes('Budget not found')) {
              return new Response(
                JSON.stringify({ 
                  error: { 
                    code: 'BUDGET_NOT_FOUND', 
                    message: 'Budget not found' 
                  } 
                }),
                { 
                  status: 404, 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
              );
            }

            if (updateError.message.includes('does not own')) {
              return new Response(
                JSON.stringify({ 
                  error: { 
                    code: 'BUDGET_ACCESS_DENIED', 
                    message: 'You do not own this budget' 
                  } 
                }),
                { 
                  status: 403, 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
              );
            }

            throw updateError;
          }

          // Get the updated budget with category information
          const { data: updatedBudget, error: fetchError } = await supabaseClient
            .from('budgets')
            .select(`
              id,
              user_id,
              category_id,
              amount,
              month,
              created_at,
              updated_at,
              category:categories(name, icon_name)
            `)
            .eq('id', budgetId)
            .single();

          if (fetchError) {
            throw fetchError;
          }

          const response: BudgetResponse = {
            success: true,
            data: {
              ...updatedBudget,
              category_name: updatedBudget.category?.name,
              category_icon_name: updatedBudget.category?.icon_name,
            },
          };

          return new Response(
            JSON.stringify(response),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } catch (error) {
          const response: BudgetResponse = {
            success: false,
            error: {
              code: 'UPDATE_ERROR',
              message: error instanceof Error ? error.message : 'Failed to update budget',
            },
          };

          return new Response(
            JSON.stringify(response),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }

      case 'DELETE': {
        if (!budgetId || budgetId === 'budgets-crud') {
          return new Response(
            JSON.stringify({ 
              error: { 
                code: 'INVALID_REQUEST', 
                message: 'Budget ID is required for deletion' 
              } 
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        try {
          // Delete the budget (RLS will ensure user owns it)
          const { error: deleteError } = await supabaseClient
            .from('budgets')
            .delete()
            .eq('id', budgetId)
            .eq('user_id', user.id);

          if (deleteError) {
            throw deleteError;
          }

          const response: BudgetResponse = {
            success: true,
            data: { message: 'Budget deleted successfully' },
          };

          return new Response(
            JSON.stringify(response),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } catch (error) {
          const response: BudgetResponse = {
            success: false,
            error: {
              code: 'DELETE_ERROR',
              message: error instanceof Error ? error.message : 'Failed to delete budget',
            },
          };

          return new Response(
            JSON.stringify(response),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }

      default: {
        return new Response(
          JSON.stringify({ 
            error: { 
              code: 'METHOD_NOT_ALLOWED', 
              message: `Method ${req.method} not allowed` 
            } 
          }),
          { 
            status: 405, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

  } catch (error) {
    console.error('Budget CRUD error:', error);
    
    const response: BudgetResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Internal server error',
      },
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});