import { supabase } from '@/services/supabaseClient';
import type { AlertSettings, UpdateAlertSettingsRequest, AlertHistory } from '@/types/models';
import type { ApiResponse } from '@/types/api';

export const alertsApi = {
  /**
   * Get user's alert settings
   */
  async getSettings(): Promise<ApiResponse<AlertSettings>> {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.user) {
        return {
          data: null,
          error: { code: 'AUTH_REQUIRED', message: 'No authenticated user' }
        };
      }

      const { data, error } = await supabase.rpc('get_user_alert_settings', {
        user_uuid: session.session.user.id
      });

      if (error) {
        console.error('Error fetching alert settings:', error);
        return {
          data: null,
          error: { code: 'API_ERROR', message: error.message }
        };
      }

      return {
        data: data?.[0] || null,
        error: null
      };
    } catch (error) {
      console.error('Unexpected error fetching alert settings:', error);
      return {
        data: null,
        error: { code: 'FETCH_ERROR', message: 'Failed to fetch alert settings' }
      };
    }
  },

  /**
   * Update user's alert settings
   */
  async updateSettings(request: UpdateAlertSettingsRequest): Promise<ApiResponse<AlertSettings>> {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.user) {
        return {
          data: null,
          error: { code: 'AUTH_REQUIRED', message: 'No authenticated user' }
        };
      }

      const { data, error } = await supabase
        .from('alert_settings')
        .upsert({
          user_id: session.session.user.id,
          ...request,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating alert settings:', error);
        return {
          data: null,
          error: { code: 'API_ERROR', message: error.message }
        };
      }

      return {
        data,
        error: null
      };
    } catch (error) {
      console.error('Unexpected error updating alert settings:', error);
      return {
        data: null,
        error: { code: 'UPDATE_ERROR', message: 'Failed to update alert settings' }
      };
    }
  },

  /**
   * Send test notification
   */
  async sendTestNotification(): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.user) {
        return {
          data: null,
          error: { code: 'AUTH_REQUIRED', message: 'No authenticated user' }
        };
      }

      const { data, error } = await supabase.functions.invoke('test-notification', {
        body: {
          user_id: session.session.user.id
        }
      });

      if (error) {
        console.error('Error sending test notification:', error);
        return {
          data: null,
          error: { code: 'API_ERROR', message: error.message }
        };
      }

      return {
        data: data || { success: true },
        error: null
      };
    } catch (error) {
      console.error('Unexpected error sending test notification:', error);
      return {
        data: null,
        error: { code: 'NOTIFICATION_ERROR', message: 'Failed to send test notification' }
      };
    }
  },

  /**
   * Get user's alert history
   */
  async getHistory(limit: number = 50): Promise<ApiResponse<AlertHistory[]>> {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.user) {
        return {
          data: null,
          error: { code: 'AUTH_REQUIRED', message: 'No authenticated user' }
        };
      }

      const { data, error } = await supabase.rpc('get_user_alert_history', {
        p_user_id: session.session.user.id,
        p_limit: limit
      });

      if (error) {
        console.error('Error fetching alert history:', error);
        return {
          data: null,
          error: { code: 'API_ERROR', message: error.message }
        };
      }

      return {
        data: data || [],
        error: null
      };
    } catch (error) {
      console.error('Unexpected error fetching alert history:', error);
      return {
        data: null,
        error: { code: 'FETCH_ERROR', message: 'Failed to fetch alert history' }
      };
    }
  },

  /**
   * Trigger alert processing manually (for testing)
   */
  async triggerAlertProcessing(budgetId?: string): Promise<ApiResponse<{ success: boolean; alerts_sent: number }>> {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.user) {
        return {
          data: null,
          error: { code: 'AUTH_REQUIRED', message: 'No authenticated user' }
        };
      }

      const { data, error } = await supabase.functions.invoke('budget-alerts', {
        body: {
          type: 'manual_check',
          user_id: session.session.user.id,
          budget_id: budgetId,
          force_check: true
        }
      });

      if (error) {
        console.error('Error triggering alert processing:', error);
        return {
          data: null,
          error: { code: 'API_ERROR', message: error.message }
        };
      }

      return {
        data: data || { success: true, alerts_sent: 0 },
        error: null
      };
    } catch (error) {
      console.error('Unexpected error triggering alert processing:', error);
      return {
        data: null,
        error: { code: 'PROCESSING_ERROR', message: 'Failed to trigger alert processing' }
      };
    }
  }
};