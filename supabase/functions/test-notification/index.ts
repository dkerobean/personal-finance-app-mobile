import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { NotificationService } from '../shared/notification-service.ts';

interface TestNotificationRequest {
  user_id: string;
  test_type?: 'general' | 'budget_warning' | 'budget_exceeded';
}

interface TestNotificationResponse {
  success: boolean;
  notification_id?: string;
  email_id?: string;
  push_sent?: boolean;
  email_sent?: boolean;
  error?: string;
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
    const { user_id, test_type = 'general' }: TestNotificationRequest = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'user_id is required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Initialize Supabase client to get user email
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user email for email notifications
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user_id)
      .single();

    if (userError) {
      console.warn(`Could not fetch user email for ${user_id}:`, userError);
    }

    const userEmail = userData?.email;
    const notificationService = new NotificationService();
    let result;

    // Send different types of test notifications
    switch (test_type) {
      case 'budget_warning':
        result = await notificationService.sendBudgetWarningNotification(
          user_id,
          'test-budget-id',
          'Test Category',
          90.00,
          100.00,
          90,
          userEmail,
          true // Email alerts enabled
        );
        break;
      
      case 'budget_exceeded':
        result = await notificationService.sendBudgetExceededNotification(
          user_id,
          'test-budget-id',
          'Test Category',
          120.00,
          100.00,
          20.00,
          userEmail,
          true // Email alerts enabled
        );
        break;
      
      default: // 'general'
        result = await notificationService.testNotificationDelivery(user_id);
        break;
    }

    const response: TestNotificationResponse = {
      success: result.success,
      notification_id: result.notificationId,
      email_id: result.emailId,
      push_sent: result.pushSent,
      email_sent: result.emailSent,
      error: result.error
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Test notification error:', error);
    
    const response: TestNotificationResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});