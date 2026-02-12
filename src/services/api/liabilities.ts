/**
 * Liabilities API - Uses Backend API
 */

import { apiClient, createApiResponse, ApiResponse } from '@/services/apiClient';
import type { Liability as LiabilityType, CreateLiabilityRequest, UpdateLiabilityRequest } from '@/types/models';

const transformLiability = (liability: any): LiabilityType => ({
  id: liability._id,
  user_id: liability.userId,
  name: liability.name,
  category: liability.category,
  liability_type: liability.liabilityType,
  custom_category: liability.customCategory,
  custom_type: liability.customType,
  current_balance: liability.currentBalance,
  original_balance: liability.originalBalance,
  interest_rate: liability.interestRate,
  monthly_payment: liability.monthlyPayment,
  due_date: liability.dueDate,
  description: liability.description,
  is_active: liability.isActive,
  created_at: liability.createdAt,
  updated_at: liability.updatedAt,
});

export const liabilitiesApi = {
  async list(userId: string): Promise<ApiResponse<LiabilityType[]>> {
    const result = await apiClient.get<any[]>(`/liabilities?userId=${userId}`);
    if (result.data) {
      return createApiResponse(result.data.map(transformLiability));
    }
    return createApiResponse([], result.error || undefined);
  },

  async getById(userId: string, id: string): Promise<ApiResponse<LiabilityType>> {
    const result = await apiClient.get<any>(`/liabilities/${id}?userId=${userId}`);
    if (result.data) {
      return createApiResponse(transformLiability(result.data));
    }
    return createApiResponse({} as LiabilityType, result.error || undefined);
  },

  async create(userId: string, request: CreateLiabilityRequest): Promise<ApiResponse<LiabilityType>> {
    const result = await apiClient.post<any>('/liabilities', {
      userId,
      name: request.name,
      category: request.category,
      liabilityType: request.liability_type,
      customCategory: request.custom_category,
      customType: request.custom_type,
      currentBalance: request.current_balance,
      originalBalance: request.original_balance,
      interestRate: request.interest_rate,
      monthlyPayment: request.monthly_payment,
      dueDate: request.due_date,
      description: request.description,
    });
    if (result.data) {
      return createApiResponse(transformLiability(result.data));
    }
    return createApiResponse({} as LiabilityType, result.error || undefined);
  },

  async update(userId: string, id: string, request: UpdateLiabilityRequest): Promise<ApiResponse<LiabilityType>> {
    const result = await apiClient.patch<any>(`/liabilities/${id}?userId=${userId}`, {
      name: request.name,
      category: request.category,
      liabilityType: request.liability_type,
      customCategory: request.custom_category,
      customType: request.custom_type,
      currentBalance: request.current_balance,
      originalBalance: request.original_balance,
      interestRate: request.interest_rate,
      monthlyPayment: request.monthly_payment,
      dueDate: request.due_date,
      description: request.description,
      isActive: request.is_active,
    });
    if (result.data) {
      return createApiResponse(transformLiability(result.data));
    }
    return createApiResponse({} as LiabilityType, result.error || undefined);
  },

  async delete(userId: string, id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/liabilities/${id}?userId=${userId}`);
  },

  async getTotalsByCategory(userId: string): Promise<ApiResponse<{ category: string; total: number; count: number }[]>> {
    return apiClient.get(`/liabilities/totals?userId=${userId}`);
  },
};
