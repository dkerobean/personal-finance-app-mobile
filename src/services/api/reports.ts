import { supabase } from '../supabaseClient';
import { ApiResponse } from '@/types/api';
import type { MonthlyReport, ReportComparison } from '@/types/models';

export interface AvailableMonth {
  month: string;
  transaction_count: number;
  total_amount: number;
}

export interface ReportsResponse {
  success: boolean;
  data?: MonthlyReport | ReportComparison | AvailableMonth[];
  error?: {
    code: string;
    message: string;
  };
}

class ReportsApi {
  private getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    };
  };

  private getBaseUrl = () => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/reports`;
  };

  getMonthlyReport = async (month: string): Promise<ApiResponse<MonthlyReport>> => {
    try {
      const headers = await this.getAuthHeaders();
      const url = `${this.getBaseUrl()}?month=${encodeURIComponent(month)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const result: ReportsResponse = await response.json();

      if (!result.success) {
        return {
          data: null,
          error: result.error || { 
            message: 'Failed to fetch monthly report', 
            code: 'FETCH_ERROR' 
          },
        };
      }

      return {
        data: result.data as MonthlyReport,
        error: null,
      };
    } catch (error) {
      console.error('Error fetching monthly report:', error);
      return {
        data: null,
        error: {
          message: 'Network error while fetching monthly report',
          code: 'NETWORK_ERROR',
        },
      };
    }
  };

  getReportComparison = async (currentMonth: string, previousMonth: string): Promise<ApiResponse<ReportComparison>> => {
    try {
      const headers = await this.getAuthHeaders();
      const url = `${this.getBaseUrl()}/comparison?current_month=${encodeURIComponent(currentMonth)}&previous_month=${encodeURIComponent(previousMonth)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const result: ReportsResponse = await response.json();

      if (!result.success) {
        return {
          data: null,
          error: result.error || { 
            message: 'Failed to fetch report comparison', 
            code: 'FETCH_ERROR' 
          },
        };
      }

      return {
        data: result.data as ReportComparison,
        error: null,
      };
    } catch (error) {
      console.error('Error fetching report comparison:', error);
      return {
        data: null,
        error: {
          message: 'Network error while fetching report comparison',
          code: 'NETWORK_ERROR',
        },
      };
    }
  };

  getAvailableMonths = async (limit: number = 12): Promise<ApiResponse<AvailableMonth[]>> => {
    try {
      const headers = await this.getAuthHeaders();
      const url = `${this.getBaseUrl()}/available-months?limit=${limit}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const result: ReportsResponse = await response.json();

      if (!result.success) {
        return {
          data: null,
          error: result.error || { 
            message: 'Failed to fetch available months', 
            code: 'FETCH_ERROR' 
          },
        };
      }

      return {
        data: result.data as AvailableMonth[],
        error: null,
      };
    } catch (error) {
      console.error('Error fetching available months:', error);
      return {
        data: null,
        error: {
          message: 'Network error while fetching available months',
          code: 'NETWORK_ERROR',
        },
      };
    }
  };
}

export const reportsApi = new ReportsApi();