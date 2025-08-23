import { transactionsApi } from '@/services/api/transactions';
import { supabase } from '@/services/supabaseClient';

// Mock Supabase
jest.mock('@/services/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Bulk Categorization API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('bulkRecategorize', () => {
    it('should successfully recategorize multiple transactions', async () => {
      const transactionIds = ['tx-1', 'tx-2', 'tx-3'];
      const newCategoryId = 'cat-food';

      // Mock Supabase chain methods
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      
      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);
      
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });

      const result = await transactionsApi.bulkRecategorize(transactionIds, newCategoryId);

      expect(result.error).toBeUndefined();
      expect(result.data?.updated).toBe(3);
      expect(result.data?.errors).toHaveLength(0);

      // Verify all transactions were updated
      expect(mockSupabase.from).toHaveBeenCalledTimes(3);
      expect(mockUpdate).toHaveBeenCalledTimes(3);
      expect(mockEq).toHaveBeenCalledTimes(3);

      // Check update data structure
      expect(mockUpdate).toHaveBeenCalledWith({
        category_id: newCategoryId,
        auto_categorized: false,
        categorization_confidence: null,
        updated_at: expect.any(String),
      });
    });

    it('should handle partial failures gracefully', async () => {
      const transactionIds = ['tx-1', 'tx-2', 'tx-3'];
      const newCategoryId = 'cat-food';

      let callCount = 0;
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          // Second transaction fails
          return Promise.resolve({ error: { message: 'Update failed' } });
        }
        return Promise.resolve({ error: null });
      });
      
      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);
      
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });

      const result = await transactionsApi.bulkRecategorize(transactionIds, newCategoryId);

      expect(result.error).toBeUndefined();
      expect(result.data?.updated).toBe(2); // Only 2 successful
      expect(result.data?.errors).toHaveLength(1);
      expect(result.data?.errors[0]).toContain('tx-2');
      expect(result.data?.errors[0]).toContain('Update failed');
    });

    it('should handle empty transaction list', async () => {
      const result = await transactionsApi.bulkRecategorize([], 'cat-food');

      expect(result.error).toBeUndefined();
      expect(result.data?.updated).toBe(0);
      expect(result.data?.errors).toHaveLength(0);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('getCategorySuggestions', () => {
    it('should return category suggestions based on transaction description', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Food & Dining', icon_name: 'restaurant', user_id: null, created_at: '2023-01-01', updated_at: '2023-01-01' },
        { id: 'cat-2', name: 'Uncategorized', icon_name: 'help', user_id: null, created_at: '2023-01-01', updated_at: '2023-01-01' },
      ];

      const mockSimilarTransactions = [
        {
          category_id: 'cat-1',
          categories: mockCategories[0],
        },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Mock categories query
      const mockCategoriesSelect = jest.fn().mockReturnThis();
      const mockCategoriesOr = jest.fn().mockReturnThis();
      const mockCategoriesOrder = jest.fn().mockResolvedValue({
        data: mockCategories,
        error: null,
      });

      // Mock similar transactions query
      const mockTransactionsSelect = jest.fn().mockReturnThis();
      const mockTransactionsIlike = jest.fn().mockReturnThis();
      const mockTransactionsLimit = jest.fn().mockResolvedValue({
        data: mockSimilarTransactions,
        error: null,
      });

      let callCount = 0;
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'categories') {
          return {
            select: mockCategoriesSelect,
          };
        } else if (table === 'transactions') {
          return {
            select: mockTransactionsSelect,
          };
        }
        return {} as any;
      });

      mockCategoriesSelect.mockReturnValue({
        or: mockCategoriesOr,
      });
      mockCategoriesOr.mockReturnValue({
        order: mockCategoriesOrder,
      });

      mockTransactionsSelect.mockReturnValue({
        ilike: mockTransactionsIlike,
      });
      mockTransactionsIlike.mockReturnValue({
        limit: mockTransactionsLimit,
      });

      const result = await transactionsApi.getCategorySuggestions('KFC chicken', 15.50);

      expect(result.error).toBeUndefined();
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].name).toBe('Food & Dining');
      expect(result.data?.[1].name).toBe('Uncategorized');
    });
  });

  describe('provideCategoryFeedback', () => {
    it('should update transaction and clear auto categorization', async () => {
      const transactionId = 'tx-123';
      const originalCategoryId = 'cat-old';
      const newCategoryId = 'cat-new';
      const confidence = 0.85;

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      
      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);
      
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });

      const result = await transactionsApi.provideCategoryFeedback(
        transactionId,
        originalCategoryId,
        newCategoryId,
        confidence
      );

      expect(result.error).toBeUndefined();
      expect(mockUpdate).toHaveBeenCalledWith({
        category_id: newCategoryId,
        auto_categorized: false,
        categorization_confidence: null,
        updated_at: expect.any(String),
      });
      expect(mockEq).toHaveBeenCalledWith('id', transactionId);
    });
  });
});