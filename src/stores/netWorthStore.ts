import { create } from 'zustand';
import type { Asset, Liability, CreateAssetRequest, UpdateAssetRequest, CreateLiabilityRequest, UpdateLiabilityRequest } from '@/types/models';
import { assetsApi } from '@/services/api/assets';
import { liabilitiesApi } from '@/services/api/liabilities';
import { NetWorthService } from '@/services/netWorthService';

// Additional types for historical data compatibility
export interface HistoricalDataPoint {
  date: string;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  connectedValue: number;
  manualAssets: number;
  manualLiabilities: number;
  monthOverMonth: number;
}

// Net Worth Calculation Types
export interface NetWorthCalculation {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  monthlyChange: number;
  monthlyChangePercentage: number;
  lastUpdated: string;
}

export interface NetWorthSnapshot {
  month: string;
  netWorth: number;
  assets: number;
  liabilities: number;
  connectedAssets: number;
  manualAssets: number;
  manualLiabilities: number;
  timestamp: string;
}

export interface AssetBreakdown {
  category: string;
  total: number;
  percentage: number;
  count: number;
}

export interface LiabilityBreakdown {
  category: string;
  total: number;
  percentage: number;
  count: number;
}

interface NetWorthState {
  // Assets
  assets: Asset[];
  isLoadingAssets: boolean;
  
  // Liabilities (for future stories)
  liabilities: Liability[];
  isLoadingLiabilities: boolean;
  
  // Net Worth Calculation State
  currentNetWorth: NetWorthCalculation | null;
  isCalculating: boolean;
  calculationError: string | null;
  
  // Historical Data
  historicalData: NetWorthSnapshot[];
  isLoadingHistory: boolean;
  
  // Breakdown Data
  assetsBreakdown: AssetBreakdown[];
  liabilitiesBreakdown: LiabilityBreakdown[];
  
  // General state
  error: string | null;
  isLoading: boolean;
}

interface NetWorthActions {
  // Loading states
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Net Worth Calculation Actions
  refreshNetWorth: (userId?: string) => Promise<void>;
  resetCalculationError: () => void;
  
  // Historical Data Actions
  loadHistoricalData: (userId?: string, months?: number) => Promise<void>;
  addNetWorthSnapshot: (snapshot: NetWorthSnapshot) => void;
  getHistoricalData: (months?: number) => Promise<HistoricalDataPoint[]>;
  getHistoricalDataByDateRange: (startDate: Date, endDate: Date) => Promise<HistoricalDataPoint[]>;
  
  // Asset actions
  loadAssets: (userId: string) => Promise<void>;
  createAsset: (userId: string, assetData: CreateAssetRequest) => Promise<boolean>;
  updateAsset: (userId: string, id: string, updates: UpdateAssetRequest) => Promise<boolean>;
  deleteAsset: (userId: string, id: string) => Promise<boolean>;
  
  // Liability actions
  loadLiabilities: (userId: string) => Promise<void>;
  createLiability: (userId: string, liabilityData: CreateLiabilityRequest) => Promise<boolean>;
  updateLiability: (userId: string, id: string, updates: UpdateLiabilityRequest) => Promise<boolean>;
  deleteLiability: (userId: string, id: string) => Promise<boolean>;
}

interface NetWorthStore extends NetWorthState, NetWorthActions {}

const toHistoricalDataPoint = (
  snapshot: NetWorthSnapshot,
  index: number,
  snapshots: NetWorthSnapshot[]
): HistoricalDataPoint => {
  const previousSnapshot = index > 0 ? snapshots[index - 1] : null;
  const monthOverMonth = previousSnapshot ? snapshot.netWorth - previousSnapshot.netWorth : 0;

  return {
    date: snapshot.timestamp,
    netWorth: snapshot.netWorth,
    totalAssets: snapshot.assets,
    totalLiabilities: snapshot.liabilities,
    connectedValue: snapshot.connectedAssets,
    manualAssets: snapshot.manualAssets,
    manualLiabilities: snapshot.manualLiabilities,
    monthOverMonth,
  };
};

const snapshotsAreEquivalent = (left: NetWorthSnapshot, right: NetWorthSnapshot): boolean =>
  left.netWorth === right.netWorth &&
  left.assets === right.assets &&
  left.liabilities === right.liabilities &&
  left.connectedAssets === right.connectedAssets &&
  left.manualAssets === right.manualAssets &&
  left.manualLiabilities === right.manualLiabilities;

export const useNetWorthStore = create<NetWorthStore>((set, get) => ({
  // Initial state
  assets: [],
  isLoadingAssets: false,
  liabilities: [],
  isLoadingLiabilities: false,
  currentNetWorth: null,
  isCalculating: false,
  calculationError: null,
  historicalData: [],
  isLoadingHistory: false,
  assetsBreakdown: [],
  liabilitiesBreakdown: [],
  error: null,
  isLoading: false,

  // General actions
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Net Worth Calculation Actions
  refreshNetWorth: async (userId?: string) => {
    set({ isCalculating: true, calculationError: null });

    try {
      const { assets, liabilities } = get();
      const resolvedUserId = userId || assets[0]?.user_id || liabilities[0]?.user_id;

      if (!resolvedUserId) {
        set({
          currentNetWorth: {
            netWorth: 0,
            totalAssets: 0,
            totalLiabilities: 0,
            monthlyChange: 0,
            monthlyChangePercentage: 0,
            lastUpdated: new Date().toISOString(),
          },
          assetsBreakdown: [],
          liabilitiesBreakdown: [],
        });
        return;
      }

      const summary = await NetWorthService.getNetWorth(resolvedUserId);

      const calculation: NetWorthCalculation = {
        netWorth: summary.netWorth,
        totalAssets: summary.totalAssets,
        totalLiabilities: summary.totalLiabilities,
        monthlyChange: summary.monthlyChange,
        monthlyChangePercentage: summary.monthlyChangePercentage,
        lastUpdated: new Date().toISOString(),
      };

      set({
        currentNetWorth: calculation,
        assetsBreakdown: summary.assetsBreakdown.map((item) => ({
          category: item.key,
          total: item.amount,
          percentage: item.percentage,
          count: item.count,
        })),
        liabilitiesBreakdown: summary.liabilitiesBreakdown.map((item) => ({
          category: item.key,
          total: item.amount,
          percentage: item.percentage,
          count: item.count,
        })),
      });
    } catch (error) {
      set({ calculationError: 'Failed to calculate net worth' });
      console.error('Error calculating net worth:', error);
    } finally {
      set({ isCalculating: false });
    }
  },

  resetCalculationError: () => set({ calculationError: null }),

  // Historical Data Actions
  loadHistoricalData: async (userId?: string, months?: number) => {
    set({ isLoadingHistory: true });

    try {
      if (!userId) {
        set({ historicalData: [] });
        return;
      }

      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
      const query = new URLSearchParams({ userId });
      if (typeof months === 'number' && months > 0) {
        query.set('months', String(months));
      }

      const response = await fetch(`${API_URL}/networth/history?${query.toString()}`);
      
      if (!response.ok) {
        console.log('[NetWorthStore] No historical data available yet');
        set({ historicalData: [] });
        return;
      }

      const json = await response.json();
      const snapshots = json.data || [];
      
      // Convert API response to NetWorthSnapshot format
      const historicalData: NetWorthSnapshot[] = snapshots.map((snapshot: any) => {
        const date = new Date(snapshot.createdAt);
        const assetBreakdown = snapshot.breakdown?.assets || {};
        const connectedAssets = Number(assetBreakdown.accounts ?? 0);
        const totalAssets = Number(snapshot.totalAssets || 0);
        const manualAssets = Number(assetBreakdown.manual ?? totalAssets - connectedAssets);
        const totalLiabilities = Number(snapshot.totalLiabilities || 0);

        return {
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          netWorth: Number(snapshot.netWorth || 0),
          assets: totalAssets,
          liabilities: totalLiabilities,
          connectedAssets,
          manualAssets: Math.max(0, manualAssets),
          manualLiabilities: totalLiabilities,
          timestamp: snapshot.createdAt,
        };
      });
      const condensedHistory = historicalData.reduce<NetWorthSnapshot[]>((accumulator, snapshot) => {
        const previousSnapshot = accumulator[accumulator.length - 1];
        if (!previousSnapshot || !snapshotsAreEquivalent(previousSnapshot, snapshot)) {
          accumulator.push(snapshot);
          return accumulator;
        }

        accumulator[accumulator.length - 1] = snapshot;
        return accumulator;
      }, []);

      set({ historicalData: condensedHistory });
    } catch (error) {
      console.error('Error loading historical data:', error);
      set({ historicalData: [] });
    } finally {
      set({ isLoadingHistory: false });
    }
  },

  addNetWorthSnapshot: (snapshot: NetWorthSnapshot) => {
    const { historicalData } = get();
    const updatedHistory = [...historicalData, snapshot];
    
    // Keep only the last 12 months
    if (updatedHistory.length > 12) {
      updatedHistory.shift();
    }
    
    set({ historicalData: updatedHistory });
  },

  // New historical data methods for the history screen
  getHistoricalData: async (months?: number): Promise<HistoricalDataPoint[]> => {
    const { historicalData } = get();
    
    // Convert NetWorthSnapshot to HistoricalDataPoint format
    const convertedData: HistoricalDataPoint[] = historicalData.map(toHistoricalDataPoint);

    // Filter by months if specified
    if (months && months !== -1) {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - months);
      
      return convertedData.filter(point => 
        new Date(point.date) >= cutoffDate
      );
    }
    
    return convertedData;
  },

  getHistoricalDataByDateRange: async (startDate: Date, endDate: Date): Promise<HistoricalDataPoint[]> => {
    const { historicalData } = get();
    
    // Convert NetWorthSnapshot to HistoricalDataPoint format
    const convertedData: HistoricalDataPoint[] = historicalData.map(toHistoricalDataPoint);

    // Filter by date range
    return convertedData.filter(point => {
      const pointDate = new Date(point.date);
      return pointDate >= startDate && pointDate <= endDate;
    });
  },

  // Asset actions
  loadAssets: async (userId: string) => {
    const { setError } = get();
    
    set({ isLoadingAssets: true, error: null });

    try {
      const response = await assetsApi.list(userId);
      
      if (response.error) {
        setError(response.error.message);
        return;
      }

      let assets = response.data || [];
      
      // Sort assets by creation date (most recent first)
      assets = assets.sort((a: Asset, b: Asset) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      set({ assets });
    } catch (error) {
      setError('Failed to load assets');
      console.error('Error loading assets:', error);
    } finally {
      set({ isLoadingAssets: false });
    }
  },

  createAsset: async (userId: string, assetData) => {
    const { setError, loadAssets, refreshNetWorth, loadHistoricalData } = get();
    
    set({ isLoading: true, error: null });

    try {
      const response = await assetsApi.create(userId, assetData);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }

      await Promise.all([
        loadAssets(userId),
        refreshNetWorth(userId),
        loadHistoricalData(userId),
      ]);
      return true;
    } catch (error) {
      setError('Failed to create asset');
      console.error('Error creating asset:', error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  updateAsset: async (userId: string, id, updates) => {
    const { setError, loadAssets, refreshNetWorth, loadHistoricalData } = get();
    
    set({ isLoading: true, error: null });

    try {
      const response = await assetsApi.update(userId, id, updates);
      
      if (response.error) {
        setError(response.error.message);
        await loadAssets(userId);
        return false;
      }

      await Promise.all([
        loadAssets(userId),
        refreshNetWorth(userId),
        loadHistoricalData(userId),
      ]);
      return true;
    } catch (error) {
      setError('Failed to update asset');
      console.error('Error updating asset:', error);
      await loadAssets(userId);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteAsset: async (userId: string, id) => {
    const { setError, loadAssets, refreshNetWorth, loadHistoricalData } = get();
    
    set({ isLoading: true, error: null });

    try {
      const response = await assetsApi.delete(userId, id);
      
      if (response.error) {
        setError(response.error.message);
        await loadAssets(userId);
        return false;
      }

      await Promise.all([
        loadAssets(userId),
        refreshNetWorth(userId),
        loadHistoricalData(userId),
      ]);
      return true;
    } catch (error) {
      setError('Failed to delete asset');
      console.error('Error deleting asset:', error);
      await loadAssets(userId);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  // Liability actions
  loadLiabilities: async (userId: string) => {
    const { setError } = get();
    
    set({ isLoadingLiabilities: true, error: null });

    try {
      const response = await liabilitiesApi.list(userId);
      
      if (response.error) {
        setError(response.error.message);
        return;
      }

      let liabilities = response.data || [];
      
      // Sort liabilities by creation date (most recent first)
      liabilities = liabilities.sort((a: Liability, b: Liability) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      set({ liabilities });
    } catch (error) {
      setError('Failed to load liabilities');
      console.error('Error loading liabilities:', error);
    } finally {
      set({ isLoadingLiabilities: false });
    }
  },

  createLiability: async (userId: string, liabilityData) => {
    const { setError, loadLiabilities, refreshNetWorth, loadHistoricalData } = get();
    
    set({ isLoading: true, error: null });

    try {
      const response = await liabilitiesApi.create(userId, liabilityData);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }

      await Promise.all([
        loadLiabilities(userId),
        refreshNetWorth(userId),
        loadHistoricalData(userId),
      ]);
      return true;
    } catch (error) {
      setError('Failed to create liability');
      console.error('Error creating liability:', error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  updateLiability: async (userId: string, id, updates) => {
    const { setError, loadLiabilities, refreshNetWorth, loadHistoricalData } = get();
    
    set({ isLoading: true, error: null });

    try {
      const response = await liabilitiesApi.update(userId, id, updates);
      
      if (response.error) {
        setError(response.error.message);
        await loadLiabilities(userId);
        return false;
      }

      await Promise.all([
        loadLiabilities(userId),
        refreshNetWorth(userId),
        loadHistoricalData(userId),
      ]);
      return true;
    } catch (error) {
      setError('Failed to update liability');
      console.error('Error updating liability:', error);
      await loadLiabilities(userId);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteLiability: async (userId: string, id) => {
    const { setError, loadLiabilities, refreshNetWorth, loadHistoricalData } = get();
    
    set({ isLoading: true, error: null });

    try {
      const response = await liabilitiesApi.delete(userId, id);
      
      if (response.error) {
        setError(response.error.message);
        await loadLiabilities(userId);
        return false;
      }

      await Promise.all([
        loadLiabilities(userId),
        refreshNetWorth(userId),
        loadHistoricalData(userId),
      ]);
      return true;
    } catch (error) {
      setError('Failed to delete liability');
      console.error('Error deleting liability:', error);
      await loadLiabilities(userId);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
}));

// Asset selectors
export const useAssetData = () => {
  const assets = useNetWorthStore(state => state.assets);
  const isLoadingAssets = useNetWorthStore(state => state.isLoadingAssets);
  const error = useNetWorthStore(state => state.error);

  const getTotalAssetValue = (): number => {
    return assets.reduce((total, asset) => total + asset.current_value, 0);
  };

  const getAssetsByCategory = (category: string) => {
    return assets.filter(asset => asset.category === category);
  };

  const getAssetCount = (): number => {
    return assets.length;
  };

  const getTopAssets = (limit: number = 5) => {
    return [...assets]
      .sort((a, b) => b.current_value - a.current_value)
      .slice(0, limit);
  };

  const getCategoryBreakdown = () => {
    const breakdown = assets.reduce((acc, asset) => {
      const category = asset.category;
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0, assets: [] };
      }
      acc[category].total += asset.current_value;
      acc[category].count += 1;
      acc[category].assets.push(asset);
      return acc;
    }, {} as Record<string, { total: number; count: number; assets: Asset[] }>);

    return Object.entries(breakdown).map(([category, data]) => ({
      category,
      ...data,
    }));
  };

  const getRecentAssets = (limit: number = 5) => {
    return [...assets]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  };

  return {
    assets,
    isLoadingAssets,
    error,
    totalAssetValue: getTotalAssetValue(),
    assetCount: getAssetCount(),
    topAssets: getTopAssets(),
    categoryBreakdown: getCategoryBreakdown(),
    recentAssets: getRecentAssets(),
    getAssetsByCategory,
  };
};

// Liability selectors
export const useLiabilityData = () => {
  const liabilities = useNetWorthStore(state => state.liabilities);
  const isLoadingLiabilities = useNetWorthStore(state => state.isLoadingLiabilities);
  const error = useNetWorthStore(state => state.error);

  const getTotalLiabilityBalance = (): number => {
    return liabilities.reduce((total, liability) => total + liability.current_balance, 0);
  };

  const getLiabilitiesByCategory = (category: string) => {
    return liabilities.filter(liability => liability.category === category);
  };

  const getLiabilityCount = (): number => {
    return liabilities.length;
  };

  const getTopLiabilities = (limit: number = 5) => {
    return [...liabilities]
      .sort((a, b) => b.current_balance - a.current_balance)
      .slice(0, limit);
  };

  const getCategoryBreakdown = () => {
    const breakdown = liabilities.reduce((acc, liability) => {
      const category = liability.category;
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0, liabilities: [] };
      }
      acc[category].total += liability.current_balance;
      acc[category].count += 1;
      acc[category].liabilities.push(liability);
      return acc;
    }, {} as Record<string, { total: number; count: number; liabilities: Liability[] }>);

    return Object.entries(breakdown).map(([category, data]) => ({
      category,
      ...data,
    }));
  };

  const getRecentLiabilities = (limit: number = 5) => {
    return [...liabilities]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  };

  const getTotalMonthlyPayments = (): number => {
    return liabilities.reduce((total, liability) => total + (liability.monthly_payment || 0), 0);
  };

  const getHighestInterestRates = (limit: number = 5) => {
    return [...liabilities]
      .filter(liability => liability.interest_rate !== null && liability.interest_rate !== undefined)
      .sort((a, b) => (b.interest_rate || 0) - (a.interest_rate || 0))
      .slice(0, limit);
  };

  return {
    liabilities,
    isLoadingLiabilities,
    error,
    totalLiabilityBalance: getTotalLiabilityBalance(),
    liabilityCount: getLiabilityCount(),
    topLiabilities: getTopLiabilities(),
    categoryBreakdown: getCategoryBreakdown(),
    recentLiabilities: getRecentLiabilities(),
    totalMonthlyPayments: getTotalMonthlyPayments(),
    highestInterestRates: getHighestInterestRates(),
    getLiabilitiesByCategory,
  };
};

// Net Worth Dashboard selector
export const useNetWorthDashboard = () => {
  const currentNetWorth = useNetWorthStore(state => state.currentNetWorth);
  const isCalculating = useNetWorthStore(state => state.isCalculating);
  const calculationError = useNetWorthStore(state => state.calculationError);
  const historicalData = useNetWorthStore(state => state.historicalData);
  const isLoadingHistory = useNetWorthStore(state => state.isLoadingHistory);
  const assetsBreakdown = useNetWorthStore(state => state.assetsBreakdown);
  const liabilitiesBreakdown = useNetWorthStore(state => state.liabilitiesBreakdown);
  
  const refreshNetWorth = useNetWorthStore(state => state.refreshNetWorth);
  const loadHistoricalData = useNetWorthStore(state => state.loadHistoricalData);
  const resetCalculationError = useNetWorthStore(state => state.resetCalculationError);

  return {
    // Current calculation
    currentNetWorth,
    isCalculating,
    calculationError,
    
    // Historical data
    historicalData,
    isLoadingHistory,
    
    // Breakdown data
    assetsBreakdown,
    liabilitiesBreakdown,
    
    // Actions
    refreshNetWorth,
    loadHistoricalData,
    resetCalculationError,
  };
};
