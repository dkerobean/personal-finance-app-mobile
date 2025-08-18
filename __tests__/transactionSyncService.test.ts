import { transactionSyncService } from '@/services/transactionSyncService';
import { MoMoTransactionStatus, TransactionType } from '@/types/mtnMomo';
import { mtnMomoService } from '@/services/api/mtnMomoService';

// Mock the enum for testing
const MockTransactionType = {
  INCOME: 'income',
  EXPENSE: 'expense',
} as const;

// Mock dependencies
jest.mock('@/services/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
}));

jest.mock('@/services/api/mtnMomoService');
jest.mock('@/services/transactionCategorizer', () => ({
  transactionCategorizer: {
    extractMerchantName: jest.fn(() => 'Test Merchant'),
    categorizeTransaction: jest.fn(() => ({
      category_id: 'food_dining',
      suggested_type: MockTransactionType.EXPENSE,
      confidence: 85,
    })),
  },
}));

const mockSupabase = require('@/services/supabaseClient').supabase;
const mockMtnMomoService = mtnMomoService as jest.Mocked<typeof mtnMomoService>;

describe('Transaction Sync Service', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('linkMoMoAccount', () => {
    it('should link MoMo account successfully', async () => {
      const mockAccountLink = {
        id: 'account-link-id',
        user_id: mockUser.id,
        phone_number: '233241234567',
        account_name: 'Test Account',
        is_active: true,
      };

      // Mock no existing link
      mockSupabase.from().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }, // Not found error
      });

      // Mock successful insert
      mockSupabase.from().single.mockResolvedValueOnce({
        data: mockAccountLink,
        error: null,
      });

      const result = await transactionSyncService.linkMoMoAccount({
        phone_number: '233241234567',
        account_name: 'Test Account',
      });

      expect(result.data).toEqual(mockAccountLink);
      expect(result.error).toBeUndefined();
    });

    it('should prevent duplicate account linking', async () => {
      const existingLink = {
        id: 'existing-id',
        user_id: mockUser.id,
        phone_number: '233241234567',
        account_name: 'Existing Account',
        is_active: true,
      };

      // Mock existing link found
      mockSupabase.from().single.mockResolvedValueOnce({
        data: existingLink,
        error: null,
      });

      const result = await transactionSyncService.linkMoMoAccount({
        phone_number: '233241234567',
        account_name: 'Test Account',
      });

      expect(result.error?.code).toBe('ACCOUNT_ALREADY_LINKED');
    });

    it('should validate phone number format', async () => {
      const result = await transactionSyncService.linkMoMoAccount({
        phone_number: 'invalid-phone',
        account_name: 'Test Account',
      });

      expect(result.error?.code).toBe('VALIDATION_INVALID_FORMAT');
    });

    it('should validate account name length', async () => {
      const result = await transactionSyncService.linkMoMoAccount({
        phone_number: '233241234567',
        account_name: 'A', // Too short
      });

      expect(result.error?.code).toBe('VALIDATION_INVALID_FORMAT');
    });

    it('should handle unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const result = await transactionSyncService.linkMoMoAccount({
        phone_number: '233241234567',
        account_name: 'Test Account',
      });

      expect(result.error?.code).toBe('AUTH_USER_NOT_FOUND');
    });
  });

  describe('getMoMoAccounts', () => {
    it('should retrieve MoMo accounts successfully', async () => {
      const mockAccounts = [
        {
          id: 'account-1',
          user_id: mockUser.id,
          phone_number: '233241234567',
          account_name: 'Account 1',
          is_active: true,
        },
        {
          id: 'account-2',
          user_id: mockUser.id,
          phone_number: '233241234568',
          account_name: 'Account 2',
          is_active: false,
        },
      ];

      mockSupabase.from().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockAccounts,
          error: null,
        }),
      });

      const result = await transactionSyncService.getMoMoAccounts();

      expect(result.data).toEqual(mockAccounts);
      expect(result.error).toBeUndefined();
    });

    it('should handle database error', async () => {
      mockSupabase.from().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
        }),
      });

      const result = await transactionSyncService.getMoMoAccounts();

      expect(result.error?.code).toBe('AUTH_USER_NOT_FOUND');
    });
  });

  describe('deactivateMoMoAccount', () => {
    it('should deactivate account successfully', async () => {
      const mockAccount = {
        id: 'account-id',
        user_id: mockUser.id,
        phone_number: '233241234567',
        account_name: 'Test Account',
        is_active: true,
      };

      // Mock account exists
      mockSupabase.from().single.mockResolvedValueOnce({
        data: mockAccount,
        error: null,
      });

      // Mock successful update
      mockSupabase.from().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis().mockResolvedValue({
          error: null,
        }),
      });

      const result = await transactionSyncService.deactivateMoMoAccount('account-id');

      expect(result.error).toBeUndefined();
    });

    it('should validate account ID', async () => {
      const result = await transactionSyncService.deactivateMoMoAccount('');

      expect(result.error?.code).toBe('VALIDATION_REQUIRED_FIELD');
    });

    it('should handle account not found', async () => {
      // Mock account not found
      mockSupabase.from().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await transactionSyncService.deactivateMoMoAccount('non-existent-id');

      expect(result.error?.code).toBe('ACCOUNT_NOT_FOUND');
    });
  });

  describe('syncTransactionsFromMoMo', () => {
    beforeEach(() => {
      // Mock getMoMoAccounts to return active accounts
      jest.spyOn(transactionSyncService, 'getMoMoAccounts').mockResolvedValue({
        data: [
          {
            id: 'account-id',
            user_id: mockUser.id,
            phone_number: '233241234567',
            account_name: 'Test Account',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        error: undefined,
      });

      // Mock MTN MoMo service initialization
      mockMtnMomoService.initializeForSandbox.mockResolvedValue({
        success: true,
        data: true,
      });
    });

    it('should sync transactions successfully', async () => {
      // Mock sync log creation
      mockSupabase.from().single.mockResolvedValue({
        data: { id: 'sync-log-id' },
        error: null,
      });

      // Mock transaction processing
      mockSupabase.from().single
        // Check existing transaction (not found)
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' },
        })
        // Ensure category exists
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' },
        })
        // Create new category
        .mockResolvedValueOnce({
          data: { id: 'category-id', name: 'Food Dining' },
          error: null,
        })
        // Create new transaction
        .mockResolvedValueOnce({
          data: {
            id: 'transaction-id',
            amount: 25.50,
            type: MockTransactionType.EXPENSE,
            momo_external_id: 'mock-ext-001',
          },
          error: null,
        });

      // Mock sync log update
      mockSupabase.from().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const result = await transactionSyncService.syncTransactionsFromMoMo();

      expect(result.data?.totalTransactions).toBeGreaterThan(0);
      expect(result.data?.newTransactions).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
    });

    it('should handle no active accounts', async () => {
      jest.spyOn(transactionSyncService, 'getMoMoAccounts').mockResolvedValue({
        data: [],
        error: undefined,
      });

      const result = await transactionSyncService.syncTransactionsFromMoMo();

      expect(result.error?.code).toBe('ACCOUNT_NOT_FOUND');
    });

    it('should handle MTN MoMo service initialization failure', async () => {
      mockMtnMomoService.initializeForSandbox.mockResolvedValue({
        success: false,
        error: {
          code: 'INITIALIZATION_FAILED',
          message: 'Service unavailable',
        },
      });

      const result = await transactionSyncService.syncTransactionsFromMoMo();

      expect(result.error?.code).toBe('MOMO_SERVICE_UNAVAILABLE');
    });
  });

  describe('getMoMoTransactions', () => {
    it('should retrieve MoMo transactions successfully', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          user_id: mockUser.id,
          amount: 25.50,
          type: MockTransactionType.EXPENSE,
          momo_external_id: 'ext-001',
          category: {
            id: 'cat-1',
            name: 'Food',
          },
        },
      ];

      mockSupabase.from().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockTransactions,
          error: null,
        }),
      });

      const result = await transactionSyncService.getMoMoTransactions();

      expect(result.data).toEqual(mockTransactions);
      expect(result.error).toBeUndefined();
    });
  });

  describe('getSyncHistory', () => {
    it('should retrieve sync history successfully', async () => {
      const mockSyncHistory = [
        {
          id: 'sync-1',
          user_id: mockUser.id,
          sync_type: 'manual',
          sync_status: 'success',
          transactions_synced: 5,
          created_at: new Date().toISOString(),
          momo_account: {
            phone_number: '233241234567',
            account_name: 'Test Account',
          },
        },
      ];

      mockSupabase.from().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockSyncHistory,
          error: null,
        }),
      });

      const result = await transactionSyncService.getSyncHistory();

      expect(result.data).toEqual(mockSyncHistory);
      expect(result.error).toBeUndefined();
    });
  });
});