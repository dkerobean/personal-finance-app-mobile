/**
 * Alerts API - Uses Backend API
 */

import { apiClient, createApiResponse, ApiResponse } from '@/services/apiClient';
import type { AlertSettings as AlertSettingsType, AlertHistory as AlertHistoryType } from '@/types/models';

export interface UpdateAlertSettingsRequest {
  budget_alerts_enabled?: boolean;
  warning_threshold?: number;
  over_budget_alerts_enabled?: boolean;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

export const alertsApi = {
  /**
   * Get alert settings for a user
   */
  async getSettings(userId: string): Promise<ApiResponse<AlertSettingsType>> {
    // TODO: Implement alert settings endpoint in backend API
    // For now, return default settings
    return createApiResponse({
      id: 'default',
      user_id: userId,
      budget_alerts_enabled: true,
      warning_threshold: 90,
      over_budget_alerts_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as AlertSettingsType);
  },

  /**
   * Update alert settings
   */
  async updateSettings(userId: string, request: UpdateAlertSettingsRequest): Promise<ApiResponse<AlertSettingsType>> {
    // TODO: Implement alert settings endpoint in backend API
    return createApiResponse({
      id: 'default',
      user_id: userId,
      budget_alerts_enabled: request.budget_alerts_enabled ?? true,
      warning_threshold: request.warning_threshold ?? 90,
      over_budget_alerts_enabled: request.over_budget_alerts_enabled ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as AlertSettingsType);
  },

  /**
   * Get alert history for a user
   */
  async getHistory(userId: string, limit: number = 50): Promise<ApiResponse<AlertHistoryType[]>> {
    // TODO: Implement alert history endpoint in backend API
    return createApiResponse([] as AlertHistoryType[]);
  },

  /**
   * Check if an alert was already sent for a budget/type combination recently
   */
  async wasAlertSentRecently(
    userId: string,
    budgetId: string,
    alertType: 'warning' | 'over_budget',
    withinHours: number = 24
  ): Promise<boolean> {
    // TODO: Implement in backend API
    return false;
  },
};