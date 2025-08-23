import { budgetsApi } from '@/services/api/budgets';
import type { BudgetWithSpending } from '@/types/models';

// Mock fetch globally
global.fetch = jest.fn();

// Mock environment variables
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test-supabase-url.supabase.co';

// Mock supabase client
jest.mock('@/services/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-token',
          },
        },
      }),
    },
  },
}));

const mockBudgetWithSpending: BudgetWithSpending = {
  id: '1',
  user_id: 'user1',
  category_id: 'cat1',
  amount: 1000,
  month: '2024-01-01',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  category_name: 'Food',
  category_icon_name: 'restaurant',
  spent: 500,
  percentage: 50,
  remaining: 500,
  status: 'on_track',
  transaction_count: 5,
};

const mockTransactions = [
  {
    id: 'trans1',
    user_id: 'user1',
    amount: 25.50,
    type: 'expense',
    category_id: 'cat1',
    transaction_date: '2024-01-15',
    description: 'Grocery shopping',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'trans2',
    user_id: 'user1',
    amount: 15.00,
    type: 'expense',
    category_id: 'cat1',
    transaction_date: '2024-01-16',
    description: 'Lunch',
    created_at: '2024-01-16T00:00:00Z',
    updated_at: '2024-01-16T00:00:00Z',
  },
];

describe('Budget Tracking API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('getBudgetTracking', () => {
    it('fetches budget tracking data successfully', async () => {
      const mockResponse = {
        success: true,
        data: [mockBudgetWithSpending],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      const result = await budgetsApi.getBudgetTracking();

      expect(fetch).toHaveBeenCalledWith(
        'https://test-supabase-url.supabase.co/functions/v1/budget-tracking',
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
        }
      );

      expect(result.data).toEqual([mockBudgetWithSpending]);
      expect(result.error).toBeNull();
    });

    it('fetches budget tracking data for specific month', async () => {
      const mockResponse = {
        success: true,
        data: [mockBudgetWithSpending],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      const month = '2024-01-01';
      const result = await budgetsApi.getBudgetTracking(month);

      expect(fetch).toHaveBeenCalledWith(
        `https://test-supabase-url.supabase.co/functions/v1/budget-tracking?month=${encodeURIComponent(month)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
        }
      );

      expect(result.data).toEqual([mockBudgetWithSpending]);
      expect(result.error).toBeNull();
    });

    it('handles API error response', async () => {
      const mockErrorResponse = {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch budget tracking data',
        },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve(mockErrorResponse),
      });

      const result = await budgetsApi.getBudgetTracking();

      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockErrorResponse.error);
    });

    it('handles network error', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await budgetsApi.getBudgetTracking();

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Network error while fetching budget tracking',
        code: 'NETWORK_ERROR',
      });
    });

    it('handles empty response data', async () => {
      const mockResponse = {
        success: true,
        data: null,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      const result = await budgetsApi.getBudgetTracking();

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });
  });

  describe('getBudgetTransactions', () => {
    it('fetches budget transactions successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          budget: mockBudgetWithSpending,
          transactions: mockTransactions,
        },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      const budgetId = '1';
      const result = await budgetsApi.getBudgetTransactions(budgetId);

      expect(fetch).toHaveBeenCalledWith(
        `https://test-supabase-url.supabase.co/functions/v1/budget-tracking?budget_id=${encodeURIComponent(budgetId)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
        }
      );

      expect(result.data).toEqual(mockResponse.data);
      expect(result.error).toBeNull();
    });

    it('fetches budget transactions for specific month', async () => {
      const mockResponse = {
        success: true,
        data: {
          budget: mockBudgetWithSpending,
          transactions: mockTransactions,
        },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      const budgetId = '1';
      const month = '2024-01-01';
      const result = await budgetsApi.getBudgetTransactions(budgetId, month);

      expect(fetch).toHaveBeenCalledWith(
        `https://test-supabase-url.supabase.co/functions/v1/budget-tracking?budget_id=${encodeURIComponent(budgetId)}&month=${encodeURIComponent(month)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
        }
      );

      expect(result.data).toEqual(mockResponse.data);
      expect(result.error).toBeNull();
    });

    it('handles budget not found error', async () => {
      const mockErrorResponse = {
        success: false,
        error: {
          code: 'BUDGET_NOT_FOUND',
          message: 'Budget not found',
        },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve(mockErrorResponse),
      });

      const result = await budgetsApi.getBudgetTransactions('invalid-id');

      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockErrorResponse.error);
    });

    it('handles network error', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await budgetsApi.getBudgetTransactions('1');

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Network error while fetching budget transactions',
        code: 'NETWORK_ERROR',
      });
    });
  });

  describe('URL construction', () => {
    it('constructs correct URL without parameters', async () => {
      const mockResponse = { success: true, data: [] };
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      await budgetsApi.getBudgetTracking();

      expect(fetch).toHaveBeenCalledWith(
        'https://test-supabase-url.supabase.co/functions/v1/budget-tracking',
        expect.any(Object)
      );
    });

    it('constructs correct URL with month parameter', async () => {
      const mockResponse = { success: true, data: [] };
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      const month = '2024-01-01';
      await budgetsApi.getBudgetTracking(month);

      expect(fetch).toHaveBeenCalledWith(
        `https://test-supabase-url.supabase.co/functions/v1/budget-tracking?month=${encodeURIComponent(month)}`,
        expect.any(Object)
      );
    });

    it('constructs correct URL with budget_id parameter', async () => {
      const mockResponse = { success: true, data: {} };
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      const budgetId = 'budget-123';
      await budgetsApi.getBudgetTransactions(budgetId);

      expect(fetch).toHaveBeenCalledWith(
        `https://test-supabase-url.supabase.co/functions/v1/budget-tracking?budget_id=${encodeURIComponent(budgetId)}`,
        expect.any(Object)
      );
    });

    it('constructs correct URL with both budget_id and month parameters', async () => {
      const mockResponse = { success: true, data: {} };
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      const budgetId = 'budget-123';
      const month = '2024-01-01';
      await budgetsApi.getBudgetTransactions(budgetId, month);

      expect(fetch).toHaveBeenCalledWith(
        `https://test-supabase-url.supabase.co/functions/v1/budget-tracking?budget_id=${encodeURIComponent(budgetId)}&month=${encodeURIComponent(month)}`,
        expect.any(Object)
      );
    });
  });
});