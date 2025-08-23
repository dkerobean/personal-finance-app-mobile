import { monoSyncService } from '@/services/monoSyncService';
import { supabase } from '@/services/supabaseClient';

// Mock supabase
jest.mock('@/services/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(),
            })),
          })),
        })),
      })),
      update: jest.fn(),
      insert: jest.fn(),
    })),
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('MonoSyncService', () => {
  const mockAccountId = 'test-account-id';
  const mockSession = {
    access_token: 'mock-token',
    user: { id: 'test-user-id' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });
  });

  describe('syncBankAccount', () => {
    it('should successfully sync bank account', async () => {
      const mockSyncResponse = {
        success: true,
        data: {
          totalTransactions: 15,
          newTransactions: 10,
          updatedTransactions: 5,
          accountType: 'bank' as const,
          institutionName: 'GCB Bank',
          errors: [],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSyncResponse,
      });

      const result = await monoSyncService.syncBankAccount(mockAccountId);

      expect(result.data).toEqual(mockSyncResponse.data);
      expect(result.error).toBeUndefined();
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/accounts-sync'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            accountId: mockAccountId,
            dateRange: undefined,
          }),
        })
      );
    });

    it('should handle authentication errors', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await monoSyncService.syncBankAccount(mockAccountId);

      expect(result.error).toEqual({
        code: 'AUTH_ERROR',
        message: 'Not authenticated. Please log in again.',
      });
      expect(result.data).toBeUndefined();
    });

    it('should handle sync errors', async () => {
      const mockErrorResponse = {
        success: false,
        error: {
          code: 'MONO_API_ERROR',
          message: 'Failed to fetch transactions from Mono',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => mockErrorResponse,
      });

      const result = await monoSyncService.syncBankAccount(mockAccountId);

      expect(result.error).toEqual(mockErrorResponse.error);
      expect(result.data).toBeUndefined();
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await monoSyncService.syncBankAccount(mockAccountId);

      expect(result.error).toEqual({
        code: 'NETWORK_ERROR',
        message: 'Network error occurred. Please check your connection and try again.',
      });
      expect(result.data).toBeUndefined();
    });
  });

  describe('syncBankAccountWithProgress', () => {
    it('should call progress callback with correct states', async () => {
      const mockSyncResponse = {
        success: true,
        data: {
          totalTransactions: 5,
          newTransactions: 3,
          updatedTransactions: 2,
          accountType: 'bank' as const,
          institutionName: 'Access Bank',
          errors: [],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSyncResponse,
      });

      const onProgress = jest.fn();

      const result = await monoSyncService.syncBankAccountWithProgress(
        mockAccountId,
        onProgress
      );

      expect(result.data).toEqual(mockSyncResponse.data);
      
      // Check progress callbacks
      expect(onProgress).toHaveBeenCalledWith({
        status: 'fetching',
        message: 'Connecting to your bank via Mono...',
        accountType: 'bank',
      });

      expect(onProgress).toHaveBeenCalledWith({
        status: 'fetching',
        message: 'Fetching bank account information...',
        accountType: 'bank',
      });

      expect(onProgress).toHaveBeenCalledWith({
        status: 'storing',
        message: 'Processing bank transactions...',
        accountType: 'bank',
        institutionName: 'Access Bank',
      });

      expect(onProgress).toHaveBeenCalledWith({
        status: 'completed',
        message: 'Successfully imported 5 bank transactions',
        transactionCount: 5,
        accountType: 'bank',
        institutionName: 'Access Bank',
      });
    });

    it('should call progress callback with error state on failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network failure'));

      const onProgress = jest.fn();

      const result = await monoSyncService.syncBankAccountWithProgress(
        mockAccountId,
        onProgress
      );

      expect(result.error).toBeDefined();
      
      expect(onProgress).toHaveBeenCalledWith({
        status: 'error',
        message: 'Failed to sync bank account',
        error: 'Network failure',
        accountType: 'bank',
      });
    });
  });

  describe('validateBankAccount', () => {
    it('should validate bank account successfully', async () => {
      const mockAccount = {
        account_type: 'bank',
        mono_account_id: 'mono-123',
        institution_name: 'GCB Bank',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockAccount,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await monoSyncService.validateBankAccount(mockAccountId);

      expect(result.data).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail validation for account without Mono ID', async () => {
      const mockAccount = {
        account_type: 'bank',
        mono_account_id: null, // Missing Mono ID
        institution_name: 'GCB Bank',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockAccount,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await monoSyncService.validateBankAccount(mockAccountId);

      expect(result.data).toBe(false);
      expect(result.error).toEqual({
        code: 'INVALID_ACCOUNT',
        message: 'Bank account is missing Mono integration',
      });
    });
  });

  describe('getSyncHistory', () => {
    it('should fetch sync history successfully', async () => {
      const mockHistory = [
        {
          id: 'sync-1',
          sync_status: 'success',
          transactions_synced: 10,
          sync_completed_at: '2023-12-01T10:00:00Z',
        },
        {
          id: 'sync-2',
          sync_status: 'failed',
          transactions_synced: 0,
          sync_completed_at: '2023-11-30T15:30:00Z',
          error_message: 'Network timeout',
        },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: mockHistory,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await monoSyncService.getSyncHistory(mockAccountId);

      expect(result.data).toEqual(mockHistory);
      expect(result.error).toBeUndefined();
    });

    it('should handle authentication errors in sync history', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await monoSyncService.getSyncHistory(mockAccountId);

      expect(result.data).toEqual([]);
      expect(result.error).toEqual({
        code: 'AUTH_ERROR',
        message: 'Not authenticated',
      });
    });
  });
});