import { budgetsApi } from '@/services/api/budgets';
import { supabase } from '@/services/supabaseClient';

// Mock supabaseClient
jest.mock('@/services/supabaseClient');
const mockedSupabase = supabase as jest.Mocked<typeof supabase>;

// Mock fetch
global.fetch = jest.fn();
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Budgets API', () => {
  const mockSession = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: { id: 'user-1' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock supabase session
    mockedSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    // Mock environment variable
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  });

  describe('list', () => {
    it('should fetch budgets successfully', async () => {
      const mockBudgets = [
        {
          id: '1',
          user_id: 'user-1',
          category_id: 'cat-1',
          amount: 500,
          month: '2024-08-01',
          created_at: '2024-08-01T00:00:00Z',
          updated_at: '2024-08-01T00:00:00Z',
          category_name: 'Food',
          category_icon_name: 'restaurant',
        },
      ];

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockBudgets,
        }),
      } as Response);

      const result = await budgetsApi.list();

      expect(result.data).toEqual(mockBudgets);
      expect(result.error).toBeNull();
      expect(mockedFetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/budgets-crud',
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer mock-access-token',
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('should handle API error response', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
        }),
      } as Response);

      const result = await budgetsApi.list();

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
    });

    it('should handle network error', async () => {
      mockedFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await budgetsApi.list();

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Network error while fetching budgets',
        code: 'NETWORK_ERROR',
      });
    });
  });

  describe('create', () => {
    const createRequest = {
      category_id: 'cat-1',
      amount: 500,
      month: '2024-08-01',
    };

    it('should create budget successfully', async () => {
      const mockCreatedBudget = {
        id: '1',
        user_id: 'user-1',
        ...createRequest,
        created_at: '2024-08-01T00:00:00Z',
        updated_at: '2024-08-01T00:00:00Z',
        category_name: 'Food',
        category_icon_name: 'restaurant',
      };

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockCreatedBudget,
        }),
      } as Response);

      const result = await budgetsApi.create(createRequest);

      expect(result.data).toEqual(mockCreatedBudget);
      expect(result.error).toBeNull();
      expect(mockedFetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/budgets-crud',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer mock-access-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createRequest),
        }
      );
    });

    it('should handle creation error', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: { message: 'Budget already exists', code: 'BUDGET_EXISTS' },
        }),
      } as Response);

      const result = await budgetsApi.create(createRequest);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Budget already exists',
        code: 'BUDGET_EXISTS',
      });
    });
  });

  describe('update', () => {
    const updateRequest = { amount: 600 };

    it('should update budget successfully', async () => {
      const mockUpdatedBudget = {
        id: '1',
        user_id: 'user-1',
        category_id: 'cat-1',
        amount: 600,
        month: '2024-08-01',
        created_at: '2024-08-01T00:00:00Z',
        updated_at: '2024-08-02T00:00:00Z',
        category_name: 'Food',
        category_icon_name: 'restaurant',
      };

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockUpdatedBudget,
        }),
      } as Response);

      const result = await budgetsApi.update('1', updateRequest);

      expect(result.data).toEqual(mockUpdatedBudget);
      expect(result.error).toBeNull();
      expect(mockedFetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/budgets-crud/1',
        {
          method: 'PATCH',
          headers: {
            'Authorization': 'Bearer mock-access-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateRequest),
        }
      );
    });

    it('should handle update error', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: { message: 'Budget not found', code: 'BUDGET_NOT_FOUND' },
        }),
      } as Response);

      const result = await budgetsApi.update('999', updateRequest);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Budget not found',
        code: 'BUDGET_NOT_FOUND',
      });
    });
  });

  describe('delete', () => {
    it('should delete budget successfully', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { message: 'Budget deleted successfully' },
        }),
      } as Response);

      const result = await budgetsApi.delete('1');

      expect(result.data).toEqual({ message: 'Budget deleted successfully' });
      expect(result.error).toBeNull();
      expect(mockedFetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/budgets-crud/1',
        {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer mock-access-token',
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('should handle deletion error', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: { message: 'Budget not found', code: 'BUDGET_NOT_FOUND' },
        }),
      } as Response);

      const result = await budgetsApi.delete('999');

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Budget not found',
        code: 'BUDGET_NOT_FOUND',
      });
    });
  });

  describe('getBudgetsForMonth', () => {
    it('should filter budgets by month', async () => {
      const mockBudgets = [
        {
          id: '1',
          user_id: 'user-1',
          category_id: 'cat-1',
          amount: 500,
          month: '2024-08-01',
          created_at: '2024-08-01T00:00:00Z',
          updated_at: '2024-08-01T00:00:00Z',
          category_name: 'Food',
          category_icon_name: 'restaurant',
        },
        {
          id: '2',
          user_id: 'user-1',
          category_id: 'cat-2',
          amount: 300,
          month: '2024-09-01',
          created_at: '2024-09-01T00:00:00Z',
          updated_at: '2024-09-01T00:00:00Z',
          category_name: 'Transportation',
          category_icon_name: 'car',
        },
      ];

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockBudgets,
        }),
      } as Response);

      const result = await budgetsApi.getBudgetsForMonth('2024-08-01');

      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].month).toBe('2024-08-01');
      expect(result.error).toBeNull();
    });

    it('should return empty array for month with no budgets', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      } as Response);

      const result = await budgetsApi.getBudgetsForMonth('2024-12-01');

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('should handle filter error when list fails', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
        }),
      } as Response);

      const result = await budgetsApi.getBudgetsForMonth('2024-08-01');

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
    });
  });

  describe('authentication', () => {
    it('should handle missing session', async () => {
      mockedSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const result = await budgetsApi.list();

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('NETWORK_ERROR');
    });
  });
});