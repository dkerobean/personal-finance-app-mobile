/**
 * Integration tests for budget alert functionality
 * Tests the complete flow from transaction changes to alert processing
 */
import { transactionsApi } from '@/services/api/transactions';
import { alertProcessingService } from '@/services/alertProcessingService';
import { supabase } from '@/services/supabaseClient';
import type { Transaction } from '@/types/models';

// Mock dependencies
jest.mock('@/services/supabaseClient');
jest.mock('@/services/alertProcessingService');

const mockedSupabase = supabase as jest.Mocked<typeof supabase>;
const mockedAlertProcessingService = alertProcessingService as jest.Mocked<typeof alertProcessingService>;

describe('Budget Alert Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth to return a valid user
    mockedSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    } as any);

    mockedSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    } as any);
  });

  describe('Transaction Creation Alert Integration', () => {
    it('should trigger alert processing when creating expense transaction', async () => {
      const newTransaction: Transaction = {
        id: 'tx-1',
        user_id: 'user-1',
        amount: 150,
        type: 'expense',
        category_id: 'cat-food',
        transaction_date: '2024-01-15',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      // Mock successful transaction creation
      mockedSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: newTransaction,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await transactionsApi.create({
        amount: 150,
        type: 'expense',
        category_id: 'cat-food',
        transaction_date: '2024-01-15',
        description: 'Grocery shopping',
      });

      expect(result.data).toEqual(newTransaction);
      expect(mockedAlertProcessingService.onTransactionCreated).toHaveBeenCalledWith(newTransaction);
    });

    it('should not trigger alert processing for income transactions', async () => {
      const newTransaction: Transaction = {
        id: 'tx-1',
        user_id: 'user-1',
        amount: 1000,
        type: 'income',
        category_id: 'cat-salary',
        transaction_date: '2024-01-15',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      mockedSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: newTransaction,
              error: null,
            }),
          }),
        }),
      } as any);

      await transactionsApi.create({
        amount: 1000,
        type: 'income',
        category_id: 'cat-salary',
        transaction_date: '2024-01-15',
      });

      expect(mockedAlertProcessingService.onTransactionCreated).not.toHaveBeenCalled();
    });
  });

  describe('Transaction Update Alert Integration', () => {
    it('should trigger alert processing when updating transaction amount', async () => {
      const originalTransaction: Transaction = {
        id: 'tx-1',
        user_id: 'user-1',
        amount: 100,
        type: 'expense',
        category_id: 'cat-food',
        transaction_date: '2024-01-15',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const updatedTransaction: Transaction = {
        ...originalTransaction,
        amount: 200,
        updated_at: '2024-01-15T11:00:00Z',
      };

      // Mock getById to return original transaction
      const getByIdMock = jest.spyOn(transactionsApi, 'getById');
      getByIdMock.mockResolvedValue({
        data: originalTransaction,
        error: null,
      });

      // Mock update operation
      mockedSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedTransaction,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      await transactionsApi.update('tx-1', { amount: 200 });

      expect(mockedAlertProcessingService.onTransactionUpdated).toHaveBeenCalledWith(
        'tx-1',
        originalTransaction,
        updatedTransaction
      );

      getByIdMock.mockRestore();
    });

    it('should trigger alert processing when changing transaction category', async () => {
      const originalTransaction: Transaction = {
        id: 'tx-1',
        user_id: 'user-1',
        amount: 100,
        type: 'expense',
        category_id: 'cat-food',
        transaction_date: '2024-01-15',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const updatedTransaction: Transaction = {
        ...originalTransaction,
        category_id: 'cat-entertainment',
        updated_at: '2024-01-15T11:00:00Z',
      };

      const getByIdMock = jest.spyOn(transactionsApi, 'getById');
      getByIdMock.mockResolvedValue({
        data: originalTransaction,
        error: null,
      });

      mockedSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedTransaction,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      await transactionsApi.update('tx-1', { category_id: 'cat-entertainment' });

      expect(mockedAlertProcessingService.onTransactionUpdated).toHaveBeenCalledWith(
        'tx-1',
        originalTransaction,
        updatedTransaction
      );

      getByIdMock.mockRestore();
    });
  });

  describe('Transaction Deletion Alert Integration', () => {
    it('should trigger alert processing when deleting expense transaction', async () => {
      const transactionToDelete: Transaction = {
        id: 'tx-1',
        user_id: 'user-1',
        amount: 100,
        type: 'expense',
        category_id: 'cat-food',
        transaction_date: '2024-01-15',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      // Mock getById to return transaction before deletion
      const getByIdMock = jest.spyOn(transactionsApi, 'getById');
      getByIdMock.mockResolvedValue({
        data: transactionToDelete,
        error: null,
      });

      // Mock delete operation
      mockedSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any);

      await transactionsApi.delete('tx-1');

      expect(mockedAlertProcessingService.onTransactionDeleted).toHaveBeenCalledWith(transactionToDelete);

      getByIdMock.mockRestore();
    });
  });

  describe('Bulk Operations Alert Integration', () => {
    it('should trigger alert processing for bulk recategorization', async () => {
      // Mock bulk update operations
      mockedSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any);

      await transactionsApi.bulkRecategorize(['tx-1', 'tx-2', 'tx-3'], 'cat-new');

      expect(mockedAlertProcessingService.onBulkTransactionChanges).toHaveBeenCalledWith(
        'user-1',
        ['cat-new']
      );
    });
  });

  describe('Alert Processing Error Handling', () => {
    it('should not fail transaction operations when alert processing fails', async () => {
      const newTransaction: Transaction = {
        id: 'tx-1',
        user_id: 'user-1',
        amount: 150,
        type: 'expense',
        category_id: 'cat-food',
        transaction_date: '2024-01-15',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      // Mock alert processing to fail
      mockedAlertProcessingService.onTransactionCreated.mockRejectedValue(
        new Error('Alert processing failed')
      );

      mockedSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: newTransaction,
              error: null,
            }),
          }),
        }),
      } as any);

      // Transaction should still succeed even if alert processing fails
      const result = await transactionsApi.create({
        amount: 150,
        type: 'expense',
        category_id: 'cat-food',
        transaction_date: '2024-01-15',
      });

      expect(result.data).toEqual(newTransaction);
      expect(result.error).toBeNull();
    });
  });

  describe('Real-time Alert Scenarios', () => {
    it('should handle rapid consecutive transaction changes', async () => {
      // Simulate rapid transactions that might trigger budget alerts
      const transactions = [
        { amount: 100, description: 'Coffee' },
        { amount: 150, description: 'Lunch' },
        { amount: 200, description: 'Groceries' },
      ];

      for (const tx of transactions) {
        const newTransaction: Transaction = {
          id: `tx-${Date.now()}`,
          user_id: 'user-1',
          amount: tx.amount,
          type: 'expense',
          category_id: 'cat-food',
          transaction_date: '2024-01-15',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          description: tx.description,
        };

        mockedSupabase.from.mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: newTransaction,
                error: null,
              }),
            }),
          }),
        } as any);

        await transactionsApi.create({
          amount: tx.amount,
          type: 'expense',
          category_id: 'cat-food',
          transaction_date: '2024-01-15',
          description: tx.description,
        });
      }

      // Should trigger alert processing for each transaction
      expect(mockedAlertProcessingService.onTransactionCreated).toHaveBeenCalledTimes(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle transactions without categories gracefully', async () => {
      const newTransaction: Transaction = {
        id: 'tx-1',
        user_id: 'user-1',
        amount: 150,
        type: 'expense',
        category_id: 'uncategorized',
        transaction_date: '2024-01-15',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      mockedSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: newTransaction,
              error: null,
            }),
          }),
        }),
      } as any);

      await transactionsApi.create({
        amount: 150,
        type: 'expense',
        category_id: 'uncategorized',
        transaction_date: '2024-01-15',
      });

      expect(mockedAlertProcessingService.onTransactionCreated).toHaveBeenCalledWith(newTransaction);
    });

    it('should handle transactions with zero amounts', async () => {
      const newTransaction: Transaction = {
        id: 'tx-1',
        user_id: 'user-1',
        amount: 0,
        type: 'expense',
        category_id: 'cat-food',
        transaction_date: '2024-01-15',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      mockedSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: newTransaction,
              error: null,
            }),
          }),
        }),
      } as any);

      await transactionsApi.create({
        amount: 0,
        type: 'expense',
        category_id: 'cat-food',
        transaction_date: '2024-01-15',
      });

      // Should still trigger alert processing (zero amounts might affect budget calculations)
      expect(mockedAlertProcessingService.onTransactionCreated).toHaveBeenCalledWith(newTransaction);
    });
  });
});