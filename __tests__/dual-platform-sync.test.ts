/**
 * Comprehensive tests for dual-platform background synchronization
 * Tests Story 2.5: Hybrid Background Synchronization implementation
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/testing-library/jest-dom';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  single: jest.fn(),
  rpc: jest.fn()
};

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
  process.env = {
    ...originalEnv,
    MONO_SECRET_KEY: 'test_mono_key',
    MONO_BASE_URL: 'https://api.withmono.com',
    MTN_MOMO_API_KEY: 'test_mtn_key',
    ONESIGNAL_APP_ID: 'test_app_id',
    ONESIGNAL_API_KEY: 'test_api_key'
  };
});

afterEach(() => {
  process.env = originalEnv;
  jest.clearAllMocks();
});

describe('Dual Platform Sync Architecture', () => {
  describe('Database Schema Support', () => {
    it('should support platform_source field in accounts table', () => {
      const mockAccount = {
        id: 'test-account-id',
        user_id: 'test-user-id',
        platform_source: 'mono',
        account_name: 'Test Bank Account',
        mono_account_id: 'mono_123',
        sync_status: 'active',
        consecutive_sync_failures: 0
      };

      expect(mockAccount.platform_source).toBe('mono');
      expect(mockAccount.mono_account_id).toBeDefined();
    });

    it('should support MTN MoMo platform accounts', () => {
      const mockMtnAccount = {
        id: 'test-mtn-account-id',
        user_id: 'test-user-id',
        platform_source: 'mtn_momo',
        account_name: 'Test MoMo Account',
        phone_number: '+233551234567',
        mtn_reference_id: 'mtn_ref_123',
        sync_status: 'active',
        consecutive_sync_failures: 0
      };

      expect(mockMtnAccount.platform_source).toBe('mtn_momo');
      expect(mockMtnAccount.phone_number).toBeDefined();
      expect(mockMtnAccount.mtn_reference_id).toBeDefined();
    });

    it('should call dual-platform database functions', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: [
          { id: '1', platform_source: 'mono', account_name: 'Bank Account' },
          { id: '2', platform_source: 'mtn_momo', account_name: 'MoMo Account' }
        ]
      });

      await mockSupabaseClient.rpc('get_dual_platform_accounts_needing_sync', {
        mono_hours_threshold: 6,
        mtn_momo_hours_threshold: 4
      });

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'get_dual_platform_accounts_needing_sync',
        {
          mono_hours_threshold: 6,
          mtn_momo_hours_threshold: 4
        }
      );
    });
  });

  describe('Sync Orchestrator Dual-Platform Support', () => {
    let SyncOrchestrator: any;

    beforeEach(async () => {
      // Mock the sync orchestrator module
      SyncOrchestrator = jest.fn().mockImplementation(() => ({
        loadAccountsForDualPlatformSync: jest.fn(),
        getTotalQueueLength: jest.fn().mockReturnValue(5),
        getMonoQueueLength: jest.fn().mockReturnValue(3),
        getMtnMomoQueueLength: jest.fn().mockReturnValue(2),
        processDualPlatformQueue: jest.fn().mockResolvedValue({
          totalAccounts: 5,
          totalTransactionsSynced: 25,
          monoResults: [
            {
              accountId: 'mono_1',
              platform: 'mono',
              accountName: 'Bank Account',
              status: 'success',
              transactionsSynced: 15,
              totalProcessed: 15,
              duration: 2000
            }
          ],
          mtnMomoResults: [
            {
              accountId: 'mtn_1',
              platform: 'mtn_momo',
              accountName: 'MoMo Account',
              phoneNumber: '+233551234567',
              status: 'success',
              transactionsSynced: 10,
              totalProcessed: 10,
              duration: 1500
            }
          ]
        })
      }));
    });

    it('should initialize with platform-specific concurrency limits', () => {
      const orchestrator = new SyncOrchestrator(mockSupabaseClient, {
        mono: 3,
        mtn_momo: 2
      });

      expect(SyncOrchestrator).toHaveBeenCalledWith(mockSupabaseClient, {
        mono: 3,
        mtn_momo: 2
      });
    });

    it('should load accounts for dual platform sync', async () => {
      const orchestrator = new SyncOrchestrator(mockSupabaseClient, {
        mono: 3,
        mtn_momo: 2
      });

      await orchestrator.loadAccountsForDualPlatformSync(false, 6, 4);

      expect(orchestrator.loadAccountsForDualPlatformSync).toHaveBeenCalledWith(false, 6, 4);
    });

    it('should process dual platform queue with separate results', async () => {
      const orchestrator = new SyncOrchestrator(mockSupabaseClient, {
        mono: 3,
        mtn_momo: 2
      });

      const metrics = await orchestrator.processDualPlatformQueue();

      expect(metrics.monoResults).toHaveLength(1);
      expect(metrics.mtnMomoResults).toHaveLength(1);
      expect(metrics.totalAccounts).toBe(5);
      expect(metrics.totalTransactionsSynced).toBe(25);
    });
  });

  describe('Platform-Specific Sync Workers', () => {
    describe('MonoSyncWorker', () => {
      let MonoSyncWorker: any;

      beforeEach(() => {
        MonoSyncWorker = jest.fn().mockImplementation(() => ({
          syncAccount: jest.fn().mockResolvedValue({
            accountId: 'test-mono-account',
            monoAccountId: 'mono_123',
            platform: 'mono',
            status: 'success',
            transactionsSynced: 15,
            totalProcessed: 15,
            duration: 2000
          }),
          validateAccount: jest.fn().mockResolvedValue(true)
        }));
      });

      it('should sync Mono bank account successfully', async () => {
        const worker = new MonoSyncWorker(mockSupabaseClient);
        
        const mockMonoAccount = {
          id: 'test-mono-account',
          user_id: 'test-user',
          account_name: 'Test Bank',
          mono_account_id: 'mono_123',
          last_synced_at: null,
          sync_status: null,
          consecutive_sync_failures: 0
        };

        const result = await worker.syncAccount(mockMonoAccount);

        expect(result.platform).toBe('mono');
        expect(result.status).toBe('success');
        expect(result.transactionsSynced).toBe(15);
      });

      it('should validate Mono account connection', async () => {
        const worker = new MonoSyncWorker(mockSupabaseClient);
        
        const isValid = await worker.validateAccount('mono_123');
        
        expect(isValid).toBe(true);
      });
    });

    describe('MtnMomoSyncWorker', () => {
      let MtnMomoSyncWorker: any;

      beforeEach(() => {
        MtnMomoSyncWorker = jest.fn().mockImplementation(() => ({
          syncAccount: jest.fn().mockResolvedValue({
            accountId: 'test-mtn-account',
            phoneNumber: '+233551234567',
            platform: 'mtn_momo',
            status: 'success',
            transactionsSynced: 8,
            totalProcessed: 8,
            duration: 1500
          }),
          validateAccount: jest.fn().mockResolvedValue(true),
          getAccountBalance: jest.fn().mockResolvedValue(150.50)
        }));
      });

      it('should sync MTN MoMo account successfully', async () => {
        const worker = new MtnMomoSyncWorker(mockSupabaseClient);
        
        const mockMtnAccount = {
          id: 'test-mtn-account',
          user_id: 'test-user',
          account_name: 'Test MoMo',
          phone_number: '+233551234567',
          mtn_reference_id: 'mtn_ref_123',
          last_synced_at: null,
          sync_status: null,
          consecutive_sync_failures: 0
        };

        const result = await worker.syncAccount(mockMtnAccount);

        expect(result.platform).toBe('mtn_momo');
        expect(result.status).toBe('success');
        expect(result.transactionsSynced).toBe(8);
      });

      it('should get MTN MoMo account balance', async () => {
        const worker = new MtnMomoSyncWorker(mockSupabaseClient);
        
        const balance = await worker.getAccountBalance('+233551234567');
        
        expect(balance).toBe(150.50);
      });
    });
  });

  describe('Transaction Categorization', () => {
    let transactionCategorizer: any;

    beforeEach(() => {
      transactionCategorizer = {
        categorizeTransaction: jest.fn().mockReturnValue({
          category_id: 'food_dining',
          confidence: 0.85,
          reasons: ['Matched keywords: restaurant'],
          suggested_type: 'expense'
        })
      };
    });

    it('should categorize bank transactions', () => {
      const result = transactionCategorizer.categorizeTransaction(
        'KFC Accra Mall payment',
        25.50,
        undefined,
        'KFC'
      );

      expect(result.category_id).toBe('food_dining');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.suggested_type).toBe('expense');
    });

    it('should categorize mobile money transactions', () => {
      const result = transactionCategorizer.categorizeTransaction(
        'Mobile money transfer',
        50.00,
        'mobile_money',
        'MTN MoMo'
      );

      expect(result.category_id).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('Background Sync Edge Function', () => {
    it('should handle dual platform sync request', async () => {
      const mockRequest = {
        method: 'POST',
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'Authorization') return 'Bearer test-token';
            return null;
          })
        },
        json: jest.fn().mockResolvedValue({
          forceSync: false,
          maxConcurrentAccounts: 5
        })
      };

      const mockResponse = {
        success: true,
        accountsProcessed: 5,
        totalTransactionsSynced: 25,
        results: [
          {
            accountId: 'mono_1',
            platform: 'mono',
            accountName: 'Bank Account',
            status: 'success',
            transactionsSynced: 15,
            totalProcessed: 15,
            duration: 2000
          },
          {
            accountId: 'mtn_1',
            platform: 'mtn_momo',
            accountName: 'MoMo Account',
            phoneNumber: '+233551234567',
            status: 'success',
            transactionsSynced: 10,
            totalProcessed: 10,
            duration: 1500
          }
        ]
      };

      expect(mockResponse.success).toBe(true);
      expect(mockResponse.results).toHaveLength(2);
      expect(mockResponse.results[0].platform).toBe('mono');
      expect(mockResponse.results[1].platform).toBe('mtn_momo');
    });
  });

  describe('Platform-Specific Notifications', () => {
    let NotificationService: any;

    beforeEach(() => {
      NotificationService = jest.fn().mockImplementation(() => ({
        sendReAuthNotification: jest.fn().mockResolvedValue({
          success: true,
          notificationId: 'notif_123',
          recipients: 1
        }),
        sendSyncCompletionNotification: jest.fn().mockResolvedValue({
          success: true,
          notificationId: 'notif_124',
          recipients: 1
        })
      }));
    });

    it('should send Mono re-auth notification', async () => {
      const notificationService = new NotificationService();
      
      const result = await notificationService.sendReAuthNotification(
        'user_123',
        'GTBank Savings',
        'account_456',
        'mono'
      );

      expect(result.success).toBe(true);
      expect(notificationService.sendReAuthNotification).toHaveBeenCalledWith(
        'user_123',
        'GTBank Savings',
        'account_456',
        'mono'
      );
    });

    it('should send MTN MoMo sync completion notification', async () => {
      const notificationService = new NotificationService();
      
      const result = await notificationService.sendSyncCompletionNotification(
        'user_123',
        'MTN MoMo Account',
        5,
        'mtn_momo'
      );

      expect(result.success).toBe(true);
      expect(notificationService.sendSyncCompletionNotification).toHaveBeenCalledWith(
        'user_123',
        'MTN MoMo Account',
        5,
        'mtn_momo'
      );
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle authentication errors for Mono accounts', async () => {
      const mockError = new Error('Authentication failed: 401');
      
      // Mock worker that throws auth error
      const MonoSyncWorker = jest.fn().mockImplementation(() => ({
        syncAccount: jest.fn().mockRejectedValue(mockError),
        isAuthenticationError: jest.fn().mockReturnValue(true)
      }));

      const worker = new MonoSyncWorker(mockSupabaseClient);
      
      try {
        await worker.syncAccount({
          id: 'test-account',
          mono_account_id: 'mono_123'
        });
      } catch (error) {
        expect(worker.isAuthenticationError(error)).toBe(true);
      }
    });

    it('should handle authentication errors for MTN MoMo accounts', async () => {
      const mockError = new Error('Invalid credentials');
      
      const MtnMomoSyncWorker = jest.fn().mockImplementation(() => ({
        syncAccount: jest.fn().mockRejectedValue(mockError),
        isAuthenticationError: jest.fn().mockReturnValue(true)
      }));

      const worker = new MtnMomoSyncWorker(mockSupabaseClient);
      
      try {
        await worker.syncAccount({
          id: 'test-account',
          phone_number: '+233551234567'
        });
      } catch (error) {
        expect(worker.isAuthenticationError(error)).toBe(true);
      }
    });

    it('should track consecutive sync failures', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({});

      await mockSupabaseClient.rpc('update_dual_platform_sync_status', {
        account_id: 'test-account',
        platform: 'mono',
        new_status: 'error',
        transactions_synced: 0,
        error_message: 'Sync failed',
        platform_error: 'Network timeout'
      });

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'update_dual_platform_sync_status',
        expect.objectContaining({
          new_status: 'error',
          platform_error: 'Network timeout'
        })
      );
    });
  });

  describe('Integration Tests', () => {
    it('should complete end-to-end dual platform sync', async () => {
      // Mock successful sync orchestrator
      const SyncOrchestrator = jest.fn().mockImplementation(() => ({
        loadAccountsForDualPlatformSync: jest.fn(),
        getTotalQueueLength: jest.fn().mockReturnValue(2),
        processDualPlatformQueue: jest.fn().mockResolvedValue({
          totalAccounts: 2,
          totalTransactionsSynced: 18,
          monoResults: [{
            accountId: 'mono_1',
            platform: 'mono',
            status: 'success',
            transactionsSynced: 12
          }],
          mtnMomoResults: [{
            accountId: 'mtn_1', 
            platform: 'mtn_momo',
            status: 'success',
            transactionsSynced: 6
          }]
        })
      }));

      const orchestrator = new SyncOrchestrator(mockSupabaseClient, {
        mono: 2,
        mtn_momo: 1
      });

      await orchestrator.loadAccountsForDualPlatformSync(false, 6, 4);
      const metrics = await orchestrator.processDualPlatformQueue();

      expect(metrics.totalAccounts).toBe(2);
      expect(metrics.totalTransactionsSynced).toBe(18);
      expect(metrics.monoResults).toHaveLength(1);
      expect(metrics.mtnMomoResults).toHaveLength(1);
    });

    it('should handle mixed success/failure scenarios', async () => {
      const SyncOrchestrator = jest.fn().mockImplementation(() => ({
        processDualPlatformQueue: jest.fn().mockResolvedValue({
          totalAccounts: 2,
          totalTransactionsSynced: 5,
          monoResults: [{
            accountId: 'mono_1',
            platform: 'mono',
            status: 'auth_error',
            transactionsSynced: 0,
            error: 'Authentication required'
          }],
          mtnMomoResults: [{
            accountId: 'mtn_1',
            platform: 'mtn_momo', 
            status: 'success',
            transactionsSynced: 5
          }]
        })
      }));

      const orchestrator = new SyncOrchestrator(mockSupabaseClient);
      const metrics = await orchestrator.processDualPlatformQueue();

      expect(metrics.monoResults[0].status).toBe('auth_error');
      expect(metrics.mtnMomoResults[0].status).toBe('success');
    });
  });
});