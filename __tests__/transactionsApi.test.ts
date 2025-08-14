import { transactionsApi } from '@/services/api/transactions';
import { supabase } from '@/services/supabaseClient';
import type { Transaction } from '@/types/models';

// Mock Supabase client
jest.mock('@/services/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock API client utilities
jest.mock('@/services/apiClient', () => ({
  handleApiError: jest.fn((error) => error.message || 'API Error'),
  createApiResponse: jest.fn((data, error) => ({ data, error })),
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('transactionsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should fetch transactions successfully', async () => {
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
          category: {
            id: 'cat1',
            user_id: 'user1',
            name: 'Food',
            icon_name: 'restaurant',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          }
        }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockTransactions,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await transactionsApi.list();

      expect(mockSupabase.from).toHaveBeenCalledWith('transactions');
      expect(mockQuery.select).toHaveBeenCalledWith(`
          *,
          category:categories(*)
        `);
      expect(mockQuery.order).toHaveBeenCalledWith('transaction_date', { ascending: false });
      expect(result.data).toEqual(mockTransactions);
      expect(result.error).toBeUndefined();
    });

    it('should handle API errors', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await transactionsApi.list();

      expect(result.data).toEqual([]);
      expect(result.error).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create transaction successfully', async () => {
      const mockTransaction: Transaction = {
        id: '1',
        user_id: 'user1',
        amount: 50.00,
        type: 'income',
        category_id: 'cat1',
        transaction_date: '2024-01-15',
        description: 'Salary',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockTransaction,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const createRequest = {
        amount: 50.00,
        type: 'income' as const,
        category_id: 'cat1',
        transaction_date: '2024-01-15',
        description: 'Salary',
      };

      const result = await transactionsApi.create(createRequest);

      expect(mockSupabase.from).toHaveBeenCalledWith('transactions');
      expect(mockQuery.insert).toHaveBeenCalledWith({
        amount: 50.00,
        type: 'income',
        category_id: 'cat1',
        transaction_date: '2024-01-15',
        description: 'Salary',
      });
      expect(result.data).toEqual(mockTransaction);
      expect(result.error).toBeUndefined();
    });

    it('should handle create errors', async () => {
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' },
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const createRequest = {
        amount: 50.00,
        type: 'income' as const,
        category_id: 'cat1',
        transaction_date: '2024-01-15',
        description: 'Salary',
      };

      const result = await transactionsApi.create(createRequest);

      expect(result.error).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update transaction successfully', async () => {
      const mockTransaction: Transaction = {
        id: '1',
        user_id: 'user1',
        amount: 75.00,
        type: 'expense',
        category_id: 'cat1',
        transaction_date: '2024-01-15',
        description: 'Updated groceries',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T11:00:00Z',
      };

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockTransaction,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const updateRequest = {
        amount: 75.00,
        description: 'Updated groceries',
      };

      const result = await transactionsApi.update('1', updateRequest);

      expect(mockSupabase.from).toHaveBeenCalledWith('transactions');
      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 75.00,
          description: 'Updated groceries',
          updated_at: expect.any(String),
        })
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(result.data).toEqual(mockTransaction);
      expect(result.error).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should delete transaction successfully', async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await transactionsApi.delete('1');

      expect(mockSupabase.from).toHaveBeenCalledWith('transactions');
      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(result.error).toBeUndefined();
    });

    it('should handle delete errors', async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Delete failed' },
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await transactionsApi.delete('1');

      expect(result.error).toBeDefined();
    });
  });

  describe('getById', () => {
    it('should fetch transaction by ID successfully', async () => {
      const mockTransaction: Transaction = {
        id: '1',
        user_id: 'user1',
        amount: 100.50,
        type: 'expense',
        category_id: 'cat1',
        transaction_date: '2024-01-15',
        description: 'Groceries',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        category: {
          id: 'cat1',
          user_id: 'user1',
          name: 'Food',
          icon_name: 'restaurant',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        }
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockTransaction,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await transactionsApi.getById('1');

      expect(mockSupabase.from).toHaveBeenCalledWith('transactions');
      expect(mockQuery.select).toHaveBeenCalledWith(`
          *,
          category:categories(*)
        `);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(result.data).toEqual(mockTransaction);
      expect(result.error).toBeUndefined();
    });

    it('should handle not found errors', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Transaction not found' },
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await transactionsApi.getById('999');

      expect(result.error).toBeDefined();
    });
  });
});