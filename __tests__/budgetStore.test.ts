import { budgetsApi } from '@/services/api/budgets';
import { useBudgetStore } from '@/stores/budgetStore';
import { Budget, CreateBudgetRequest, UpdateBudgetRequest } from '@/types/models';

// Mock the budgetsApi
jest.mock('@/services/api/budgets');
const mockedBudgetsApi = budgetsApi as jest.Mocked<typeof budgetsApi>;

describe('Budget Store', () => {
  const mockBudgets: Budget[] = [
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
      month: '2024-08-01',
      created_at: '2024-08-01T00:00:00Z',
      updated_at: '2024-08-01T00:00:00Z',
      category_name: 'Transportation',
      category_icon_name: 'car',
    },
  ];

  beforeEach(() => {
    // Reset store state
    useBudgetStore.setState({
      budgets: [],
      isLoading: false,
      error: null,
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('loadBudgets', () => {
    it('should load budgets successfully', async () => {
      mockedBudgetsApi.list.mockResolvedValue({
        data: mockBudgets,
        error: null,
      });

      const { loadBudgets } = useBudgetStore.getState();
      await loadBudgets();

      const state = useBudgetStore.getState();
      expect(state.budgets).toEqual(mockBudgets);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle error when loading budgets fails', async () => {
      const errorMessage = 'Failed to fetch budgets';
      mockedBudgetsApi.list.mockResolvedValue({
        data: null,
        error: { message: errorMessage, code: 'FETCH_ERROR' },
      });

      const { loadBudgets } = useBudgetStore.getState();
      await loadBudgets();

      const state = useBudgetStore.getState();
      expect(state.budgets).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it('should handle network error when loading budgets', async () => {
      mockedBudgetsApi.list.mockRejectedValue(new Error('Network error'));

      const { loadBudgets } = useBudgetStore.getState();
      await loadBudgets();

      const state = useBudgetStore.getState();
      expect(state.budgets).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Failed to load budgets');
    });
  });

  describe('createBudget', () => {
    const createRequest: CreateBudgetRequest = {
      category_id: 'cat-3',
      amount: 200,
      month: '2024-08-01',
    };

    it('should create budget successfully', async () => {
      const newBudget: Budget = {
        id: '3',
        user_id: 'user-1',
        category_id: 'cat-3',
        amount: 200,
        month: '2024-08-01',
        created_at: '2024-08-01T00:00:00Z',
        updated_at: '2024-08-01T00:00:00Z',
        category_name: 'Entertainment',
        category_icon_name: 'play',
      };

      mockedBudgetsApi.create.mockResolvedValue({
        data: newBudget,
        error: null,
      });

      mockedBudgetsApi.list.mockResolvedValue({
        data: [...mockBudgets, newBudget],
        error: null,
      });

      const { createBudget } = useBudgetStore.getState();
      const result = await createBudget(createRequest);

      expect(result).toBe(true);
      expect(mockedBudgetsApi.create).toHaveBeenCalledWith(createRequest);
      expect(mockedBudgetsApi.list).toHaveBeenCalled();
    });

    it('should handle error when creating budget fails', async () => {
      const errorMessage = 'Budget already exists';
      mockedBudgetsApi.create.mockResolvedValue({
        data: null,
        error: { message: errorMessage, code: 'BUDGET_EXISTS' },
      });

      const { createBudget } = useBudgetStore.getState();
      const result = await createBudget(createRequest);

      expect(result).toBe(false);
      const state = useBudgetStore.getState();
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('updateBudget', () => {
    const updateRequest: UpdateBudgetRequest = {
      amount: 600,
    };

    it('should update budget successfully', async () => {
      const updatedBudget: Budget = {
        ...mockBudgets[0],
        amount: 600,
        updated_at: '2024-08-02T00:00:00Z',
      };

      mockedBudgetsApi.update.mockResolvedValue({
        data: updatedBudget,
        error: null,
      });

      mockedBudgetsApi.list.mockResolvedValue({
        data: [updatedBudget, mockBudgets[1]],
        error: null,
      });

      const { updateBudget } = useBudgetStore.getState();
      const result = await updateBudget('1', updateRequest);

      expect(result).toBe(true);
      expect(mockedBudgetsApi.update).toHaveBeenCalledWith('1', updateRequest);
      expect(mockedBudgetsApi.list).toHaveBeenCalled();
    });

    it('should handle error when updating budget fails', async () => {
      const errorMessage = 'Budget not found';
      mockedBudgetsApi.update.mockResolvedValue({
        data: null,
        error: { message: errorMessage, code: 'BUDGET_NOT_FOUND' },
      });

      const { updateBudget } = useBudgetStore.getState();
      const result = await updateBudget('999', updateRequest);

      expect(result).toBe(false);
      const state = useBudgetStore.getState();
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('deleteBudget', () => {
    it('should delete budget successfully', async () => {
      mockedBudgetsApi.delete.mockResolvedValue({
        data: { message: 'Budget deleted successfully' },
        error: null,
      });

      mockedBudgetsApi.list.mockResolvedValue({
        data: [mockBudgets[1]], // Only second budget remains
        error: null,
      });

      const { deleteBudget } = useBudgetStore.getState();
      const result = await deleteBudget('1');

      expect(result).toBe(true);
      expect(mockedBudgetsApi.delete).toHaveBeenCalledWith('1');
      expect(mockedBudgetsApi.list).toHaveBeenCalled();
    });

    it('should handle error when deleting budget fails', async () => {
      const errorMessage = 'Budget not found';
      mockedBudgetsApi.delete.mockResolvedValue({
        data: null,
        error: { message: errorMessage, code: 'BUDGET_NOT_FOUND' },
      });

      const { deleteBudget } = useBudgetStore.getState();
      const result = await deleteBudget('999');

      expect(result).toBe(false);
      const state = useBudgetStore.getState();
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('getBudgetsForMonth', () => {
    it('should return budgets for specific month', () => {
      // Set up store with budgets
      useBudgetStore.setState({ budgets: mockBudgets });

      const { getBudgetsForMonth } = useBudgetStore.getState();
      const augustBudgets = getBudgetsForMonth('2024-08-01');

      expect(augustBudgets).toEqual(mockBudgets);
      expect(augustBudgets).toHaveLength(2);
    });

    it('should return empty array for month with no budgets', () => {
      useBudgetStore.setState({ budgets: mockBudgets });

      const { getBudgetsForMonth } = useBudgetStore.getState();
      const septemberBudgets = getBudgetsForMonth('2024-09-01');

      expect(septemberBudgets).toEqual([]);
      expect(septemberBudgets).toHaveLength(0);
    });
  });

  describe('getBudgetByCategory', () => {
    it('should return budget for specific category and month', () => {
      useBudgetStore.setState({ budgets: mockBudgets });

      const { getBudgetByCategory } = useBudgetStore.getState();
      const budget = getBudgetByCategory('cat-1', '2024-08-01');

      expect(budget).toEqual(mockBudgets[0]);
    });

    it('should return undefined for non-existent category/month combination', () => {
      useBudgetStore.setState({ budgets: mockBudgets });

      const { getBudgetByCategory } = useBudgetStore.getState();
      const budget = getBudgetByCategory('cat-999', '2024-08-01');

      expect(budget).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should clear error', () => {
      useBudgetStore.setState({ error: 'Some error' });

      const { clearError } = useBudgetStore.getState();
      clearError();

      const state = useBudgetStore.getState();
      expect(state.error).toBeNull();
    });

    it('should set error', () => {
      const errorMessage = 'Test error';
      const { setError } = useBudgetStore.getState();
      setError(errorMessage);

      const state = useBudgetStore.getState();
      expect(state.error).toBe(errorMessage);
    });

    it('should set loading state', () => {
      const { setLoading } = useBudgetStore.getState();
      setLoading(true);

      const state = useBudgetStore.getState();
      expect(state.isLoading).toBe(true);
    });
  });
});