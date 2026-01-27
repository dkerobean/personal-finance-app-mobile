/**
 * Budgets API - Uses Backend API
 */

import { apiClient, createApiResponse, ApiResponse } from '@/services/apiClient';
import type { Budget as BudgetType, BudgetWithSpending } from '@/types/models';
import type { CreateBudgetRequest, UpdateBudgetRequest } from '@/types/api';

const transformBudget = (budget: any): BudgetType => ({
  id: budget._id,
  user_id: budget.userId,
  category_id: budget.categoryId?._id,
  amount: budget.amount,
  month: budget.month,
  created_at: budget.createdAt,
  updated_at: budget.updatedAt,
  category_name: budget.categoryId?.name,
  category_icon_name: budget.categoryId?.iconName,
});

const transformBudgetWithSpending = (budget: any): BudgetWithSpending => ({
  ...transformBudget(budget),
  spent: budget.spent,
  percentage: budget.percentage,
  remaining: budget.remaining,
  status: budget.status,
  transaction_count: budget.transactionCount,
});

export const budgetsApi = {
  async list(userId: string): Promise<ApiResponse<BudgetType[]>> {
    const result = await apiClient.get<any[]>(`/budgets?userId=${userId}`);
    if (result.data) {
      return createApiResponse(result.data.map(transformBudget));
    }
    return createApiResponse([], result.error || undefined);
  },

  async getWithSpending(userId: string, month: string): Promise<ApiResponse<BudgetWithSpending[]>> {
    const result = await apiClient.get<any[]>(`/budgets/spending/${month}?userId=${userId}`);
    if (result.data) {
      return createApiResponse(result.data.map(transformBudgetWithSpending));
    }
    return createApiResponse([], result.error || undefined);
  },

  async getById(userId: string, id: string): Promise<ApiResponse<BudgetType>> {
    const result = await apiClient.get<any>(`/budgets/${id}?userId=${userId}`);
    if (result.data) {
      return createApiResponse(transformBudget(result.data));
    }
    return createApiResponse({} as BudgetType, result.error || undefined);
  },

  async create(userId: string, request: CreateBudgetRequest): Promise<ApiResponse<BudgetType>> {
    const result = await apiClient.post<any>('/budgets', {
      userId,
      categoryId: request.category_id,
      amount: request.amount,
      month: request.month,
    });
    if (result.data) {
      return createApiResponse(transformBudget(result.data));
    }
    return createApiResponse({} as BudgetType, result.error || undefined);
  },

  async update(userId: string, id: string, request: UpdateBudgetRequest): Promise<ApiResponse<BudgetType>> {
    const result = await apiClient.patch<any>(`/budgets/${id}?userId=${userId}`, {
      amount: request.amount,
    });
    if (result.data) {
      return createApiResponse(transformBudget(result.data));
    }
    return createApiResponse({} as BudgetType, result.error || undefined);
  },

  async delete(userId: string, id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/budgets/${id}?userId=${userId}`);
  },
};