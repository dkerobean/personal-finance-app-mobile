import { supabase } from './supabaseClient';
import { Asset, Liability } from '@/types/models';

export interface NetWorthData {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  monthlyChange: number;
  monthlyChangePercentage: number;
  assetsBreakdown: {
    category: string;
    amount: number;
    percentage: number;
    color: string;
    type: 'asset';
    itemCount: number;
    isConnected?: boolean;
  }[];
  liabilitiesBreakdown: {
    category: string;
    amount: number;
    percentage: number;
    color: string;
    type: 'liability';
    itemCount: number;
    isConnected?: boolean;
  }[];
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
}

// Category colors for assets
const ASSET_COLORS: Record<string, string> = {
  property: '#4CAF50',
  investments: '#2196F3',
  cash: '#00BCD4',
  vehicles: '#FF9800',
  personal: '#9C27B0',
  business: '#607D8B',
  other: '#795548',
};

// Category colors for liabilities  
const LIABILITY_COLORS: Record<string, string> = {
  loans: '#F44336',
  credit_cards: '#E91E63',
  mortgages: '#FF5722',
  business_debt: '#9E9E9E',
  other: '#757575',
};

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
        assetsBreakdown: Array.isArray(data.assetsBreakdown) ? data.assetsBreakdown : [],
        liabilitiesBreakdown: Array.isArray(data.liabilitiesBreakdown) ? data.liabilitiesBreakdown : [],
        monthlyIncome: Number(data.monthlyIncome ?? 0),
        monthlyExpenses: Number(data.monthlyExpenses ?? 0),
        savingsRate: Number(data.savingsRate ?? 0),
      };
    } catch (error) {
      console.error('Failed to get net worth from API:', error);
      throw error;
    }
  }



  private static calculateTotalAssets(assets: Asset[], accounts: any[]): number {
    const assetsTotal = assets.reduce((total, asset) => total + Number(asset.current_value), 0);
    const accountsTotal = accounts.reduce((total, account) => total + Number(account.balance || 0), 0);
    return assetsTotal + accountsTotal;
  }

  private static calculateTotalLiabilities(liabilities: Liability[]): number {
    return liabilities.reduce((total, liability) => total + Number(liability.current_balance), 0);
  }

  private static async calculateMonthlyIncomeExpenses(userId: string): Promise<{ monthlyIncome: number; monthlyExpenses: number }> {
    try {
      // Get transactions from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', userId)
        .gte('transaction_date', thirtyDaysAgo.toISOString());

      if (error) {
        console.error('Error fetching transactions:', error);
        return { monthlyIncome: 0, monthlyExpenses: 0 };
      }

      const monthlyIncome = transactions
        ?.filter(t => t.type === 'income')
        .reduce((total, t) => total + Number(t.amount), 0) || 0;

      const monthlyExpenses = transactions
        ?.filter(t => t.type === 'expense')
        .reduce((total, t) => total + Number(t.amount), 0) || 0;

      return { monthlyIncome, monthlyExpenses };
    } catch (error) {
      console.error('Error calculating monthly income/expenses:', error);
      return { monthlyIncome: 0, monthlyExpenses: 0 };
    }
  }

  private static async calculateMonthlyChange(userId: string, currentNetWorth: number): Promise<{ monthlyChange: number; monthlyChangePercentage: number }> {
    try {
      // Get last month's snapshot
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const { data: snapshot, error } = await supabase
        .from('net_worth_snapshots')
        .select('net_worth')
        .eq('user_id', userId)
        .lte('snapshot_date', lastMonth.toISOString().split('T')[0])
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();

      if (error || !snapshot) {
        return { monthlyChange: 0, monthlyChangePercentage: 0 };
      }

      const previousNetWorth = Number(snapshot.net_worth);
      const monthlyChange = currentNetWorth - previousNetWorth;
      const monthlyChangePercentage = previousNetWorth > 0 ? (monthlyChange / previousNetWorth) * 100 : 0;

      return { monthlyChange, monthlyChangePercentage };
    } catch (error) {
      console.error('Error calculating monthly change:', error);
      return { monthlyChange: 0, monthlyChangePercentage: 0 };
    }
  }

  private static calculateAssetsBreakdown(assets: Asset[], accounts: any[]): NetWorthData['assetsBreakdown'] {
    const breakdown: Record<string, { amount: number; count: number }> = {};
    
    // Group assets by category
    assets.forEach(asset => {
      const category = asset.category;
      if (!breakdown[category]) {
        breakdown[category] = { amount: 0, count: 0 };
      }
      breakdown[category].amount += Number(asset.current_value);
      breakdown[category].count += 1;
    });

    // Add accounts as cash assets
    const accountsTotal = accounts.reduce((total, account) => total + Number(account.balance || 0), 0);
    if (accountsTotal > 0) {
      if (!breakdown.cash) {
        breakdown.cash = { amount: 0, count: 0 };
      }
      breakdown.cash.amount += accountsTotal;
      breakdown.cash.count += accounts.length;
    }

    // Calculate total and percentages
    const total = Object.values(breakdown).reduce((sum, item) => sum + item.amount, 0);
    
    return Object.entries(breakdown).map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: total > 0 ? (data.amount / total) * 100 : 0,
      color: ASSET_COLORS[category] || ASSET_COLORS.other,
      type: 'asset' as const,
      itemCount: data.count,
      isConnected: category === 'cash' && accounts.length > 0 ? true : false,
    }));
  }

  private static calculateLiabilitiesBreakdown(liabilities: Liability[]): NetWorthData['liabilitiesBreakdown'] {
    const breakdown: Record<string, { amount: number; count: number }> = {};
    
    // Group liabilities by category
    liabilities.forEach(liability => {
      const category = liability.category;
      if (!breakdown[category]) {
        breakdown[category] = { amount: 0, count: 0 };
      }
      breakdown[category].amount += Number(liability.current_balance);
      breakdown[category].count += 1;
    });

    // Calculate total and percentages
    const total = Object.values(breakdown).reduce((sum, item) => sum + item.amount, 0);
    
    return Object.entries(breakdown).map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: total > 0 ? (data.amount / total) * 100 : 0,
      color: LIABILITY_COLORS[category] || LIABILITY_COLORS.other,
      type: 'liability' as const,
      itemCount: data.count,
      isConnected: false, // Liabilities are typically manual entries
    }));
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
