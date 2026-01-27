/**
 * Categories API - Uses Backend API
 */

import { apiClient, createApiResponse, ApiResponse } from '@/services/apiClient';
import type { Category as CategoryType } from '@/types/models';

export interface CreateCategoryRequest {
  name: string;
  icon_name: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  icon_name?: string;
}

const transformCategory = (cat: any): CategoryType => ({
  id: cat._id,
  user_id: cat.userId,
  name: cat.name,
  icon_name: cat.iconName,
  created_at: cat.createdAt,
  updated_at: cat.updatedAt,
});

export const categoriesApi = {
  async list(userId: string): Promise<ApiResponse<CategoryType[]>> {
    const result = await apiClient.get<any[]>(`/categories?userId=${userId}`);
    if (result.data) {
      return createApiResponse(result.data.map(transformCategory));
    }
    return createApiResponse([], result.error || undefined);
  },

  async getById(userId: string, id: string): Promise<ApiResponse<CategoryType>> {
    const result = await apiClient.get<any>(`/categories/${id}?userId=${userId}`);
    if (result.data) {
      return createApiResponse(transformCategory(result.data));
    }
    return createApiResponse({} as CategoryType, result.error || undefined);
  },

  async create(userId: string, request: CreateCategoryRequest): Promise<ApiResponse<CategoryType>> {
    const result = await apiClient.post<any>('/categories', {
      userId,
      name: request.name,
      iconName: request.icon_name,
    });
    if (result.data) {
      return createApiResponse(transformCategory(result.data));
    }
    return createApiResponse({} as CategoryType, result.error || undefined);
  },

  async update(userId: string, id: string, request: UpdateCategoryRequest): Promise<ApiResponse<CategoryType>> {
    const result = await apiClient.patch<any>(`/categories/${id}?userId=${userId}`, {
      name: request.name,
      iconName: request.icon_name,
    });
    if (result.data) {
      return createApiResponse(transformCategory(result.data));
    }
    return createApiResponse({} as CategoryType, result.error || undefined);
  },

  async delete(userId: string, id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/categories/${id}?userId=${userId}`);
  },
};