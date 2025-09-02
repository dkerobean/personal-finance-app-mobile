import { create } from 'zustand';
import type { Asset, Liability, CreateAssetRequest, UpdateAssetRequest, CreateLiabilityRequest, UpdateLiabilityRequest } from '@/types/models';
import { assetsApi } from '@/services/api/assets';
import { liabilitiesApi } from '@/services/api/liabilities';

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
  refreshNetWorth: () => Promise<void>;
  resetCalculationError: () => void;
  
  // Historical Data Actions
  loadHistoricalData: () => Promise<void>;
  addNetWorthSnapshot: (snapshot: NetWorthSnapshot) => void;
  getHistoricalData: (months?: number) => Promise<HistoricalDataPoint[]>;
  getHistoricalDataByDateRange: (startDate: Date, endDate: Date) => Promise<HistoricalDataPoint[]>;
  
  // Asset actions
  loadAssets: () => Promise<void>;
  createAsset: (assetData: CreateAssetRequest) => Promise<boolean>;
  updateAsset: (id: string, updates: UpdateAssetRequest) => Promise<boolean>;
  deleteAsset: (id: string) => Promise<boolean>;
  
  // Future liability actions (placeholders)
  loadLiabilities: () => Promise<void>;
  createLiability: (liabilityData: CreateLiabilityRequest) => Promise<boolean>;
  updateLiability: (id: string, updates: UpdateLiabilityRequest) => Promise<boolean>;
  deleteLiability: (id: string) => Promise<boolean>;
}

interface NetWorthStore extends NetWorthState, NetWorthActions {}

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
  refreshNetWorth: async () => {
    set({ isCalculating: true, calculationError: null });

    try {
      const { assets, liabilities } = get();
      
      // Calculate totals
      const totalAssets = assets.reduce((total, asset) => total + asset.current_value, 0);
      const totalLiabilities = liabilities.reduce((total, liability) => total + liability.current_balance, 0);
      const netWorth = totalAssets - totalLiabilities;

      // Calculate breakdown data
      const assetsBreakdown: AssetBreakdown[] = [];
      const assetsByCategory = assets.reduce((acc, asset) => {
        if (!acc[asset.category]) {
          acc[asset.category] = { total: 0, count: 0 };
        }
        acc[asset.category].total += asset.current_value;
        acc[asset.category].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      Object.entries(assetsByCategory).forEach(([category, data]) => {
        assetsBreakdown.push({
          category,
          total: data.total,
          percentage: totalAssets > 0 ? (data.total / totalAssets) * 100 : 0,
          count: data.count,
        });
      });

      const liabilitiesBreakdown: LiabilityBreakdown[] = [];
      const liabilitiesByCategory = liabilities.reduce((acc, liability) => {
        if (!acc[liability.category]) {
          acc[liability.category] = { total: 0, count: 0 };
        }
        acc[liability.category].total += liability.current_balance;
        acc[liability.category].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      Object.entries(liabilitiesByCategory).forEach(([category, data]) => {
        liabilitiesBreakdown.push({
          category,
          total: data.total,
          percentage: totalLiabilities > 0 ? (data.total / totalLiabilities) * 100 : 0,
          count: data.count,
        });
      });

      // Calculate monthly change from historical data
      const { historicalData } = get();
      let monthlyChange = 0;
      let monthlyChangePercentage = 0;
      
      if (historicalData.length > 0) {
        const lastMonth = historicalData[historicalData.length - 1];
        monthlyChange = netWorth - lastMonth.netWorth;
        monthlyChangePercentage = lastMonth.netWorth !== 0 
          ? (monthlyChange / Math.abs(lastMonth.netWorth)) * 100 
          : 0;
      }

      const calculation: NetWorthCalculation = {
        netWorth,
        totalAssets,
        totalLiabilities,
        monthlyChange,
        monthlyChangePercentage,
        lastUpdated: new Date().toISOString(),
      };

      set({
        currentNetWorth: calculation,
        assetsBreakdown,
        liabilitiesBreakdown,
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
  loadHistoricalData: async () => {
    set({ isLoadingHistory: true });

    try {
      // Generate mock historical data for now - in production this would come from an API
      const mockHistoricalData: NetWorthSnapshot[] = [];
      const currentDate = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() - i);
        
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        const baseNetWorth = 50000;
        const randomVariation = (Math.random() - 0.5) * 20000;
        const trendGrowth = i * 2000;
        
        const assets = baseNetWorth + trendGrowth + randomVariation + 30000;
        const liabilities = 30000 - (i * 500) + (Math.random() - 0.5) * 5000;
        
        mockHistoricalData.push({
          month: monthName,
          netWorth: assets - liabilities,
          assets: Math.max(0, assets),
          liabilities: Math.max(0, liabilities),
          timestamp: date.toISOString(),
        });
      }

      set({ historicalData: mockHistoricalData });
    } catch (error) {
      console.error('Error loading historical data:', error);
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
    const convertedData: HistoricalDataPoint[] = historicalData.map((snapshot, index, array) => {
      const previousSnapshot = index > 0 ? array[index - 1] : null;
      const monthOverMonth = previousSnapshot 
        ? snapshot.netWorth - previousSnapshot.netWorth 
        : 0;
      
      return {
        date: snapshot.timestamp,
        netWorth: snapshot.netWorth,
        totalAssets: snapshot.assets,
        totalLiabilities: snapshot.liabilities,
        connectedValue: snapshot.assets * 0.6, // Assume 60% connected
        manualAssets: snapshot.assets * 0.4,   // Assume 40% manual
        manualLiabilities: snapshot.liabilities, // Assume all manual for now
        monthOverMonth,
      };
    });

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
    const convertedData: HistoricalDataPoint[] = historicalData.map((snapshot, index, array) => {
      const previousSnapshot = index > 0 ? array[index - 1] : null;
      const monthOverMonth = previousSnapshot 
        ? snapshot.netWorth - previousSnapshot.netWorth 
        : 0;
      
      return {
        date: snapshot.timestamp,
        netWorth: snapshot.netWorth,
        totalAssets: snapshot.assets,
        totalLiabilities: snapshot.liabilities,
        connectedValue: snapshot.assets * 0.6, // Assume 60% connected
        manualAssets: snapshot.assets * 0.4,   // Assume 40% manual
        manualLiabilities: snapshot.liabilities, // Assume all manual for now
        monthOverMonth,
      };
    });

    // Filter by date range
    return convertedData.filter(point => {
      const pointDate = new Date(point.date);
      return pointDate >= startDate && pointDate <= endDate;
    });
  },

  // Asset actions
  loadAssets: async () => {
    const { setError } = get();
    
    set({ isLoadingAssets: true, error: null });

    try {
      const response = await assetsApi.list();
      
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

  createAsset: async (assetData) => {
    const { setError, loadAssets } = get();
    
    set({ isLoading: true, error: null });

    try {
      const response = await assetsApi.create(assetData);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }

      // Optimistically add the asset to the list
      if (response.data) {
        const { assets } = get();
        const newAssets = [response.data, ...assets];
        set({ assets: newAssets });
      }

      // Reload assets to ensure consistency
      await loadAssets();
      return true;
    } catch (error) {
      setError('Failed to create asset');
      console.error('Error creating asset:', error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  updateAsset: async (id, updates) => {
    const { setError, loadAssets } = get();
    
    set({ isLoading: true, error: null });

    try {
      // Optimistic update
      const { assets } = get();
      const optimisticAssets = assets.map(asset => 
        asset.id === id 
          ? { ...asset, ...updates, updated_at: new Date().toISOString() }
          : asset
      );
      set({ assets: optimisticAssets });

      const response = await assetsApi.update(id, updates);
      
      if (response.error) {
        setError(response.error.message);
        // Revert optimistic update
        await loadAssets();
        return false;
      }

      // Reload assets to ensure consistency
      await loadAssets();
      return true;
    } catch (error) {
      setError('Failed to update asset');
      console.error('Error updating asset:', error);
      // Revert optimistic update
      await loadAssets();
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteAsset: async (id) => {
    const { setError, loadAssets } = get();
    
    set({ isLoading: true, error: null });

    try {
      // Optimistic update
      const { assets } = get();
      const optimisticAssets = assets.filter(asset => asset.id !== id);
      set({ assets: optimisticAssets });

      const response = await assetsApi.delete(id);
      
      if (response.error) {
        setError(response.error.message);
        // Revert optimistic update
        await loadAssets();
        return false;
      }

      // Keep the optimistic update since it was successful
      return true;
    } catch (error) {
      setError('Failed to delete asset');
      console.error('Error deleting asset:', error);
      // Revert optimistic update
      await loadAssets();
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  // Liability actions
  loadLiabilities: async () => {
    const { setError } = get();
    
    set({ isLoadingLiabilities: true, error: null });

    try {
      const response = await liabilitiesApi.list();
      
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

  createLiability: async (liabilityData) => {
    const { setError, loadLiabilities } = get();
    
    set({ isLoading: true, error: null });

    try {
      const response = await liabilitiesApi.create(liabilityData);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }

      // Optimistically add the liability to the list
      if (response.data) {
        const { liabilities } = get();
        const newLiabilities = [response.data, ...liabilities];
        set({ liabilities: newLiabilities });
      }

      // Reload liabilities to ensure consistency
      await loadLiabilities();
      return true;
    } catch (error) {
      setError('Failed to create liability');
      console.error('Error creating liability:', error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  updateLiability: async (id, updates) => {
    const { setError, loadLiabilities } = get();
    
    set({ isLoading: true, error: null });

    try {
      // Optimistic update
      const { liabilities } = get();
      const optimisticLiabilities = liabilities.map(liability => 
        liability.id === id 
          ? { ...liability, ...updates, updated_at: new Date().toISOString() }
          : liability
      );
      set({ liabilities: optimisticLiabilities });

      const response = await liabilitiesApi.update(id, updates);
      
      if (response.error) {
        setError(response.error.message);
        // Revert optimistic update
        await loadLiabilities();
        return false;
      }

      // Reload liabilities to ensure consistency
      await loadLiabilities();
      return true;
    } catch (error) {
      setError('Failed to update liability');
      console.error('Error updating liability:', error);
      // Revert optimistic update
      await loadLiabilities();
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteLiability: async (id) => {
    const { setError, loadLiabilities } = get();
    
    set({ isLoading: true, error: null });

    try {
      // Optimistic update
      const { liabilities } = get();
      const optimisticLiabilities = liabilities.filter(liability => liability.id !== id);
      set({ liabilities: optimisticLiabilities });

      const response = await liabilitiesApi.delete(id);
      
      if (response.error) {
        setError(response.error.message);
        // Revert optimistic update
        await loadLiabilities();
        return false;
      }

      // Keep the optimistic update since it was successful
      return true;
    } catch (error) {
      setError('Failed to delete liability');
      console.error('Error deleting liability:', error);
      // Revert optimistic update
      await loadLiabilities();
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