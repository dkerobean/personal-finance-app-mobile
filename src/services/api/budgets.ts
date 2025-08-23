import { supabase } from '../supabaseClient';
import { ApiResponse } from '@/types/api';
import type { BudgetWithSpending, Transaction } from '@/types/models';

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: string; // Format: 'YYYY-MM-01'
  created_at: string;
  updated_at: string;
  category_name?: string;
  category_icon_name?: string;
}

export interface CreateBudgetRequest {
  category_id: string;
  amount: number;
  month: string; // Format: 'YYYY-MM-01'
}

export interface UpdateBudgetRequest {
  amount: number;
}

export interface BudgetResponse {
  success: boolean;
  data?: Budget | Budget[];
  error?: {
    code: string;
    message: string;
  };
}

class BudgetsApi {
  private getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    };
  };

  private getBaseUrl = () => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/budgets-crud`;
  };

  private getTrackingBaseUrl = () => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/budget-tracking`;
  };

  list = async (): Promise<ApiResponse<Budget[]>> => {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(this.getBaseUrl(), {
        method: 'GET',
        headers,
      });

      const result: BudgetResponse = await response.json();

      if (!result.success) {
        return {
          data: null,
          error: result.error || { 
            message: 'Failed to fetch budgets', 
            code: 'FETCH_ERROR' 
          },
        };
      }

      return {
        data: Array.isArray(result.data) ? result.data : [],
        error: null,
      };
    } catch (error) {
      console.error('Error fetching budgets:', error);
      return {
        data: null,
        error: {
          message: 'Network error while fetching budgets',
          code: 'NETWORK_ERROR',
        },
      };
    }
  };

  create = async (request: CreateBudgetRequest): Promise<ApiResponse<Budget>> => {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(this.getBaseUrl(), {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      const result: BudgetResponse = await response.json();

      if (!result.success) {
        return {
          data: null,
          error: result.error || { 
            message: 'Failed to create budget', 
            code: 'CREATE_ERROR' 
          },
        };
      }

      return {
        data: result.data as Budget,
        error: null,
      };
    } catch (error) {
      console.error('Error creating budget:', error);
      return {
        data: null,
        error: {
          message: 'Network error while creating budget',
          code: 'NETWORK_ERROR',
        },
      };
    }
  };

  update = async (id: string, request: UpdateBudgetRequest): Promise<ApiResponse<Budget>> => {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.getBaseUrl()}/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(request),
      });

      const result: BudgetResponse = await response.json();

      if (!result.success) {
        return {
          data: null,
          error: result.error || { 
            message: 'Failed to update budget', 
            code: 'UPDATE_ERROR' 
          },
        };
      }

      return {
        data: result.data as Budget,
        error: null,
      };
    } catch (error) {
      console.error('Error updating budget:', error);
      return {
        data: null,
        error: {
          message: 'Network error while updating budget',
          code: 'NETWORK_ERROR',
        },
      };
    }
  };

  delete = async (id: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.getBaseUrl()}/${id}`, {
        method: 'DELETE',
        headers,
      });

      const result: BudgetResponse = await response.json();

      if (!result.success) {
        return {
          data: null,
          error: result.error || { 
            message: 'Failed to delete budget', 
            code: 'DELETE_ERROR' 
          },
        };
      }

      return {
        data: (result.data as any) || { message: 'Budget deleted successfully' },
        error: null,
      };
    } catch (error) {
      console.error('Error deleting budget:', error);
      return {
        data: null,
        error: {
          message: 'Network error while deleting budget',
          code: 'NETWORK_ERROR',
        },
      };
    }
  };

  getBudgetsForMonth = async (month: string): Promise<ApiResponse<Budget[]>> => {
    try {
      const allBudgets = await this.list();
      
      if (allBudgets.error) {
        return allBudgets;
      }

      const monthBudgets = allBudgets.data?.filter(budget => budget.month === month) || [];
      
      return {
        data: monthBudgets,
        error: null,
      };
    } catch (error) {
      console.error('Error fetching budgets for month:', error);
      return {
        data: null,
        error: {
          message: 'Error filtering budgets by month',
          code: 'FILTER_ERROR',
        },
      };
    }
  };

  getBudgetTracking = async (month?: string): Promise<ApiResponse<BudgetWithSpending[]>> => {
    try {
      const headers = await this.getAuthHeaders();
      const url = month 
        ? `${this.getTrackingBaseUrl()}?month=${encodeURIComponent(month)}`
        : this.getTrackingBaseUrl();
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const result = await response.json();

      if (!result.success) {
        return {
          data: null,
          error: result.error || { 
            message: 'Failed to fetch budget tracking data', 
            code: 'FETCH_ERROR' 
          },
        };
      }

      return {
        data: Array.isArray(result.data) ? result.data : [],
        error: null,
      };
    } catch (error) {
      console.error('Error fetching budget tracking:', error);
      return {
        data: null,
        error: {
          message: 'Network error while fetching budget tracking',
          code: 'NETWORK_ERROR',
        },
      };
    }
  };

  getBudgetTransactions = async (budgetId: string, month?: string): Promise<ApiResponse<{ budget: Budget; transactions: Transaction[] }>> => {
    try {
      const headers = await this.getAuthHeaders();
      const url = month 
        ? `${this.getTrackingBaseUrl()}?budget_id=${encodeURIComponent(budgetId)}&month=${encodeURIComponent(month)}`
        : `${this.getTrackingBaseUrl()}?budget_id=${encodeURIComponent(budgetId)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const result = await response.json();

      if (!result.success) {
        return {
          data: null,
          error: result.error || { 
            message: 'Failed to fetch budget transactions', 
            code: 'FETCH_ERROR' 
          },
        };
      }

      return {
        data: result.data,
        error: null,
      };
    } catch (error) {
      console.error('Error fetching budget transactions:', error);
      return {
        data: null,
        error: {
          message: 'Network error while fetching budget transactions',
          code: 'NETWORK_ERROR',
        },
      };
    }
  };
}

export const budgetsApi = new BudgetsApi();