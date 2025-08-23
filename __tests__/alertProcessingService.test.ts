import { alertProcessingService } from '@/services/alertProcessingService';
import { supabase } from '@/services/supabaseClient';
import type { Transaction } from '@/types/models';

// Mock Supabase
jest.mock('@/services/supabaseClient', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}));

const mockedSupabase = supabase as any;

describe('AlertProcessingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    
    // Reset the processing queue
    alertProcessingService.cleanup();
  });

  afterEach(() => {
    jest.useRealTimers();
    alertProcessingService.cleanup();
  });

  describe('onTransactionCreated', () => {
    it('should trigger alert processing for expense transactions', async () => {
      const expenseTransaction: Transaction = {
        id: 'tx-1',
        user_id: 'user-1',
        amount: 100,
        type: 'expense',
        category_id: 'cat-1',
        transaction_date: '2024-01-01',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockedSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, alerts_sent: 1 },
        error: null,
      });

      alertProcessingService.onTransactionCreated(expenseTransaction);

      // Fast-forward timers to trigger the delayed processing
      jest.advanceTimersByTime(5000);

      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockedSupabase.functions.invoke).toHaveBeenCalledWith('budget-alerts', {
        body: {
          type: 'transaction_change',
          user_id: 'user-1',
          transaction_id: 'tx-1'
        }
      });
    });

    it('should not trigger alert processing for income transactions', async () => {
      const incomeTransaction: Transaction = {
        id: 'tx-1',
        user_id: 'user-1',
        amount: 100,
        type: 'income',
        category_id: 'cat-1',
        transaction_date: '2024-01-01',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      alertProcessingService.onTransactionCreated(incomeTransaction);

      // Fast-forward timers
      jest.advanceTimersByTime(5000);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockedSupabase.functions.invoke).not.toHaveBeenCalled();
    });
  });

  describe('onTransactionUpdated', () => {
    it('should trigger alert processing when amount changes', async () => {
      const oldTransaction: Transaction = {
        id: 'tx-1',
        user_id: 'user-1',
        amount: 100,
        type: 'expense',
        category_id: 'cat-1',
        transaction_date: '2024-01-01',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const newTransaction: Transaction = {
        ...oldTransaction,
        amount: 200,
        updated_at: '2024-01-01T01:00:00Z',
      };

      mockedSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, alerts_sent: 0 },
        error: null,
      });

      alertProcessingService.onTransactionUpdated('tx-1', oldTransaction, newTransaction);

      jest.advanceTimersByTime(5000);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockedSupabase.functions.invoke).toHaveBeenCalledWith('budget-alerts', {
        body: {
          type: 'transaction_change',
          user_id: 'user-1',
          transaction_id: 'tx-1'
        }
      });
    });

    it('should trigger alert processing when category changes', async () => {
      const oldTransaction: Transaction = {
        id: 'tx-1',
        user_id: 'user-1',
        amount: 100,
        type: 'expense',
        category_id: 'cat-1',
        transaction_date: '2024-01-01',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const newTransaction: Transaction = {
        ...oldTransaction,
        category_id: 'cat-2',
        updated_at: '2024-01-01T01:00:00Z',
      };

      mockedSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, alerts_sent: 0 },
        error: null,
      });

      alertProcessingService.onTransactionUpdated('tx-1', oldTransaction, newTransaction);

      jest.advanceTimersByTime(5000);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockedSupabase.functions.invoke).toHaveBeenCalled();
    });

    it('should not trigger alert processing when only description changes', async () => {
      const oldTransaction: Transaction = {
        id: 'tx-1',
        user_id: 'user-1',
        amount: 100,
        type: 'expense',
        category_id: 'cat-1',
        transaction_date: '2024-01-01',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        description: 'Old description',
      };

      const newTransaction: Transaction = {
        ...oldTransaction,
        description: 'New description',
        updated_at: '2024-01-01T01:00:00Z',
      };

      alertProcessingService.onTransactionUpdated('tx-1', oldTransaction, newTransaction);

      jest.advanceTimersByTime(5000);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockedSupabase.functions.invoke).not.toHaveBeenCalled();
    });
  });

  describe('onTransactionDeleted', () => {
    it('should trigger alert processing for deleted expense transactions', async () => {
      const deletedTransaction: Transaction = {
        id: 'tx-1',
        user_id: 'user-1',
        amount: 100,
        type: 'expense',
        category_id: 'cat-1',
        transaction_date: '2024-01-01',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockedSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, alerts_sent: 0 },
        error: null,
      });

      alertProcessingService.onTransactionDeleted(deletedTransaction);

      jest.advanceTimersByTime(5000);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockedSupabase.functions.invoke).toHaveBeenCalledWith('budget-alerts', {
        body: {
          type: 'transaction_change',
          user_id: 'user-1',
          transaction_id: 'tx-1'
        }
      });
    });
  });

  describe('onBulkTransactionChanges', () => {
    it('should trigger alert processing with longer delay for bulk operations', async () => {
      mockedSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, alerts_sent: 0 },
        error: null,
      });

      alertProcessingService.onBulkTransactionChanges('user-1', ['cat-1', 'cat-2']);

      // Should not trigger with normal delay
      jest.advanceTimersByTime(5000);
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(mockedSupabase.functions.invoke).not.toHaveBeenCalled();

      // Should trigger with bulk delay
      jest.advanceTimersByTime(5000); // Total 10 seconds
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockedSupabase.functions.invoke).toHaveBeenCalledWith('budget-alerts', {
        body: {
          type: 'transaction_change',
          user_id: 'user-1',
          transaction_id: undefined
        }
      });
    });
  });

  describe('processAlertsForBudget', () => {
    it('should process alerts for specific budget immediately', async () => {
      mockedSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, alerts_sent: 1 },
        error: null,
      });

      const result = await alertProcessingService.processAlertsForBudget('budget-1');

      expect(result).toBe(true);
      expect(mockedSupabase.functions.invoke).toHaveBeenCalledWith('budget-alerts', {
        body: {
          type: 'manual_check',
          budget_id: 'budget-1',
          force_check: true
        }
      });
    });

    it('should handle processing errors', async () => {
      mockedSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Processing failed' },
      });

      const result = await alertProcessingService.processAlertsForBudget('budget-1');

      expect(result).toBe(false);
    });
  });

  describe('batching behavior', () => {
    it('should batch multiple rapid requests for the same user', async () => {
      mockedSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, alerts_sent: 0 },
        error: null,
      });

      // Trigger multiple rapid requests
      alertProcessingService.triggerAlertProcessing({ userId: 'user-1' });
      alertProcessingService.triggerAlertProcessing({ userId: 'user-1' });
      alertProcessingService.triggerAlertProcessing({ userId: 'user-1' });

      jest.advanceTimersByTime(5000);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Should only make one API call despite multiple triggers
      expect(mockedSupabase.functions.invoke).toHaveBeenCalledTimes(1);
    });

    it('should handle separate users independently', async () => {
      mockedSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, alerts_sent: 0 },
        error: null,
      });

      // Trigger requests for different users
      alertProcessingService.triggerAlertProcessing({ userId: 'user-1' });
      alertProcessingService.triggerAlertProcessing({ userId: 'user-2' });

      jest.advanceTimersByTime(5000);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Should make separate API calls for different users
      expect(mockedSupabase.functions.invoke).toHaveBeenCalledTimes(2);
    });
  });

  describe('cleanup', () => {
    it('should clear all pending timeouts', () => {
      // Trigger some processing
      alertProcessingService.triggerAlertProcessing({ userId: 'user-1' });
      alertProcessingService.triggerAlertProcessing({ userId: 'user-2' });

      // Cleanup should clear all timeouts
      alertProcessingService.cleanup();

      // Advance timers - should not trigger any processing
      jest.advanceTimersByTime(10000);

      expect(mockedSupabase.functions.invoke).not.toHaveBeenCalled();
    });
  });
});