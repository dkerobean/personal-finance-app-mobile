import { renderHook, act } from '@testing-library/react-native';
import { useBudgetStore } from '@/stores/budgetStore';
import { budgetsApi } from '@/services/api/budgets';
import type { BudgetWithSpending } from '@/types/models';

// Mock the budgets API
jest.mock('@/services/api/budgets');
const mockBudgetsApi = budgetsApi as jest.Mocked<typeof budgetsApi>;

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

const mockBudgetWithSpending2: BudgetWithSpending = {
  id: '2',
  user_id: 'user1',
  category_id: 'cat2',
  amount: 500,
  month: '2024-01-01',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  category_name: 'Transport',
  category_icon_name: 'directions_car',
  spent: 450,
  percentage: 90,
  remaining: 50,
  status: 'warning',
  transaction_count: 3,
};

describe('Budget Store Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state before each test
    const { result } = renderHook(() => useBudgetStore());
    act(() => {
      result.current.budgetsWithSpending = [];
      result.current.isTrackingLoading = false;
      result.current.error = null;
      result.current.lastUpdated = null;
    });
  });

  describe('fetchBudgetTracking', () => {
    it('fetches budget tracking data successfully', async () => {
      mockBudgetsApi.getBudgetTracking.mockResolvedValueOnce({
        data: [mockBudgetWithSpending, mockBudgetWithSpending2],
        error: null,
      });

      const { result } = renderHook(() => useBudgetStore());

      await act(async () => {
        await result.current.fetchBudgetTracking();
      });

      expect(mockBudgetsApi.getBudgetTracking).toHaveBeenCalledWith(undefined);
      expect(result.current.budgetsWithSpending).toEqual([
        mockBudgetWithSpending,
        mockBudgetWithSpending2,
      ]);
      expect(result.current.isTrackingLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.lastUpdated).toBeTruthy();
    });

    it('fetches budget tracking data for specific month', async () => {
      mockBudgetsApi.getBudgetTracking.mockResolvedValueOnce({
        data: [mockBudgetWithSpending],
        error: null,
      });

      const { result } = renderHook(() => useBudgetStore());
      const month = '2024-01-01';

      await act(async () => {
        await result.current.fetchBudgetTracking(month);
      });

      expect(mockBudgetsApi.getBudgetTracking).toHaveBeenCalledWith(month);
      expect(result.current.budgetsWithSpending).toEqual([mockBudgetWithSpending]);
    });

    it('sets loading state correctly', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockBudgetsApi.getBudgetTracking.mockReturnValueOnce(promise);

      const { result } = renderHook(() => useBudgetStore());

      // Start the async operation
      act(() => {
        result.current.fetchBudgetTracking();
      });

      // Check loading state is true
      expect(result.current.isTrackingLoading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!({
          data: [mockBudgetWithSpending],
          error: null,
        });
        await promise;
      });

      // Check loading state is false
      expect(result.current.isTrackingLoading).toBe(false);
    });

    it('handles API error', async () => {
      const errorMessage = 'Failed to fetch budget tracking data';
      mockBudgetsApi.getBudgetTracking.mockResolvedValueOnce({
        data: null,
        error: { message: errorMessage, code: 'FETCH_ERROR' },
      });

      const { result } = renderHook(() => useBudgetStore());

      await act(async () => {
        await result.current.fetchBudgetTracking();
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.budgetsWithSpending).toEqual([]);
      expect(result.current.isTrackingLoading).toBe(false);
    });

    it('handles network error', async () => {
      mockBudgetsApi.getBudgetTracking.mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useBudgetStore());

      await act(async () => {
        await result.current.fetchBudgetTracking();
      });

      expect(result.current.error).toBe('Failed to load budget tracking data');
      expect(result.current.isTrackingLoading).toBe(false);
    });

    it('handles empty data response', async () => {
      mockBudgetsApi.getBudgetTracking.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const { result } = renderHook(() => useBudgetStore());

      await act(async () => {
        await result.current.fetchBudgetTracking();
      });

      expect(result.current.budgetsWithSpending).toEqual([]);
      expect(result.current.error).toBe(null);
    });
  });

  describe('refreshBudgetSpending', () => {
    it('calls fetchBudgetTracking', async () => {
      mockBudgetsApi.getBudgetTracking.mockResolvedValueOnce({
        data: [mockBudgetWithSpending],
        error: null,
      });

      const { result } = renderHook(() => useBudgetStore());

      await act(async () => {
        await result.current.refreshBudgetSpending();
      });

      expect(mockBudgetsApi.getBudgetTracking).toHaveBeenCalledWith(undefined);
      expect(result.current.budgetsWithSpending).toEqual([mockBudgetWithSpending]);
    });
  });

  describe('getBudgetProgress', () => {
    it('returns budget by ID', () => {
      const { result } = renderHook(() => useBudgetStore());

      // Set initial state
      act(() => {
        result.current.budgetsWithSpending = [
          mockBudgetWithSpending,
          mockBudgetWithSpending2,
        ];
      });

      const budget = result.current.getBudgetProgress('1');
      expect(budget).toEqual(mockBudgetWithSpending);
    });

    it('returns undefined for non-existent budget', () => {
      const { result } = renderHook(() => useBudgetStore());

      // Set initial state
      act(() => {
        result.current.budgetsWithSpending = [mockBudgetWithSpending];
      });

      const budget = result.current.getBudgetProgress('non-existent');
      expect(budget).toBeUndefined();
    });

    it('returns undefined when no budgets loaded', () => {
      const { result } = renderHook(() => useBudgetStore());

      const budget = result.current.getBudgetProgress('1');
      expect(budget).toBeUndefined();
    });
  });

  describe('getBudgetsWithSpendingForMonth', () => {
    it('filters budgets by month', () => {
      const { result } = renderHook(() => useBudgetStore());

      const februaryBudget = {
        ...mockBudgetWithSpending,
        id: '3',
        month: '2024-02-01',
      };

      // Set initial state
      act(() => {
        result.current.budgetsWithSpending = [
          mockBudgetWithSpending, // January
          mockBudgetWithSpending2, // January
          februaryBudget, // February
        ];
      });

      const januaryBudgets = result.current.getBudgetsWithSpendingForMonth('2024-01-01');
      expect(januaryBudgets).toEqual([mockBudgetWithSpending, mockBudgetWithSpending2]);

      const februaryBudgets = result.current.getBudgetsWithSpendingForMonth('2024-02-01');
      expect(februaryBudgets).toEqual([februaryBudget]);
    });

    it('returns empty array for month with no budgets', () => {
      const { result } = renderHook(() => useBudgetStore());

      // Set initial state
      act(() => {
        result.current.budgetsWithSpending = [mockBudgetWithSpending];
      });

      const budgets = result.current.getBudgetsWithSpendingForMonth('2024-03-01');
      expect(budgets).toEqual([]);
    });

    it('returns empty array when no budgets loaded', () => {
      const { result } = renderHook(() => useBudgetStore());

      const budgets = result.current.getBudgetsWithSpendingForMonth('2024-01-01');
      expect(budgets).toEqual([]);
    });
  });

  describe('onTransactionChanged', () => {
    it('triggers budget refresh after delay', async () => {
      mockBudgetsApi.getBudgetTracking.mockResolvedValue({
        data: [mockBudgetWithSpending],
        error: null,
      });

      const { result } = renderHook(() => useBudgetStore());

      // Mock setTimeout to execute immediately for testing
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((callback) => {
        callback();
        return {} as any;
      });

      await act(async () => {
        result.current.onTransactionChanged();
        // Wait a bit for the debounced function to execute
        await new Promise(resolve => originalSetTimeout(resolve, 10));
      });

      expect(mockBudgetsApi.getBudgetTracking).toHaveBeenCalled();

      // Restore original setTimeout
      global.setTimeout = originalSetTimeout;
    });
  });

  describe('setTrackingLoading', () => {
    it('sets tracking loading state', () => {
      const { result } = renderHook(() => useBudgetStore());

      act(() => {
        result.current.setTrackingLoading(true);
      });

      expect(result.current.isTrackingLoading).toBe(true);

      act(() => {
        result.current.setTrackingLoading(false);
      });

      expect(result.current.isTrackingLoading).toBe(false);
    });
  });

  describe('lastUpdated timestamp', () => {
    it('updates timestamp when fetching budget tracking', async () => {
      mockBudgetsApi.getBudgetTracking.mockResolvedValueOnce({
        data: [mockBudgetWithSpending],
        error: null,
      });

      const { result } = renderHook(() => useBudgetStore());
      
      expect(result.current.lastUpdated).toBe(null);

      await act(async () => {
        await result.current.fetchBudgetTracking();
      });

      expect(result.current.lastUpdated).toBeTruthy();
      expect(typeof result.current.lastUpdated).toBe('string');
      
      // Verify it's a valid ISO string
      const timestamp = new Date(result.current.lastUpdated!);
      expect(timestamp.toISOString()).toBe(result.current.lastUpdated);
    });

    it('does not update timestamp on error', async () => {
      mockBudgetsApi.getBudgetTracking.mockResolvedValueOnce({
        data: null,
        error: { message: 'Error', code: 'ERROR' },
      });

      const { result } = renderHook(() => useBudgetStore());

      await act(async () => {
        await result.current.fetchBudgetTracking();
      });

      expect(result.current.lastUpdated).toBe(null);
    });
  });
});