/**
 * API Client - Uses Backend API
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T> {
  data: T | null;
  error: { code: string; message: string } | null;
}

export const handleApiError = (error: any): string => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const createApiResponse = <T>(
  data?: T,
  error?: { code: string; message: string }
): ApiResponse<T> => {
  return {
    data: data ?? null,
    error: error ?? null,
  };
};

export const apiClient = {
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`);
      const data = await response.json();
      
      if (!response.ok) {
        return createApiResponse(null as T, {
          code: 'API_ERROR',
          message: data.error || 'Request failed',
        });
      }
      
      return createApiResponse(data.data);
    } catch (error) {
      return createApiResponse(null as T, {
        code: 'NETWORK_ERROR',
        message: handleApiError(error),
      });
    }
  },

  async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      
      if (!response.ok) {
        return createApiResponse(null as T, {
          code: 'API_ERROR',
          message: data.error || 'Request failed',
        });
      }
      
      return createApiResponse(data.data);
    } catch (error) {
      return createApiResponse(null as T, {
        code: 'NETWORK_ERROR',
        message: handleApiError(error),
      });
    }
  },

  async patch<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      
      if (!response.ok) {
        return createApiResponse(null as T, {
          code: 'API_ERROR',
          message: data.error || 'Request failed',
        });
      }
      
      return createApiResponse(data.data);
    } catch (error) {
      return createApiResponse(null as T, {
        code: 'NETWORK_ERROR',
        message: handleApiError(error),
      });
    }
  },

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (!response.ok) {
        return createApiResponse(null as T, {
          code: 'API_ERROR',
          message: data.error || 'Request failed',
        });
      }
      
      return createApiResponse(data.data || { success: true } as T);
    } catch (error) {
      return createApiResponse(null as T, {
        code: 'NETWORK_ERROR',
        message: handleApiError(error),
      });
    }
  },
};

export default apiClient;