import type { ApiError, ApiResponse } from '@/types/api';

export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    console.error('API Error:', error.message);
    return error.message || 'An error occurred. Please try again.';
  }
  return 'An unexpected error occurred.';
};

export const createApiResponse = <T>(data?: T, error?: ApiError['error']): ApiResponse<T> => {
  return { data, error };
};