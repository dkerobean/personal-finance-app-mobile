import type { ApiError, ApiResponse } from '@/types/api';

export const handleApiError = (error: unknown): string => {
  console.error('API Error (full object):', error);
  
  if (error instanceof Error) {
    console.error('API Error (message):', error.message);
    console.error('API Error (stack):', error.stack);
    return error.message || 'An error occurred. Please try again.';
  }
  
  // Handle Supabase-specific errors
  if (error && typeof error === 'object' && 'message' in error) {
    const supabaseError = error as { message: string; details?: string; hint?: string; code?: string };
    console.error('Supabase Error:', {
      message: supabaseError.message,
      details: supabaseError.details,
      hint: supabaseError.hint,
      code: supabaseError.code,
    });
    return supabaseError.message || 'Database error occurred.';
  }
  
  console.error('Unknown error type:', typeof error, error);
  return 'An unexpected error occurred.';
};

export const createApiResponse = <T>(data?: T, error?: ApiError['error']): ApiResponse<T> => {
  return { data, error };
};