import { supabase } from './supabaseClient';

export interface NetWorthData {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  monthlyChange: number;
  monthlyChangePercentage: number;
  manualAssetsValue: number;
  manualLiabilitiesValue: number;
  connectedAccountsValue: number;
  connectedAccountDebt: number;
  liquidAssetsValue: number;
  appreciatingAssetsValue: number;
  monthlyDebtPayments: number;
  totalAssetGain: number;
  debtToAssetRatio: number;
  assetCoverageRatio: number | null;
  assetsBreakdown: {
    key: string;
    label: string;
    amount: number;
    percentage: number;
    count: number;
    color: string;
    isConnected?: boolean;
  }[];
  liabilitiesBreakdown: {
    key: string;
    label: string;
    amount: number;
    percentage: number;
    count: number;
    color: string;
    isConnected?: boolean;
  }[];
  topAssets: {
    id: string;
    name: string;
    label: string;
    amount: number;
    changeAmount: number;
    changePercentage: number | null;
    category: string;
    trackingMethod: string;
    lastUpdated: string;
  }[];
  topLiabilities: {
    id: string;
    name: string;
    label: string;
    amount: number;
    changeAmount: number;
    interestRate: number | null;
    monthlyPayment: number | null;
    category: string;
    lastUpdated: string;
  }[];
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
}

export class NetWorthService {
  static async calculateNetWorth(userId: string): Promise<NetWorthData> {
    if (!userId) {
      throw new Error('userId is required');
    }
    return this.getNetWorth(userId);
  }

  static async getNetWorth(userId: string): Promise<NetWorthData> {
    if (!userId) {
      throw new Error('userId is required');
    }

    try {
      const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(
        `${apiBaseUrl}/networth/current?userId=${encodeURIComponent(userId)}&_t=${Date.now()}`
      );
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.error || 'Failed to fetch net worth');
      }

      const data = json?.data || {};

      return {
        netWorth: Number(data.netWorth ?? 0),
        totalAssets: Number(data.totalAssets ?? 0),
        totalLiabilities: Number(data.totalLiabilities ?? 0),
        monthlyChange: Number(data.monthlyChange ?? 0),
        monthlyChangePercentage: Number(data.monthlyChangePercentage ?? 0),
        manualAssetsValue: Number(data.manualAssetsValue ?? 0),
        manualLiabilitiesValue: Number(data.manualLiabilitiesValue ?? 0),
        connectedAccountsValue: Number(data.connectedAccountsValue ?? 0),
        connectedAccountDebt: Number(data.connectedAccountDebt ?? 0),
        liquidAssetsValue: Number(data.liquidAssetsValue ?? 0),
        appreciatingAssetsValue: Number(data.appreciatingAssetsValue ?? 0),
        monthlyDebtPayments: Number(data.monthlyDebtPayments ?? 0),
        totalAssetGain: Number(data.totalAssetGain ?? 0),
        debtToAssetRatio: Number(data.debtToAssetRatio ?? 0),
        assetCoverageRatio: data.assetCoverageRatio === null || data.assetCoverageRatio === undefined
          ? null
          : Number(data.assetCoverageRatio),
        assetsBreakdown: Array.isArray(data.assetsBreakdown) ? data.assetsBreakdown : [],
        liabilitiesBreakdown: Array.isArray(data.liabilitiesBreakdown) ? data.liabilitiesBreakdown : [],
        topAssets: Array.isArray(data.topAssets) ? data.topAssets : [],
        topLiabilities: Array.isArray(data.topLiabilities) ? data.topLiabilities : [],
        monthlyIncome: Number(data.monthlyIncome ?? 0),
        monthlyExpenses: Number(data.monthlyExpenses ?? 0),
        savingsRate: Number(data.savingsRate ?? 0),
      };
    } catch (error) {
      console.error('Failed to get net worth from API:', error);
      throw error;
    }
  }

  static async saveNetWorthSnapshot(userId: string, netWorthData: NetWorthData): Promise<void> {
    try {
      const { error } = await supabase
        .from('net_worth_snapshots')
        .insert({
          user_id: userId,
          snapshot_date: new Date().toISOString().split('T')[0],
          total_assets: netWorthData.totalAssets,
          total_liabilities: netWorthData.totalLiabilities,
          net_worth: netWorthData.netWorth,
          manual_assets_value: netWorthData.totalAssets,
          manual_liabilities_value: netWorthData.totalLiabilities,
        });

      if (error) {
        console.error('Error saving net worth snapshot:', error);
      }
    } catch (error) {
      console.error('Error saving net worth snapshot:', error);
    }
  }
}
