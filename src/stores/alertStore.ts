import { create } from 'zustand';
import type { AlertState, AlertActions } from '@/types/store';
import type { UpdateAlertSettingsRequest } from '@/types/models';
import { alertsApi } from '@/services/api/alerts';

interface AlertStore extends AlertState, AlertActions {}

export const useAlertStore = create<AlertStore>((set, get) => ({
  alertSettings: null,
  alertHistory: [],
  isLoading: false,
  error: null,

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  fetchAlertSettings: async () => {
    const { setLoading, setError } = get();
    
    setLoading(true);
    setError(null);

    try {
      const response = await alertsApi.getSettings();
      
      if (response.error) {
        setError(response.error.message);
        return;
      }

      set({ alertSettings: response.data });
    } catch (error) {
      setError('Failed to load alert settings');
      console.error('Error loading alert settings:', error);
    } finally {
      setLoading(false);
    }
  },

  updateAlertSettings: async (request: UpdateAlertSettingsRequest) => {
    const { setLoading, setError, fetchAlertSettings } = get();
    
    setLoading(true);
    setError(null);

    try {
      const response = await alertsApi.updateSettings(request);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }

      // Update local state with the returned data
      set({ alertSettings: response.data });
      return true;
    } catch (error) {
      setError('Failed to update alert settings');
      console.error('Error updating alert settings:', error);
      return false;
    } finally {
      setLoading(false);
    }
  },

  sendTestNotification: async () => {
    const { setError } = get();
    
    setError(null);

    try {
      const response = await alertsApi.sendTestNotification();
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }

      return response.data?.success || false;
    } catch (error) {
      setError('Failed to send test notification');
      console.error('Error sending test notification:', error);
      return false;
    }
  },

  fetchAlertHistory: async (limit: number = 50) => {
    const { setLoading, setError } = get();
    
    setLoading(true);
    setError(null);

    try {
      const response = await alertsApi.getHistory(limit);
      
      if (response.error) {
        setError(response.error.message);
        return;
      }

      set({ alertHistory: response.data || [] });
    } catch (error) {
      setError('Failed to load alert history');
      console.error('Error loading alert history:', error);
    } finally {
      setLoading(false);
    }
  },

  // Selectors
  areAlertsEnabled: () => {
    const { alertSettings } = get();
    return alertSettings?.budget_alerts_enabled || false;
  },

  areOverBudgetAlertsEnabled: () => {
    const { alertSettings } = get();
    return alertSettings?.over_budget_alerts_enabled || false;
  },

  getWarningThreshold: () => {
    const { alertSettings } = get();
    return alertSettings?.warning_threshold || 90;
  },

  getRecentAlerts: (days: number = 7) => {
    const { alertHistory } = get();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return alertHistory.filter(alert => 
      new Date(alert.sent_at) >= cutoffDate
    );
  },

  getAlertsForBudget: (budgetId: string) => {
    const { alertHistory } = get();
    return alertHistory.filter(alert => alert.budget_id === budgetId);
  },

  // Utility methods
  triggerManualAlertCheck: async (budgetId?: string) => {
    const { setError } = get();
    
    setError(null);

    try {
      const response = await alertsApi.triggerAlertProcessing(budgetId);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }

      // Refresh alert history after triggering
      const { fetchAlertHistory } = get();
      await fetchAlertHistory();

      return true;
    } catch (error) {
      setError('Failed to trigger alert check');
      console.error('Error triggering alert check:', error);
      return false;
    }
  },
}));