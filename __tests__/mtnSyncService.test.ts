import { mtnSyncService } from '@/services/mtnSyncService';
import { supabase } from '@/services/supabaseClient';

// Mock dependencies
jest.mock('@/services/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

// Mock fetch for Edge Function calls
global.fetch = jest.fn();

describe('MTNSyncService', () => {
  const mockAccountId = 'test-account-id';
  const mockSession = {
    access_token: 'test-token',
    user: { id: 'test-user-id' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });
  });

  describe('syncAccount', () => {
    it('successfully syncs account transactions', async () => {
      const mockSyncResult = {
        totalTransactions: 10,
        newTransactions: 8,
        updatedTransactions: 2,
        errors: [],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockSyncResult,
        }),
      });

      const result = await mtnSyncService.syncAccount(mockAccountId);

      expect(result.data).toEqual(mockSyncResult);
      expect(result.error).toBeUndefined();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/accounts-sync'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          }),
          body: JSON.stringify({ accountId: mockAccountId }),
        })
      );
    });

    it('handles authentication error', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' },
      });

      const result = await mtnSyncService.syncAccount(mockAccountId);

      expect(result.error).toEqual({
        code: 'AUTH_ERROR',
        message: 'Not authenticated. Please log in again.',
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    it('handles API error response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account not found',
          },
        }),
      });

      const result = await mtnSyncService.syncAccount(mockAccountId);

      expect(result.error).toEqual({
        code: 'ACCOUNT_NOT_FOUND',
        message: 'Account not found',
      });
      expect(result.data).toBeUndefined();
    });

    it('handles network error', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await mtnSyncService.syncAccount(mockAccountId);

      expect(result.error).toEqual({
        code: 'SYNC_ERROR',
        message: 'Network error',
      });
      expect(result.data).toBeUndefined();
    });

    it('includes date range in request when provided', async () => {
      const dateRange = {
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T23:59:59.999Z',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { totalTransactions: 5, newTransactions: 5, updatedTransactions: 0, errors: [] },
        }),
      });

      await mtnSyncService.syncAccount(mockAccountId, dateRange);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ 
            accountId: mockAccountId, 
            dateRange 
          }),
        })
      );
    });
  });

  describe('syncAccountWithProgress', () => {
    it('calls progress callback during sync', async () => {
      const progressCallback = jest.fn();
      const mockSyncResult = {
        totalTransactions: 5,
        newTransactions: 5,
        updatedTransactions: 0,
        errors: [],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockSyncResult,
        }),
      });

      // Use fake timers to control delays
      jest.useFakeTimers();

      const syncPromise = mtnSyncService.syncAccountWithProgress(
        mockAccountId,
        progressCallback
      );

      // Fast-forward through the progress delays
      jest.advanceTimersByTime(2000);

      const result = await syncPromise;

      expect(progressCallback).toHaveBeenCalledWith('fetching');
      expect(progressCallback).toHaveBeenCalledWith('storing');
      expect(progressCallback).toHaveBeenCalledWith('completed');
      expect(result.data).toEqual(mockSyncResult);

      jest.useRealTimers();
    });

    it('does not call completed callback on error', async () => {
      const progressCallback = jest.fn();

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          success: false,
          error: { code: 'SYNC_ERROR', message: 'Sync failed' },
        }),
      });

      jest.useFakeTimers();

      const syncPromise = mtnSyncService.syncAccountWithProgress(
        mockAccountId,
        progressCallback
      );

      jest.advanceTimersByTime(2000);

      const result = await syncPromise;

      expect(progressCallback).toHaveBeenCalledWith('fetching');
      expect(progressCallback).toHaveBeenCalledWith('storing');
      expect(progressCallback).not.toHaveBeenCalledWith('completed');
      expect(result.error).toBeDefined();

      jest.useRealTimers();
    });
  });

  describe('syncLast30Days', () => {
    it('creates correct date range for last 30 days', async () => {
      const mockDate = new Date('2024-02-15T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { totalTransactions: 0, newTransactions: 0, updatedTransactions: 0, errors: [] },
        }),
      });

      await mtnSyncService.syncLast30Days(mockAccountId);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining(mockAccountId),
        })
      );

      const requestBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      expect(requestBody.dateRange).toBeDefined();
      expect(requestBody.dateRange.endDate).toBe(mockDate.toISOString());
      
      // Start date should be 30 days before end date
      const expectedStartDate = new Date(mockDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      expect(requestBody.dateRange.startDate).toBe(expectedStartDate.toISOString());

      jest.restoreAllMocks();
    });
  });

  describe('syncDateRange', () => {
    it('uses provided date range correctly', async () => {
      const startDate = new Date('2024-01-01T00:00:00.000Z');
      const endDate = new Date('2024-01-31T23:59:59.999Z');

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { totalTransactions: 15, newTransactions: 15, updatedTransactions: 0, errors: [] },
        }),
      });

      await mtnSyncService.syncDateRange(mockAccountId, startDate, endDate);

      const requestBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      expect(requestBody.dateRange.startDate).toBe(startDate.toISOString());
      expect(requestBody.dateRange.endDate).toBe(endDate.toISOString());
    });
  });
});