import { create } from 'zustand';
import type { BudgetState, BudgetActions } from '@/types/store';
import type { Budget, CreateBudgetRequest, UpdateBudgetRequest } from '@/types/models';
import { budgetsApi } from '@/services/api/budgets';

interface BudgetStore extends BudgetState, BudgetActions {}

export const useBudgetStore = create<BudgetStore>((set, get) => ({
  budgets: [],
  budgetsWithSpending: [],
  isLoading: false,
  isTrackingLoading: false,
  error: null,
  lastUpdated: null,

  setLoading: (isLoading) => set({ isLoading }),

  setTrackingLoading: (isTrackingLoading) => set({ isTrackingLoading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  loadBudgets: async () => {
    const { setLoading, setError } = get();
    
    setLoading(true);
    setError(null);

    try {
      const response = await budgetsApi.list();
      
      if (response.error) {
        const errorMessage = response.error.code === 'NETWORK_ERROR' 
          ? 'Unable to connect to server. Please check your internet connection and try again.'
          : response.error.code === 'UNAUTHORIZED'
          ? 'Your session has expired. Please log out and log back in.'
          : response.error.message || 'Failed to load budgets';
        setError(errorMessage);
        return;
      }

      const budgets = response.data || [];
      set({ budgets });
    } catch (error) {
      setError('Failed to load budgets');
      console.error('Error loading budgets:', error);
    } finally {
      setLoading(false);
    }
  },

  createBudget: async (request: CreateBudgetRequest) => {
    const { setLoading, setError, loadBudgets } = get();
    
    setLoading(true);
    setError(null);

    try {
      const response = await budgetsApi.create(request);
      
      if (response.error) {
        const errorMessage = response.error.code === 'BUDGET_EXISTS'
          ? 'A budget already exists for this category and month. Please edit the existing budget or choose a different category.'
          : response.error.code === 'CATEGORY_NOT_FOUND'
          ? 'The selected category was not found. Please refresh and try again.'
          : response.error.code === 'NETWORK_ERROR'
          ? 'Unable to connect to server. Please check your internet connection and try again.'
          : response.error.code === 'UNAUTHORIZED'
          ? 'Your session has expired. Please log out and log back in.'
          : response.error.message || 'Failed to create budget';
        setError(errorMessage);
        return false;
      }

      // Reload budgets to get the updated list
      await loadBudgets();
      return true;
    } catch (error) {
      setError('Failed to create budget');
      console.error('Error creating budget:', error);
      return false;
    } finally {
      setLoading(false);
    }
  },

  updateBudget: async (id: string, request: UpdateBudgetRequest) => {
    const { setLoading, setError, loadBudgets } = get();
    
    setLoading(true);
    setError(null);

    try {
      const response = await budgetsApi.update(id, request);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }

      // Reload budgets to get the updated list
      await loadBudgets();
      return true;
    } catch (error) {
      setError('Failed to update budget');
      console.error('Error updating budget:', error);
      return false;
    } finally {
      setLoading(false);
    }
  },

  deleteBudget: async (id: string) => {
    const { setLoading, setError, loadBudgets } = get();
    
    setLoading(true);
    setError(null);

    try {
      const response = await budgetsApi.delete(id);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }

      // Reload budgets to get the updated list
      await loadBudgets();
      return true;
    } catch (error) {
      setError('Failed to delete budget');
      console.error('Error deleting budget:', error);
      return false;
    } finally {
      setLoading(false);
    }
  },

  getBudgetsForMonth: (month: string) => {
    const { budgets } = get();
    return budgets.filter(budget => budget.month === month);
  },

  getBudgetByCategory: (categoryId: string, month: string) => {
    const { budgets } = get();
    return budgets.find(budget => 
      budget.category_id === categoryId && budget.month === month
    );
  },

  fetchBudgetTracking: async (month?: string) => {
    const { setTrackingLoading, setError } = get();
    
    setTrackingLoading(true);
    setError(null);

    try {
      const response = await budgetsApi.getBudgetTracking(month);
      
      if (response.error) {
        const errorMessage = response.error.code === 'NETWORK_ERROR'
          ? 'Unable to connect to server. Please check your internet connection and try again.'
          : response.error.code === 'UNAUTHORIZED'
          ? 'Your session has expired. Please log out and log back in.'
          : response.error.message || 'Failed to load budget tracking data';
        setError(errorMessage);
        return;
      }

      const budgetsWithSpending = response.data || [];
      set({ 
        budgetsWithSpending,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      setError('Failed to load budget tracking data');
      console.error('Error loading budget tracking:', error);
    } finally {
      setTrackingLoading(false);
    }
  },

  refreshBudgetSpending: async () => {
    const { fetchBudgetTracking } = get();
    await fetchBudgetTracking();
  },

  getBudgetProgress: (budgetId: string) => {
    const { budgetsWithSpending } = get();
    return budgetsWithSpending.find(budget => budget.id === budgetId);
  },

  getBudgetsWithSpendingForMonth: (month: string) => {
    const { budgetsWithSpending } = get();
    return budgetsWithSpending.filter(budget => budget.month === month);
  },

  onTransactionChanged: () => {
    const { refreshBudgetSpending } = get();
    // Debounce to avoid excessive API calls
    setTimeout(() => {
      refreshBudgetSpending();
    }, 1000);
  },

  // Subscribe to transaction changes
  subscribeToTransactionChanges: () => {
    // This method can be called by components to enable real-time updates
    const { onTransactionChanged } = get();
    
    // Return a cleanup function
    return () => {
      // Cleanup if needed
    };
  },
}));