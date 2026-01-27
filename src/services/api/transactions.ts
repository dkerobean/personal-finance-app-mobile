/**
 * Transactions API - Uses Backend API
 */

import { apiClient, createApiResponse, ApiResponse } from '@/services/apiClient';
import type { Transaction as TransactionType, Category as CategoryType } from '@/types/models';
import type { CreateTransactionRequest, UpdateTransactionRequest } from '@/types/api';

export const isSyncedTransaction = (transaction: any): boolean => {
  return !!(
    transaction.isSynced || 
    transaction.monoTransactionId || 
    transaction.mtnReferenceId ||
    transaction.momoExternalId || 
    transaction.momoTransactionId
  );
};

const transformTransaction = (tx: any): TransactionType => ({
  id: tx._id,
  user_id: tx.userId,
  account_id: tx.accountId?._id,
  amount: tx.amount,
  type: tx.type,
  category_id: tx.categoryId?._id,
  transaction_date: tx.transactionDate,
  description: tx.description,
  created_at: tx.createdAt,
  updated_at: tx.updatedAt,
  category: tx.categoryId ? {
    id: tx.categoryId._id,
    user_id: tx.categoryId.userId,
    name: tx.categoryId.name,
    icon_name: tx.categoryId.iconName,
    created_at: tx.categoryId.createdAt,
    updated_at: tx.categoryId.updatedAt,
  } : undefined,
  mono_transaction_id: tx.monoTransactionId,
  mtn_reference_id: tx.mtnReferenceId,
  is_synced: tx.isSynced,
  platform_source: tx.platformSource,
});

export const transactionsApi = {
  async list(userId: string): Promise<ApiResponse<TransactionType[]>> {
    const result = await apiClient.get<any[]>(`/transactions?userId=${userId}`);
    if (result.data) {
      return createApiResponse(result.data.map(transformTransaction));
    }
    return createApiResponse([], result.error || undefined);
  },

  async create(userId: string, request: CreateTransactionRequest): Promise<ApiResponse<TransactionType>> {
    const result = await apiClient.post<any>('/transactions', {
      userId,
      amount: request.amount,
      type: request.type,
      categoryId: request.category_id,
      transactionDate: request.transaction_date,
      description: request.description,
    });
    if (result.data) {
      return createApiResponse(transformTransaction(result.data));
    }
    return createApiResponse({} as TransactionType, result.error || undefined);
  },

  async update(userId: string, id: string, request: UpdateTransactionRequest): Promise<ApiResponse<TransactionType>> {
    const result = await apiClient.patch<any>(`/transactions/${id}?userId=${userId}`, {
      amount: request.amount,
      type: request.type,
      categoryId: request.category_id,
      transactionDate: request.transaction_date,
      description: request.description,
    });
    if (result.data) {
      return createApiResponse(transformTransaction(result.data));
    }
    return createApiResponse({} as TransactionType, result.error || undefined);
  },

  async delete(userId: string, id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/transactions/${id}?userId=${userId}`);
  },

  async getById(userId: string, id: string): Promise<ApiResponse<TransactionType>> {
    const result = await apiClient.get<any>(`/transactions/${id}?userId=${userId}`);
    if (result.data) {
      return createApiResponse(transformTransaction(result.data));
    }
    return createApiResponse({} as TransactionType, result.error || undefined);
  },
};