import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { NotificationService } from '../shared/notification-service.ts';

interface Database {
  public: {
    Tables: {
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          amount: number;
          month: string;
          created_at: string;
          updated_at: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon_name: string;
          created_at: string;
          updated_at: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string | null;
          amount: number;
          type: 'income' | 'expense';
          category_id: string;
          transaction_date: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      alert_settings: {
        Row: {
          id: string;
          user_id: string;
          budget_alerts_enabled: boolean;
          warning_threshold: number;
          over_budget_alerts_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      alert_history: {
        Row: {
          id: string;
          user_id: string;
          budget_id: string;
          alert_type: 'warning' | 'over_budget';
          sent_at: string;
          notification_id: string | null;
          status: 'sent' | 'failed' | 'pending';
          error_message: string | null;
          spent_amount: number;
          budget_amount: number;
          percentage: number;
        };
      };
    };
  };
}

interface BudgetWithSpending {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: string;
  category_name: string;
  spent: number;
  percentage: number;
  transaction_count: number;
}

interface AlertSettings {
  id: string;
  user_id: string;
  budget_alerts_enabled: boolean;
  warning_threshold: number;
  over_budget_alerts_enabled: boolean;
}

interface AlertProcessingRequest {
  type: 'transaction_change' | 'manual_check' | 'bulk_check';
  user_id?: string;
  budget_id?: string;
  transaction_id?: string;
  force_check?: boolean;
}

interface AlertProcessingResult {
  success: boolean;
  alerts_sent: number;
  alerts_failed: number;
  processed_budgets: number;
  errors: string[];
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
    const notificationService = new NotificationService();

    let requestData: AlertProcessingRequest;
    
    if (req.method === 'GET') {
      // Handle GET requests for manual/admin triggers
      const url = new URL(req.url);
      requestData = {
        type: 'manual_check',
        user_id: url.searchParams.get('user_id') || undefined,
        budget_id: url.searchParams.get('budget_id') || undefined,
        force_check: url.searchParams.get('force_check') === 'true'
      };
    } else {
      requestData = await req.json();
    }

    const result = await processAlerts(supabase, notificationService, requestData);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Alert processing error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        alerts_sent: 0,
        alerts_failed: 0,
        processed_budgets: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function processAlerts(
  supabase: any,
  notificationService: NotificationService,
  request: AlertProcessingRequest
): Promise<AlertProcessingResult> {
  const result: AlertProcessingResult = {
    success: true,
    alerts_sent: 0,
    alerts_failed: 0,
    processed_budgets: 0,
    errors: []
  };

  try {
    let budgetsToCheck: BudgetWithSpending[] = [];

    if (request.budget_id) {
      // Check specific budget
      const budget = await getBudgetWithSpending(supabase, request.budget_id);
      if (budget) {
        budgetsToCheck = [budget];
      }
    } else if (request.user_id) {
      // Check all budgets for specific user
      budgetsToCheck = await getUserBudgetsWithSpending(supabase, request.user_id);
    } else {
      // Check all active budgets (for bulk processing)
      budgetsToCheck = await getAllActiveBudgetsWithSpending(supabase);
    }

    console.log(`Processing ${budgetsToCheck.length} budgets for alerts`);

    for (const budget of budgetsToCheck) {
      try {
        result.processed_budgets++;
        
        // Get user's alert settings
        const alertSettings = await getUserAlertSettings(supabase, budget.user_id);
        
        if (!alertSettings?.budget_alerts_enabled) {
          console.log(`Alerts disabled for user ${budget.user_id}, skipping`);
          continue;
        }

        // Check if alerts should be sent
        const alertsToSend = await determineAlertsToSend(
          supabase,
          budget,
          alertSettings,
          request.force_check || false
        );

        // Send alerts
        for (const alertType of alertsToSend) {
          try {
            const alertSent = await sendBudgetAlert(
              supabase,
              notificationService,
              budget,
              alertType,
              alertSettings
            );

            if (alertSent) {
              result.alerts_sent++;
            } else {
              result.alerts_failed++;
            }
          } catch (alertError) {
            console.error(`Failed to send ${alertType} alert for budget ${budget.id}:`, alertError);
            result.alerts_failed++;
            result.errors.push(`Alert ${alertType} failed for budget ${budget.id}: ${alertError}`);
          }
        }

      } catch (budgetError) {
        console.error(`Error processing budget ${budget.id}:`, budgetError);
        result.errors.push(`Budget ${budget.id} processing failed: ${budgetError}`);
      }
    }

    // Update overall success based on results
    result.success = result.errors.length === 0;

    console.log('Alert processing completed:', result);
    return result;

  } catch (error) {
    console.error('Alert processing failed:', error);
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown processing error');
    return result;
  }
}

async function getBudgetWithSpending(
  supabase: any,
  budgetId: string
): Promise<BudgetWithSpending | null> {
  const { data, error } = await supabase.rpc('get_budget_with_spending', {
    p_budget_id: budgetId
  });

  if (error) {
    console.error('Error fetching budget with spending:', error);
    return null;
  }

  return data?.[0] || null;
}

async function getUserBudgetsWithSpending(
  supabase: any,
  userId: string
): Promise<BudgetWithSpending[]> {
  const { data, error } = await supabase.rpc('get_budgets_with_spending_for_user', {
    p_user_id: userId,
    p_month: new Date().toISOString().slice(0, 7) + '-01' // Current month
  });

  if (error) {
    console.error('Error fetching user budgets with spending:', error);
    return [];
  }

  return data || [];
}

async function getAllActiveBudgetsWithSpending(
  supabase: any
): Promise<BudgetWithSpending[]> {
  const { data, error } = await supabase.rpc('get_all_budgets_with_spending_current_month');

  if (error) {
    console.error('Error fetching all active budgets with spending:', error);
    return [];
  }

  return data || [];
}

async function getUserAlertSettings(
  supabase: any,
  userId: string
): Promise<AlertSettings | null> {
  const { data, error } = await supabase.rpc('get_user_alert_settings', {
    user_uuid: userId
  });

  if (error) {
    console.error('Error fetching user alert settings:', error);
    return null;
  }

  return data?.[0] || null;
}

async function determineAlertsToSend(
  supabase: any,
  budget: BudgetWithSpending,
  alertSettings: AlertSettings,
  forceCheck: boolean
): Promise<('warning' | 'over_budget')[]> {
  const alertsToSend: ('warning' | 'over_budget')[] = [];

  // Check if over budget (100%+)
  if (budget.percentage >= 100 && alertSettings.over_budget_alerts_enabled) {
    const shouldSend = forceCheck || await shouldSendAlert(supabase, budget.id, 'over_budget');
    if (shouldSend) {
      alertsToSend.push('over_budget');
    }
  }
  // Check if approaching budget limit (warning threshold)
  else if (budget.percentage >= alertSettings.warning_threshold && alertSettings.budget_alerts_enabled) {
    const shouldSend = forceCheck || await shouldSendAlert(supabase, budget.id, 'warning');
    if (shouldSend) {
      alertsToSend.push('warning');
    }
  }

  return alertsToSend;
}

async function shouldSendAlert(
  supabase: any,
  budgetId: string,
  alertType: 'warning' | 'over_budget'
): Promise<boolean> {
  const { data, error } = await supabase.rpc('should_send_alert', {
    p_budget_id: budgetId,
    p_alert_type: alertType
  });

  if (error) {
    console.error('Error checking if alert should be sent:', error);
    return false;
  }

  return data === true;
}

async function sendBudgetAlert(
  supabase: any,
  notificationService: NotificationService,
  budget: BudgetWithSpending,
  alertType: 'warning' | 'over_budget',
  alertSettings: AlertSettings
): Promise<boolean> {
  try {
    // Get user email for email notifications
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', budget.user_id)
      .single();

    if (userError) {
      console.warn(`Could not fetch user email for ${budget.user_id}:`, userError);
    }

    const userEmail = userData?.email;
    let notificationResult;

    if (alertType === 'warning') {
      notificationResult = await notificationService.sendBudgetWarningNotification(
        budget.user_id,
        budget.id,
        budget.category_name,
        budget.spent,
        budget.amount,
        budget.percentage,
        userEmail,
        alertSettings.budget_alerts_enabled
      );
    } else {
      const overAmount = budget.spent - budget.amount;
      notificationResult = await notificationService.sendBudgetExceededNotification(
        budget.user_id,
        budget.id,
        budget.category_name,
        budget.spent,
        budget.amount,
        overAmount,
        userEmail,
        alertSettings.over_budget_alerts_enabled
      );
    }

    // Record alert history
    const { error: historyError } = await supabase.rpc('record_alert_history', {
      p_user_id: budget.user_id,
      p_budget_id: budget.id,
      p_alert_type: alertType,
      p_notification_id: notificationResult.notificationId || null,
      p_status: notificationResult.success ? 'sent' : 'failed',
      p_spent_amount: budget.spent,
      p_budget_amount: budget.amount,
      p_percentage: budget.percentage,
      p_error_message: notificationResult.error || null
    });

    if (historyError) {
      console.error('Error recording alert history:', historyError);
    }

    if (notificationResult.success) {
      console.log(`${alertType} alert sent successfully for budget ${budget.id}`, {
        pushSent: notificationResult.pushSent,
        emailSent: notificationResult.emailSent,
        notificationId: notificationResult.notificationId,
        emailId: notificationResult.emailId
      });
      return true;
    } else {
      console.error(`Failed to send ${alertType} alert for budget ${budget.id}:`, notificationResult.error);
      return false;
    }

  } catch (error) {
    console.error(`Error sending ${alertType} alert for budget ${budget.id}:`, error);
    return false;
  }
}