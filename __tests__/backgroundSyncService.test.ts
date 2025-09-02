import { backgroundSyncService } from '@/services/backgroundSyncService';
import { supabase } from '@/services/supabaseClient';

// Mock the supabase client
jest.mock('@/services/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              single: jest.fn(),
            })),
          })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('BackgroundSyncService', () => {
  const mockSession = {
    access_token: 'test-token',
    user: { id: 'test-user-id' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: mockSession },
      error: null
    });
  });

  describe('getSyncStatus', () => {
    it('should return sync status when config exists', async () => {
      const mockConfig = {
        enabled: true,
        sync_frequency_hours: 24,
        max_concurrent_accounts: 5,
        last_run_at: '2023-01-01T00:00:00Z',
        next_run_at: '2023-01-02T00:00:00Z'
      };

      const mockSupabaseChain = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({ data: mockConfig, error: null })
              }))
            }))
          }))
        }))
      };

      (supabase.from as jest.Mock).mockReturnValue(mockSupabaseChain);

      const result = await backgroundSyncService.getSyncStatus();

      expect(result.error).toBeUndefined();
      expect(result.data).toEqual({
        isEnabled: true,
        frequencyHours: 24,
        maxConcurrentAccounts: 5,
        lastRunAt: '2023-01-01T00:00:00Z',
        nextRunAt: '2023-01-02T00:00:00Z'
      });
    });

    it('should return default values when no config exists', async () => {
      const mockSupabaseChain = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({ 
                  data: null, 
                  error: { code: 'PGRST116' } // No rows returned
                })
              }))
            }))
          }))
        }))
      };

      (supabase.from as jest.Mock).mockReturnValue(mockSupabaseChain);

      const result = await backgroundSyncService.getSyncStatus();

      expect(result.error).toBeUndefined();
      expect(result.data).toEqual({
        isEnabled: false,
        frequencyHours: 24,
        maxConcurrentAccounts: 5,
        lastRunAt: null,
        nextRunAt: null
      });
    });

    it('should handle authentication errors', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null
      });

      const result = await backgroundSyncService.getSyncStatus();

      expect(result.error).toEqual({
        code: 'AUTH_ERROR',
        message: 'Not authenticated. Please log in again.'
      });
    });
  });

  describe('getAccountSyncStatuses', () => {
    it('should return account sync statuses', async () => {
      const mockAccounts = [
        {
          id: 'account-1',
          account_name: 'MTN Account 1',
          phone_number: '+233123456789',
          sync_status: 'active',
          last_sync_at: '2023-01-01T00:00:00Z',
          last_sync_attempt: '2023-01-01T00:00:00Z'
        },
        {
          id: 'account-2',
          account_name: 'MTN Account 2',
          phone_number: '+233987654321',
          sync_status: 'error',
          last_sync_at: '2023-01-01T00:00:00Z',
          last_sync_attempt: '2023-01-01T00:05:00Z'
        }
      ];

      const mockSupabaseChain = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({ data: mockAccounts, error: null })
          }))
        }))
      };

      // Mock the error message query for the second account
      const mockErrorSupabaseChain = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            not: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({ 
                    data: { error_message: 'Authentication failed' }, 
                    error: null 
                  })
                }))
              }))
            }))
          }))
        }))
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockSupabaseChain)
        .mockReturnValue(mockErrorSupabaseChain);

      const result = await backgroundSyncService.getAccountSyncStatuses();

      expect(result.error).toBeUndefined();
      expect(result.data).toHaveLength(2);
      expect(result.data![0]).toEqual({
        id: 'account-1',
        accountName: 'MTN Account 1',
        phoneNumber: '+233123456789',
        syncStatus: 'active',
        lastSyncAt: '2023-01-01T00:00:00Z',
        lastSyncAttempt: '2023-01-01T00:00:00Z',
        errorMessage: undefined
      });
      expect(result.data![1]).toEqual({
        id: 'account-2',
        accountName: 'MTN Account 2',
        phoneNumber: '+233987654321',
        syncStatus: 'error',
        lastSyncAt: '2023-01-01T00:00:00Z',
        lastSyncAttempt: '2023-01-01T00:05:00Z',
        errorMessage: 'Authentication failed'
      });
    });
  });

  describe('triggerBackgroundSync', () => {
    it('should successfully trigger background sync', async () => {
      const mockResponse = {
        success: true,
        accountsProcessed: 2,
        totalTransactionsSynced: 10,
        results: [
          { status: 'success', transactionsSynced: 5 },
          { status: 'success', transactionsSynced: 5 }
        ],
        duration: 5000
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await backgroundSyncService.triggerBackgroundSync(true);

      expect(result.error).toBeUndefined();
      expect(result.data).toEqual({
        totalAccounts: 2,
        successfulSyncs: 2,
        failedSyncs: 0,
        authErrorSyncs: 0,
        totalTransactionsSynced: 10,
        averageSyncDuration: 2500,
        notificationsSent: 0
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/background-sync'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          body: JSON.stringify({
            forceSync: true,
            maxConcurrentAccounts: 5
          })
        })
      );
    });

    it('should handle sync failures', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await backgroundSyncService.triggerBackgroundSync();

      expect(result.error).toEqual({
        code: 'BACKGROUND_SYNC_ERROR',
        message: 'Background sync failed: 500 Internal Server Error'
      });
    });
  });

  describe('updateSyncConfiguration', () => {
    it('should successfully update sync configuration', async () => {
      const mockSupabaseChain = {
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null })
        }))
      };

      (supabase.from as jest.Mock).mockReturnValue(mockSupabaseChain);

      const config = {
        enabled: true,
        frequencyHours: 12,
        maxConcurrentAccounts: 10
      };

      const result = await backgroundSyncService.updateSyncConfiguration(config);

      expect(result.error).toBeUndefined();
      expect(result.data).toBe(true);

      expect(mockSupabaseChain.update).toHaveBeenCalledWith({
        enabled: true,
        sync_frequency_hours: 12,
        max_concurrent_accounts: 10,
        updated_at: expect.any(String)
      });
    });

    it('should handle update errors', async () => {
      const mockSupabaseChain = {
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ 
            error: { message: 'Update failed' } 
          })
        }))
      };

      (supabase.from as jest.Mock).mockReturnValue(mockSupabaseChain);

      const result = await backgroundSyncService.updateSyncConfiguration({
        enabled: false
      });

      expect(result.error).toEqual({
        code: 'CONFIG_UPDATE_ERROR',
        message: 'Update failed'
      });
    });
  });

  describe('checkSyncHealth', () => {
    it('should return healthy status when everything is working', async () => {
      // Mock getSyncStatus
      const mockGetSyncStatus = jest.spyOn(backgroundSyncService, 'getSyncStatus');
      mockGetSyncStatus.mockResolvedValue({
        data: {
          isEnabled: true,
          frequencyHours: 24,
          maxConcurrentAccounts: 5,
          lastRunAt: new Date().toISOString(),
          nextRunAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        error: null
      });

      // Mock getAccountSyncStatuses
      const mockGetAccountStatuses = jest.spyOn(backgroundSyncService, 'getAccountSyncStatuses');
      mockGetAccountStatuses.mockResolvedValue({
        data: [
          {
            id: 'account-1',
            accountName: 'MTN Account 1',
            phoneNumber: '+233123456789',
            syncStatus: 'active',
            lastSyncAt: new Date().toISOString(),
            lastSyncAttempt: new Date().toISOString()
          }
        ],
        error: null
      });

      const result = await backgroundSyncService.checkSyncHealth();

      expect(result.error).toBeUndefined();
      expect(result.data).toEqual({
        isHealthy: true,
        issues: [],
        recommendations: []
      });

      mockGetSyncStatus.mockRestore();
      mockGetAccountStatuses.mockRestore();
    });

    it('should identify health issues', async () => {
      // Mock getSyncStatus
      const mockGetSyncStatus = jest.spyOn(backgroundSyncService, 'getSyncStatus');
      mockGetSyncStatus.mockResolvedValue({
        data: {
          isEnabled: false,
          frequencyHours: 24,
          maxConcurrentAccounts: 5,
          lastRunAt: null,
          nextRunAt: null
        },
        error: null
      });

      // Mock getAccountSyncStatuses
      const mockGetAccountStatuses = jest.spyOn(backgroundSyncService, 'getAccountSyncStatuses');
      mockGetAccountStatuses.mockResolvedValue({
        data: [
          {
            id: 'account-1',
            accountName: 'MTN Account 1',
            phoneNumber: '+233123456789',
            syncStatus: 'auth_required',
            lastSyncAt: null,
            lastSyncAttempt: null
          },
          {
            id: 'account-2',
            accountName: 'MTN Account 2',
            phoneNumber: '+233987654321',
            syncStatus: 'error',
            lastSyncAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
            lastSyncAttempt: new Date().toISOString(),
            errorMessage: 'Network error'
          }
        ],
        error: null
      });

      const result = await backgroundSyncService.checkSyncHealth();

      expect(result.error).toBeUndefined();
      expect(result.data).toEqual({
        isHealthy: false,
        issues: [
          'Background sync is disabled',
          '1 account(s) need re-authentication',
          '1 account(s) have sync errors',
          '2 account(s) haven\'t synced recently'
        ],
        recommendations: [
          'Enable background sync in settings',
          'Re-link your MTN MoMo accounts in account settings',
          'Check account settings and try manual sync',
          'Check your internet connection and account settings'
        ]
      });

      mockGetSyncStatus.mockRestore();
      mockGetAccountStatuses.mockRestore();
    });
  });
});