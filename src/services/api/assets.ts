/**
 * Assets API - Uses Backend API
 */

import { apiClient, createApiResponse, ApiResponse } from '@/services/apiClient';
import type { Asset as AssetType, CreateAssetRequest, UpdateAssetRequest } from '@/types/models';

const transformAsset = (asset: any): AssetType => ({
  id: asset._id,
  user_id: asset.userId,
  name: asset.name,
  category: asset.category,
  asset_type: asset.assetType,
  custom_category: asset.customCategory,
  custom_type: asset.customType,
  current_value: asset.currentValue,
  original_value: asset.originalValue,
  purchase_date: asset.purchaseDate,
  description: asset.description,
  is_active: asset.isActive,
  created_at: asset.createdAt,
  updated_at: asset.updatedAt,
});

export const assetsApi = {
  async list(userId: string): Promise<ApiResponse<AssetType[]>> {
    const result = await apiClient.get<any[]>(`/assets?userId=${userId}`);
    if (result.data) {
      return createApiResponse(result.data.map(transformAsset));
    }
    return createApiResponse([], result.error || undefined);
  },

  async getById(userId: string, id: string): Promise<ApiResponse<AssetType>> {
    const result = await apiClient.get<any>(`/assets/${id}?userId=${userId}`);
    if (result.data) {
      return createApiResponse(transformAsset(result.data));
    }
    return createApiResponse({} as AssetType, result.error || undefined);
  },

  async create(userId: string, request: CreateAssetRequest): Promise<ApiResponse<AssetType>> {
    const result = await apiClient.post<any>('/assets', {
      userId,
      name: request.name,
      category: request.category,
      assetType: request.asset_type,
      customCategory: request.custom_category,
      customType: request.custom_type,
      currentValue: request.current_value,
      originalValue: request.original_value,
      purchaseDate: request.purchase_date,
      description: request.description,
    });
    if (result.data) {
      return createApiResponse(transformAsset(result.data));
    }
    return createApiResponse({} as AssetType, result.error || undefined);
  },

  async update(userId: string, id: string, request: UpdateAssetRequest): Promise<ApiResponse<AssetType>> {
    const result = await apiClient.patch<any>(`/assets/${id}?userId=${userId}`, {
      name: request.name,
      category: request.category,
      assetType: request.asset_type,
      customCategory: request.custom_category,
      customType: request.custom_type,
      currentValue: request.current_value,
      originalValue: request.original_value,
      purchaseDate: request.purchase_date,
      description: request.description,
      isActive: request.is_active,
    });
    if (result.data) {
      return createApiResponse(transformAsset(result.data));
    }
    return createApiResponse({} as AssetType, result.error || undefined);
  },

  async delete(userId: string, id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/assets/${id}?userId=${userId}`);
  },

  async getTotalsByCategory(userId: string): Promise<ApiResponse<{ category: string; total: number; count: number }[]>> {
    return apiClient.get(`/assets/totals?userId=${userId}`);
  },
};
