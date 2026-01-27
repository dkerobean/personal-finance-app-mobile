/**
 * Reports API - Uses Backend API
 */

import { apiClient } from '../apiClient';
import type { MonthlyReport, ReportComparison } from '@/types/models';

export interface AvailableMonth {
  month: string;
  transaction_count: number;
  total_amount: number;
}

export interface ReportsResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

class ReportsApi {
  getMonthlyReport = async (month: string, userId: string): Promise<{ data: MonthlyReport | null; error: { code: string; message: string } | null }> => {
    try {
      const response = await apiClient.get<MonthlyReport>(`/reports?userId=${encodeURIComponent(userId)}&month=${encodeURIComponent(month)}`);
      return response;
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

  getReportComparison = async (currentMonth: string, previousMonth: string, userId: string): Promise<{ data: ReportComparison | null; error: { code: string; message: string } | null }> => {
    try {
      const response = await apiClient.get<ReportComparison>(
        `/reports/comparison?userId=${encodeURIComponent(userId)}&current_month=${encodeURIComponent(currentMonth)}&previous_month=${encodeURIComponent(previousMonth)}`
      );
      return response;
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
}

export const reportsApi = new ReportsApi();