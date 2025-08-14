import { useTransactionStore } from '@/stores/transactionStore';
import { transactionsApi } from '@/services/api/transactions';
import type { Transaction } from '@/types/models';

// Mock the transactions API
jest.mock('@/services/api/transactions', () => ({
  transactionsApi: {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockTransactionsApi = transactionsApi as jest.Mocked<typeof transactionsApi>;

describe('useTransactionStore', () => {
  beforeEach(() => {
    // Reset store state
    useTransactionStore.setState({
      transactions: [],
      isLoading: false,
      error: null,
      sortOrder: 'desc',
    });
    jest.clearAllMocks();
  });

  describe('loadTransactions', () => {
    it('should load transactions successfully', async () => {
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          user_id: 'user1',
          amount: 100.50,
          type: 'expense',
          category_id: 'cat1',
          transaction_date: '2024-01-15',
          description: 'Groceries',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          user_id: 'user1',
          amount: 50.00,
          type: 'income',
          category_id: 'cat2',
          transaction_date: '2024-01-10',
          description: 'Freelance',
          created_at: '2024-01-10T10:00:00Z',
          updated_at: '2024-01-10T10:00:00Z',
        }
      ];

      mockTransactionsApi.list.mockResolvedValue({
        data: mockTransactions,
      });

      const { loadTransactions } = useTransactionStore.getState();
      await loadTransactions();

      const state = useTransactionStore.getState();
      expect(state.transactions).toHaveLength(2);
      expect(state.transactions[0].id).toBe('1'); // Newest first (desc sort)
      expect(state.transactions[1].id).toBe('2');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should handle API errors when loading transactions', async () => {
      mockTransactionsApi.list.mockResolvedValue({
        error: { code: 'FETCH_ERROR', message: 'Failed to fetch transactions' },
      });

      const { loadTransactions } = useTransactionStore.getState();
      await loadTransactions();

      const state = useTransactionStore.getState();
      expect(state.transactions).toHaveLength(0);
      expect(state.error).toBe('Failed to fetch transactions');
      expect(state.isLoading).toBe(false);
    });

    it('should sort transactions by date according to sortOrder', async () => {
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          user_id: 'user1',
          amount: 100.50,
          type: 'expense',
          category_id: 'cat1',
          transaction_date: '2024-01-10',
          created_at: '2024-01-10T10:00:00Z',
          updated_at: '2024-01-10T10:00:00Z',
        },
        {
          id: '2',
          user_id: 'user1',
          amount: 50.00,
          type: 'income',
          category_id: 'cat2',
          transaction_date: '2024-01-15',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        }
      ];

      mockTransactionsApi.list.mockResolvedValue({
        data: mockTransactions,
      });

      // Test descending order (default)
      const { loadTransactions } = useTransactionStore.getState();
      await loadTransactions();

      let state = useTransactionStore.getState();
      expect(state.transactions[0].id).toBe('2'); // 2024-01-15 comes first
      expect(state.transactions[1].id).toBe('1'); // 2024-01-10 comes second

      // Test ascending order
      const { setSortOrder } = useTransactionStore.getState();
      setSortOrder('asc');
      await loadTransactions();

      state = useTransactionStore.getState();
      expect(state.transactions[0].id).toBe('1'); // 2024-01-10 comes first
      expect(state.transactions[1].id).toBe('2'); // 2024-01-15 comes second
    });
  });

  describe('createTransaction', () => {
    it('should create transaction successfully', async () => {
      mockTransactionsApi.create.mockResolvedValue({
        data: {
          id: '1',
          user_id: 'user1',
          amount: 100.50,
          type: 'expense',
          category_id: 'cat1',
          transaction_date: '2024-01-15',
          description: 'Groceries',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
      });

      mockTransactionsApi.list.mockResolvedValue({
        data: [],
      });

      const { createTransaction } = useTransactionStore.getState();
      const result = await createTransaction(
        100.50,
        'expense',
        'cat1',
        '2024-01-15',
        'Groceries'
      );

      expect(result).toBe(true);
      expect(mockTransactionsApi.create).toHaveBeenCalledWith({
        amount: 100.50,
        type: 'expense',
        category_id: 'cat1',
        transaction_date: '2024-01-15',
        description: 'Groceries',
      });
      expect(mockTransactionsApi.list).toHaveBeenCalled(); // Should reload after create
    });

    it('should handle create errors', async () => {
      mockTransactionsApi.create.mockResolvedValue({
        error: { code: 'CREATE_ERROR', message: 'Failed to create transaction' },
      });

      const { createTransaction } = useTransactionStore.getState();
      const result = await createTransaction(
        100.50,
        'expense',
        'cat1',
        '2024-01-15',
        'Groceries'
      );

      expect(result).toBe(false);
      
      const state = useTransactionStore.getState();
      expect(state.error).toBe('Failed to create transaction');
    });
  });

  describe('updateTransaction', () => {
    it('should update transaction successfully', async () => {
      mockTransactionsApi.update.mockResolvedValue({
        data: {
          id: '1',
          user_id: 'user1',
          amount: 75.00,
          type: 'expense',
          category_id: 'cat1',
          transaction_date: '2024-01-15',
          description: 'Updated groceries',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T11:00:00Z',
        },
      });

      mockTransactionsApi.list.mockResolvedValue({
        data: [],
      });

      const { updateTransaction } = useTransactionStore.getState();
      const result = await updateTransaction(
        '1',
        75.00,
        'expense',
        'cat1',
        '2024-01-15',
        'Updated groceries'
      );

      expect(result).toBe(true);
      expect(mockTransactionsApi.update).toHaveBeenCalledWith('1', {
        amount: 75.00,
        type: 'expense',
        category_id: 'cat1',
        transaction_date: '2024-01-15',
        description: 'Updated groceries',
      });
      expect(mockTransactionsApi.list).toHaveBeenCalled(); // Should reload after update
    });

    it('should handle partial updates', async () => {
      mockTransactionsApi.update.mockResolvedValue({
        data: {} as Transaction,
      });

      mockTransactionsApi.list.mockResolvedValue({
        data: [],
      });

      const { updateTransaction } = useTransactionStore.getState();
      const result = await updateTransaction(
        '1',
        75.00, // Only update amount
        undefined,
        undefined,
        undefined,
        undefined
      );

      expect(result).toBe(true);
      expect(mockTransactionsApi.update).toHaveBeenCalledWith('1', {
        amount: 75.00,
      });
    });

    it('should handle update errors', async () => {
      mockTransactionsApi.update.mockResolvedValue({
        error: { code: 'UPDATE_ERROR', message: 'Failed to update transaction' },
      });

      const { updateTransaction } = useTransactionStore.getState();
      const result = await updateTransaction('1', 75.00);

      expect(result).toBe(false);
      
      const state = useTransactionStore.getState();
      expect(state.error).toBe('Failed to update transaction');
    });
  });

  describe('deleteTransaction', () => {
    it('should delete transaction successfully', async () => {
      mockTransactionsApi.delete.mockResolvedValue({
        data: undefined,
      });

      mockTransactionsApi.list.mockResolvedValue({
        data: [],
      });

      const { deleteTransaction } = useTransactionStore.getState();
      const result = await deleteTransaction('1');

      expect(result).toBe(true);
      expect(mockTransactionsApi.delete).toHaveBeenCalledWith('1');
      expect(mockTransactionsApi.list).toHaveBeenCalled(); // Should reload after delete
    });

    it('should handle delete errors', async () => {
      mockTransactionsApi.delete.mockResolvedValue({
        error: { code: 'DELETE_ERROR', message: 'Failed to delete transaction' },
      });

      const { deleteTransaction } = useTransactionStore.getState();
      const result = await deleteTransaction('1');

      expect(result).toBe(false);
      
      const state = useTransactionStore.getState();
      expect(state.error).toBe('Failed to delete transaction');
    });
  });

  describe('setSortOrder', () => {
    it('should update sort order and re-sort existing transactions', () => {
      // Setup initial transactions
      const transactions: Transaction[] = [
        {
          id: '1',
          user_id: 'user1',
          amount: 100.50,
          type: 'expense',
          category_id: 'cat1',
          transaction_date: '2024-01-10',
          created_at: '2024-01-10T10:00:00Z',
          updated_at: '2024-01-10T10:00:00Z',
        },
        {
          id: '2',
          user_id: 'user1',
          amount: 50.00,
          type: 'income',
          category_id: 'cat2',
          transaction_date: '2024-01-15',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        }
      ];

      useTransactionStore.setState({
        transactions: [...transactions],
        sortOrder: 'desc',
      });

      const { setSortOrder } = useTransactionStore.getState();
      setSortOrder('asc');

      const state = useTransactionStore.getState();
      expect(state.sortOrder).toBe('asc');
      expect(state.transactions[0].id).toBe('1'); // Earlier date comes first in asc
      expect(state.transactions[1].id).toBe('2');
    });
  });

  describe('error handling', () => {
    it('should set and clear errors', () => {
      const { setError, clearError } = useTransactionStore.getState();
      
      setError('Test error');
      expect(useTransactionStore.getState().error).toBe('Test error');
      
      clearError();
      expect(useTransactionStore.getState().error).toBe(null);
    });
  });

  describe('loading state', () => {
    it('should set and clear loading state', () => {
      const { setLoading } = useTransactionStore.getState();
      
      setLoading(true);
      expect(useTransactionStore.getState().isLoading).toBe(true);
      
      setLoading(false);
      expect(useTransactionStore.getState().isLoading).toBe(false);
    });
  });
});