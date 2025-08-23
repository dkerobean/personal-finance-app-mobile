import { useAlertStore } from '@/stores/alertStore';
import { alertsApi } from '@/services/api/alerts';
import type { AlertSettings, UpdateAlertSettingsRequest } from '@/types/models';

// Mock the alerts API
jest.mock('@/services/api/alerts');
const mockedAlertsApi = alertsApi as jest.Mocked<typeof alertsApi>;

describe('AlertStore', () => {
  let store: any;

  beforeEach(() => {
    // Get a fresh store instance for each test
    store = useAlertStore.getState();
    // Reset store state
    store.alertSettings = null;
    store.alertHistory = [];
    store.isLoading = false;
    store.error = null;
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('fetchAlertSettings', () => {
    it('should fetch alert settings successfully', async () => {
      const mockSettings: AlertSettings = {
        id: '1',
        user_id: 'user-1',
        budget_alerts_enabled: true,
        warning_threshold: 90,
        over_budget_alerts_enabled: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockedAlertsApi.getSettings.mockResolvedValue({
        data: mockSettings,
        error: null,
      });

      await store.fetchAlertSettings();

      expect(mockedAlertsApi.getSettings).toHaveBeenCalledTimes(1);
      expect(store.alertSettings).toEqual(mockSettings);
      expect(store.error).toBeNull();
      expect(store.isLoading).toBe(false);
    });

    it('should handle fetch error', async () => {
      mockedAlertsApi.getSettings.mockResolvedValue({
        data: null,
        error: { code: 'FETCH_ERROR', message: 'Failed to fetch settings' },
      });

      await store.fetchAlertSettings();

      expect(store.alertSettings).toBeNull();
      expect(store.error).toBe('Failed to fetch settings');
      expect(store.isLoading).toBe(false);
    });
  });

  describe('updateAlertSettings', () => {
    it('should update alert settings successfully', async () => {
      const updateRequest: UpdateAlertSettingsRequest = {
        budget_alerts_enabled: false,
        warning_threshold: 85,
      };

      const updatedSettings: AlertSettings = {
        id: '1',
        user_id: 'user-1',
        budget_alerts_enabled: false,
        warning_threshold: 85,
        over_budget_alerts_enabled: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockedAlertsApi.updateSettings.mockResolvedValue({
        data: updatedSettings,
        error: null,
      });

      const result = await store.updateAlertSettings(updateRequest);

      expect(mockedAlertsApi.updateSettings).toHaveBeenCalledWith(updateRequest);
      expect(result).toBe(true);
      expect(store.alertSettings).toEqual(updatedSettings);
      expect(store.error).toBeNull();
    });

    it('should handle update error', async () => {
      const updateRequest: UpdateAlertSettingsRequest = {
        budget_alerts_enabled: false,
      };

      mockedAlertsApi.updateSettings.mockResolvedValue({
        data: null,
        error: { code: 'UPDATE_ERROR', message: 'Update failed' },
      });

      const result = await store.updateAlertSettings(updateRequest);

      expect(result).toBe(false);
      expect(store.error).toBe('Update failed');
    });
  });

  describe('sendTestNotification', () => {
    it('should send test notification successfully', async () => {
      mockedAlertsApi.sendTestNotification.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const result = await store.sendTestNotification();

      expect(mockedAlertsApi.sendTestNotification).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
      expect(store.error).toBeNull();
    });

    it('should handle test notification error', async () => {
      mockedAlertsApi.sendTestNotification.mockResolvedValue({
        data: null,
        error: { code: 'NOTIFICATION_ERROR', message: 'Notification failed' },
      });

      const result = await store.sendTestNotification();

      expect(result).toBe(false);
      expect(store.error).toBe('Notification failed');
    });
  });

  describe('fetchAlertHistory', () => {
    it('should fetch alert history successfully', async () => {
      const mockHistory = [
        {
          id: '1',
          user_id: 'user-1',
          budget_id: 'budget-1',
          alert_type: 'warning' as const,
          sent_at: '2024-01-01T00:00:00Z',
          notification_id: 'notif-1',
          status: 'sent' as const,
          error_message: null,
          spent_amount: 450,
          budget_amount: 500,
          percentage: 90,
          category_name: 'Food',
          budget_month: '2024-01-01',
        },
      ];

      mockedAlertsApi.getHistory.mockResolvedValue({
        data: mockHistory,
        error: null,
      });

      await store.fetchAlertHistory(10);

      expect(mockedAlertsApi.getHistory).toHaveBeenCalledWith(10);
      expect(store.alertHistory).toEqual(mockHistory);
      expect(store.error).toBeNull();
    });
  });

  describe('helper methods', () => {
    beforeEach(() => {
      store.alertSettings = {
        id: '1',
        user_id: 'user-1',
        budget_alerts_enabled: true,
        warning_threshold: 85,
        over_budget_alerts_enabled: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
    });

    it('should return correct alert status', () => {
      expect(store.areAlertsEnabled()).toBe(true);
      expect(store.areOverBudgetAlertsEnabled()).toBe(false);
      expect(store.getWarningThreshold()).toBe(85);
    });

    it('should handle null settings', () => {
      store.alertSettings = null;
      
      expect(store.areAlertsEnabled()).toBe(false);
      expect(store.areOverBudgetAlertsEnabled()).toBe(false);
      expect(store.getWarningThreshold()).toBe(90);
    });
  });

  describe('error handling', () => {
    it('should set and clear errors', () => {
      store.setError('Test error');
      expect(store.error).toBe('Test error');

      store.clearError();
      expect(store.error).toBeNull();
    });

    it('should set loading state', () => {
      store.setLoading(true);
      expect(store.isLoading).toBe(true);

      store.setLoading(false);
      expect(store.isLoading).toBe(false);
    });
  });
});