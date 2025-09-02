import { accountAggregator } from '@/services/accountAggregator';
import { monoSyncService } from '@/services/monoSyncService';
import { mtnSyncService } from '@/services/mtnSyncService';
import type { Account } from '@/types/models';

// Mock the sync services
jest.mock('@/services/monoSyncService');
jest.mock('@/services/mtnSyncService');

const mockMonoSyncService = monoSyncService as jest.Mocked<typeof monoSyncService>;
const mockMtnSyncService = mtnSyncService as jest.Mocked<typeof mtnSyncService>;

describe('AccountAggregatorService - Sync Functionality', () => {
  const mockBankAccount: Account = {
    id: 'bank-account-id',
    user_id: 'user-123',
    account_name: 'My GCB Account',
    account_type: 'bank',
    institution_name: 'GCB Bank',
    balance: 5000.00,
    mono_account_id: 'mono-123',
    last_synced_at: '2023-12-01T10:00:00Z',
    is_active: true,
    created_at: '2023-11-01T00:00:00Z',
    updated_at: '2023-12-01T10:00:00Z',
  };

  const mockMobileMoneyAccount: Account = {
    id: 'momo-account-id',
    user_id: 'user-123',
    account_name: 'MTN MoMo (+233201234567)',
    account_type: 'mobile_money',
    institution_name: 'MTN Mobile Money',
    balance: 200.50,
    mtn_reference_id: 'mtn-ref-456',
    mtn_phone_number: '+233201234567',
    last_synced_at: '2023-12-01T09:30:00Z',
    is_active: true,
    created_at: '2023-11-15T00:00:00Z',
    updated_at: '2023-12-01T09:30:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('syncAccount', () => {
    it('should route bank account sync to Mono service', async () => {
      const mockSyncResult = {
        totalTransactions: 15,
        newTransactions: 10,
        updatedTransactions: 5,
        accountType: 'bank' as const,
        institutionName: 'GCB Bank',
        errors: [],
      };

      // Mock getAccountById to return bank account
      jest.spyOn(accountAggregator, 'getAccountById').mockResolvedValue(mockBankAccount);
      
      mockMonoSyncService.syncBankAccount.mockResolvedValue({
        data: mockSyncResult,
        error: null,
      });

      const result = await accountAggregator.syncAccount('bank-account-id');

      expect(accountAggregator.getAccountById).toHaveBeenCalledWith('bank-account-id');
      expect(mockMonoSyncService.syncBankAccount).toHaveBeenCalledWith('bank-account-id', undefined);
      expect(result.data).toEqual(mockSyncResult);
      expect(result.error).toBeUndefined();
    });

    it('should route mobile money account sync to MTN service', async () => {
      const mockSyncResult = {
        totalTransactions: 8,
        newTransactions: 6,
        updatedTransactions: 2,
        accountType: 'mobile_money' as const,
        institutionName: 'MTN Mobile Money',
        errors: [],
      };

      // Mock getAccountById to return mobile money account
      jest.spyOn(accountAggregator, 'getAccountById').mockResolvedValue(mockMobileMoneyAccount);
      
      mockMtnSyncService.syncAccount.mockResolvedValue({
        data: mockSyncResult,
        error: null,
      });

      const result = await accountAggregator.syncAccount('momo-account-id');

      expect(accountAggregator.getAccountById).toHaveBeenCalledWith('momo-account-id');
      expect(mockMtnSyncService.syncAccount).toHaveBeenCalledWith('momo-account-id', undefined);
      expect(result.data).toEqual(mockSyncResult);
      expect(result.error).toBeUndefined();
    });

    it('should handle account not found error', async () => {
      // Mock getAccountById to return null
      jest.spyOn(accountAggregator, 'getAccountById').mockResolvedValue(null);

      const result = await accountAggregator.syncAccount('non-existent-account');

      expect(result.error).toEqual({
        code: 'ACCOUNT_NOT_FOUND',
        message: 'Account not found',
      });
      expect(result.data).toBeUndefined();
    });

    it('should handle unsupported account type', async () => {
      const unsupportedAccount = {
        ...mockBankAccount,
        account_type: 'crypto' as any, // Unsupported type
      };

      jest.spyOn(accountAggregator, 'getAccountById').mockResolvedValue(unsupportedAccount);

      const result = await accountAggregator.syncAccount('unsupported-account');

      expect(result.error).toEqual({
        code: 'UNSUPPORTED_ACCOUNT_TYPE',
        message: 'Unsupported account type: crypto',
      });
      expect(result.data).toBeUndefined();
    });

    it('should pass date range to sync services', async () => {
      const dateRange = {
        startDate: '2023-11-01T00:00:00Z',
        endDate: '2023-11-30T23:59:59Z',
      };

      jest.spyOn(accountAggregator, 'getAccountById').mockResolvedValue(mockBankAccount);
      
      mockMonoSyncService.syncBankAccount.mockResolvedValue({
        data: {
          totalTransactions: 5,
          newTransactions: 5,
          updatedTransactions: 0,
          accountType: 'bank',
          institutionName: 'GCB Bank',
          errors: [],
        },
        error: null,
      });

      await accountAggregator.syncAccount('bank-account-id', dateRange);

      expect(mockMonoSyncService.syncBankAccount).toHaveBeenCalledWith('bank-account-id', dateRange);
    });
  });

  describe('syncAccountWithProgress', () => {
    it('should route bank account sync with progress to Mono service', async () => {
      const onProgress = jest.fn();
      const mockSyncResult = {
        totalTransactions: 12,
        newTransactions: 8,
        updatedTransactions: 4,
        accountType: 'bank' as const,
        institutionName: 'Access Bank',
        errors: [],
      };

      jest.spyOn(accountAggregator, 'getAccountById').mockResolvedValue(mockBankAccount);
      
      mockMonoSyncService.syncBankAccountWithProgress.mockResolvedValue({
        data: mockSyncResult,
        error: null,
      });

      const result = await accountAggregator.syncAccountWithProgress(
        'bank-account-id',
        onProgress
      );

      expect(mockMonoSyncService.syncBankAccountWithProgress).toHaveBeenCalledWith(
        'bank-account-id',
        onProgress,
        undefined
      );
      expect(result.data).toEqual(mockSyncResult);
    });

    it('should route mobile money account sync with progress to MTN service', async () => {
      const onProgress = jest.fn();
      const mockSyncResult = {
        totalTransactions: 6,
        newTransactions: 4,
        updatedTransactions: 2,
        accountType: 'mobile_money' as const,
        institutionName: 'MTN Mobile Money',
        errors: [],
      };

      jest.spyOn(accountAggregator, 'getAccountById').mockResolvedValue(mockMobileMoneyAccount);
      
      mockMtnSyncService.syncAccountWithProgress.mockResolvedValue({
        data: mockSyncResult,
        error: null,
      });

      const result = await accountAggregator.syncAccountWithProgress(
        'momo-account-id',
        onProgress
      );

      expect(mockMtnSyncService.syncAccountWithProgress).toHaveBeenCalledWith(
        'momo-account-id',
        onProgress,
        undefined
      );
      expect(result.data).toEqual(mockSyncResult);
    });

    it('should call progress callback with error when account not found', async () => {
      const onProgress = jest.fn();
      
      jest.spyOn(accountAggregator, 'getAccountById').mockResolvedValue(null);

      const result = await accountAggregator.syncAccountWithProgress(
        'non-existent-account',
        onProgress
      );

      expect(onProgress).toHaveBeenCalledWith({
        status: 'error',
        message: 'Account not found',
        error: 'Account not found',
      });

      expect(result.error).toEqual({
        code: 'ACCOUNT_NOT_FOUND',
        message: 'Account not found',
      });
    });
  });

  describe('validateAccountSync', () => {
    it('should route bank account validation to Mono service', async () => {
      jest.spyOn(accountAggregator, 'getAccountById').mockResolvedValue(mockBankAccount);
      
      mockMonoSyncService.validateBankAccount.mockResolvedValue({
        data: true,
        error: null,
      });

      const result = await accountAggregator.validateAccountSync('bank-account-id');

      expect(mockMonoSyncService.validateBankAccount).toHaveBeenCalledWith('bank-account-id');
      expect(result.data?.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should route mobile money account validation to MTN service', async () => {
      jest.spyOn(accountAggregator, 'getAccountById').mockResolvedValue(mockMobileMoneyAccount);
      
      mockMtnSyncService.validateAccount.mockResolvedValue({
        data: { isValid: true, message: 'Valid account' },
        error: null,
      });

      const result = await accountAggregator.validateAccountSync('momo-account-id');

      expect(mockMtnSyncService.validateAccount).toHaveBeenCalledWith('momo-account-id');
      expect(result.data?.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('getSyncHistory', () => {
    it('should route bank account sync history to Mono service', async () => {
      const mockHistory = [
        {
          id: 'sync-1',
          sync_status: 'success',
          transactions_synced: 15,
          sync_completed_at: '2023-12-01T10:00:00Z',
        },
      ];

      jest.spyOn(accountAggregator, 'getAccountById').mockResolvedValue(mockBankAccount);
      
      mockMonoSyncService.getSyncHistory.mockResolvedValue({
        data: mockHistory,
        error: null,
      });

      const result = await accountAggregator.getSyncHistory('bank-account-id', 5);

      expect(mockMonoSyncService.getSyncHistory).toHaveBeenCalledWith('bank-account-id', 5);
      expect(result.data).toEqual(mockHistory);
    });

    it('should route mobile money account sync history to MTN service', async () => {
      const mockHistory = [
        {
          id: 'sync-2',
          sync_status: 'success',
          transactions_synced: 8,
          sync_completed_at: '2023-12-01T09:30:00Z',
        },
      ];

      jest.spyOn(accountAggregator, 'getAccountById').mockResolvedValue(mockMobileMoneyAccount);
      
      mockMtnSyncService.getSyncHistory.mockResolvedValue({
        data: mockHistory,
        error: null,
      });

      const result = await accountAggregator.getSyncHistory('momo-account-id');

      expect(mockMtnSyncService.getSyncHistory).toHaveBeenCalledWith('momo-account-id', 10);
      expect(result.data).toEqual(mockHistory);
    });
  });
});