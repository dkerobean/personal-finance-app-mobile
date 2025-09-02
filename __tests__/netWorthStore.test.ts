import { renderHook, act } from '@testing-library/react-native';
import { useNetWorthStore, useAssetData, useNetWorthDashboard } from '@/stores/netWorthStore';
import { assetsApi } from '@/services/api/assets';
import { liabilitiesApi } from '@/services/api/liabilities';
import type { Asset, Liability, CreateAssetRequest, UpdateAssetRequest } from '@/types/models';
import type { ApiResponse } from '@/types/api';

// Mock the assets and liabilities APIs
jest.mock('@/services/api/assets');
jest.mock('@/services/api/liabilities');
const mockedAssetsApi = assetsApi as jest.Mocked<typeof assetsApi>;
const mockedLiabilitiesApi = liabilitiesApi as jest.Mocked<typeof liabilitiesApi>;

const mockAsset: Asset = {
  id: '1',
  user_id: 'user-1',
  name: 'Test House',
  category: 'property',
  asset_type: 'real_estate',
  current_value: 100000,
  original_value: 80000,
  purchase_date: '2020-01-01',
  description: 'My primary residence',
  is_active: true,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

const mockCreateAssetRequest: CreateAssetRequest = {
  name: 'New Asset',
  category: 'investments',
  asset_type: 'stocks',
  current_value: 5000,
  original_value: 4000,
  purchase_date: '2023-06-01',
  description: 'Stock investment',
};

describe('NetWorthStore', () => {
  beforeEach(() => {
    // Reset store state
    useNetWorthStore.getState().assets = [];
    useNetWorthStore.getState().isLoadingAssets = false;
    useNetWorthStore.getState().error = null;
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('loadAssets', () => {
    it('should load assets successfully', async () => {
      const mockResponse: ApiResponse<Asset[]> = {
        data: [mockAsset],
        error: null,
      };
      mockedAssetsApi.list.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useNetWorthStore());

      await act(async () => {
        await result.current.loadAssets();
      });

      expect(mockedAssetsApi.list).toHaveBeenCalled();
      expect(result.current.assets).toEqual([mockAsset]);
      expect(result.current.isLoadingAssets).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle API error when loading assets', async () => {
      const mockResponse: ApiResponse<Asset[]> = {
        data: null,
        error: { code: 'API_ERROR', message: 'Failed to fetch assets' },
      };
      mockedAssetsApi.list.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useNetWorthStore());

      await act(async () => {
        await result.current.loadAssets();
      });

      expect(result.current.assets).toEqual([]);
      expect(result.current.error).toBe('Failed to fetch assets');
    });

    it('should sort assets by creation date (most recent first)', async () => {
      const asset1: Asset = { ...mockAsset, id: '1', created_at: '2023-01-01T00:00:00Z' };
      const asset2: Asset = { ...mockAsset, id: '2', created_at: '2023-02-01T00:00:00Z' };
      const asset3: Asset = { ...mockAsset, id: '3', created_at: '2023-01-15T00:00:00Z' };

      const mockResponse: ApiResponse<Asset[]> = {
        data: [asset1, asset2, asset3],
        error: null,
      };
      mockedAssetsApi.list.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useNetWorthStore());

      await act(async () => {
        await result.current.loadAssets();
      });

      expect(result.current.assets[0].id).toBe('2'); // Most recent
      expect(result.current.assets[1].id).toBe('3'); // Middle
      expect(result.current.assets[2].id).toBe('1'); // Oldest
    });
  });

  describe('createAsset', () => {
    it('should create asset successfully', async () => {
      const createdAsset: Asset = { ...mockAsset, ...mockCreateAssetRequest };
      const mockResponse: ApiResponse<Asset> = {
        data: createdAsset,
        error: null,
      };
      mockedAssetsApi.create.mockResolvedValue(mockResponse);
      mockedAssetsApi.list.mockResolvedValue({ data: [createdAsset], error: null });

      const { result } = renderHook(() => useNetWorthStore());

      let success: boolean;
      await act(async () => {
        success = await result.current.createAsset(mockCreateAssetRequest);
      });

      expect(success).toBe(true);
      expect(mockedAssetsApi.create).toHaveBeenCalledWith(mockCreateAssetRequest);
      expect(mockedAssetsApi.list).toHaveBeenCalled(); // Reload after creation
      expect(result.current.error).toBeNull();
    });

    it('should handle creation error', async () => {
      const mockResponse: ApiResponse<Asset> = {
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid asset data' },
      };
      mockedAssetsApi.create.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useNetWorthStore());

      let success: boolean;
      await act(async () => {
        success = await result.current.createAsset(mockCreateAssetRequest);
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Invalid asset data');
    });
  });

  describe('refreshNetWorth', () => {
    it('should calculate net worth correctly', async () => {
      const assets = [
        { ...mockAsset, id: '1', current_value: 100000 },
        { ...mockAsset, id: '2', current_value: 50000 },
      ];
      const liabilities = [
        { id: '1', user_id: 'user-1', name: 'Mortgage', category: 'mortgages', liability_type: 'mortgage', 
          current_balance: 80000, original_balance: 100000, monthly_payment: 1500, interest_rate: 3.5,
          start_date: '2020-01-01', is_active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      ];
      
      useNetWorthStore.getState().assets = assets;
      useNetWorthStore.getState().liabilities = liabilities;

      const { result } = renderHook(() => useNetWorthStore());

      await act(async () => {
        await result.current.refreshNetWorth();
      });

      const currentNetWorth = result.current.currentNetWorth;
      expect(currentNetWorth).not.toBeNull();
      expect(currentNetWorth?.totalAssets).toBe(150000);
      expect(currentNetWorth?.totalLiabilities).toBe(80000);
      expect(currentNetWorth?.netWorth).toBe(70000);
    });

    it('should handle calculation errors', async () => {
      // Mock console.error to prevent test output clutter
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Force an error by making assets undefined
      useNetWorthStore.getState().assets = undefined as any;

      const { result } = renderHook(() => useNetWorthStore());

      await act(async () => {
        await result.current.refreshNetWorth();
      });

      expect(result.current.calculationError).toBe('Failed to calculate net worth');
      expect(result.current.isCalculating).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should calculate assets breakdown correctly', async () => {
      const assets = [
        { ...mockAsset, id: '1', category: 'property', current_value: 200000 },
        { ...mockAsset, id: '2', category: 'property', current_value: 100000 },
        { ...mockAsset, id: '3', category: 'investments', current_value: 50000 },
      ];
      
      useNetWorthStore.getState().assets = assets;
      useNetWorthStore.getState().liabilities = [];

      const { result } = renderHook(() => useNetWorthStore());

      await act(async () => {
        await result.current.refreshNetWorth();
      });

      const breakdown = result.current.assetsBreakdown;
      expect(breakdown).toHaveLength(2);
      
      const propertyBreakdown = breakdown.find(b => b.category === 'property');
      expect(propertyBreakdown?.total).toBe(300000);
      expect(propertyBreakdown?.percentage).toBe(300000 / 350000 * 100);
      expect(propertyBreakdown?.count).toBe(2);
      
      const investmentBreakdown = breakdown.find(b => b.category === 'investments');
      expect(investmentBreakdown?.total).toBe(50000);
      expect(investmentBreakdown?.percentage).toBe(50000 / 350000 * 100);
      expect(investmentBreakdown?.count).toBe(1);
    });
  });

  describe('loadHistoricalData', () => {
    it('should load mock historical data', async () => {
      const { result } = renderHook(() => useNetWorthStore());

      await act(async () => {
        await result.current.loadHistoricalData();
      });

      expect(result.current.historicalData).toHaveLength(12);
      expect(result.current.isLoadingHistory).toBe(false);
      
      // Check that data has expected structure
      const firstSnapshot = result.current.historicalData[0];
      expect(firstSnapshot).toHaveProperty('month');
      expect(firstSnapshot).toHaveProperty('netWorth');
      expect(firstSnapshot).toHaveProperty('assets');
      expect(firstSnapshot).toHaveProperty('liabilities');
      expect(firstSnapshot).toHaveProperty('timestamp');
    });

    it('should set loading state during data load', async () => {
      const { result } = renderHook(() => useNetWorthStore());

      let isLoadingDuringCall = false;
      
      const loadPromise = act(async () => {
        const promise = result.current.loadHistoricalData();
        isLoadingDuringCall = result.current.isLoadingHistory;
        await promise;
      });

      expect(isLoadingDuringCall).toBe(true);
      await loadPromise;
      expect(result.current.isLoadingHistory).toBe(false);
    });
  });

  describe('addNetWorthSnapshot', () => {
    it('should add new snapshot to historical data', () => {
      const { result } = renderHook(() => useNetWorthStore());
      
      const snapshot = {
        month: 'Dec',
        netWorth: 75000,
        assets: 120000,
        liabilities: 45000,
        timestamp: '2024-12-01T00:00:00.000Z',
      };

      act(() => {
        result.current.addNetWorthSnapshot(snapshot);
      });

      expect(result.current.historicalData).toContain(snapshot);
    });

    it('should limit historical data to 12 months', () => {
      const { result } = renderHook(() => useNetWorthStore());
      
      // Add 15 snapshots
      act(() => {
        for (let i = 0; i < 15; i++) {
          result.current.addNetWorthSnapshot({
            month: `Month${i}`,
            netWorth: 50000 + i * 1000,
            assets: 80000 + i * 1000,
            liabilities: 30000,
            timestamp: `2024-${String(i + 1).padStart(2, '0')}-01T00:00:00.000Z`,
          });
        }
      });

      expect(result.current.historicalData).toHaveLength(12);
      expect(result.current.historicalData[0].month).toBe('Month3'); // First 3 should be removed
    });
  });

  describe('resetCalculationError', () => {
    it('should clear calculation error', () => {
      const { result } = renderHook(() => useNetWorthStore());
      
      // Set an error first
      act(() => {
        result.current.calculationError = 'Test error';
      });

      act(() => {
        result.current.resetCalculationError();
      });

      expect(result.current.calculationError).toBeNull();
    });
  });

  describe('updateAsset', () => {
    it('should update asset successfully', async () => {
      const updateData: UpdateAssetRequest = { current_value: 110000 };
      const updatedAsset: Asset = { ...mockAsset, current_value: 110000 };
      
      // Setup initial state
      useNetWorthStore.getState().assets = [mockAsset];
      
      const mockResponse: ApiResponse<Asset> = {
        data: updatedAsset,
        error: null,
      };
      mockedAssetsApi.update.mockResolvedValue(mockResponse);
      mockedAssetsApi.list.mockResolvedValue({ data: [updatedAsset], error: null });

      const { result } = renderHook(() => useNetWorthStore());

      let success: boolean;
      await act(async () => {
        success = await result.current.updateAsset(mockAsset.id, updateData);
      });

      expect(success).toBe(true);
      expect(mockedAssetsApi.update).toHaveBeenCalledWith(mockAsset.id, updateData);
      expect(mockedAssetsApi.list).toHaveBeenCalled(); // Reload after update
    });

    it('should handle optimistic update and revert on error', async () => {
      const updateData: UpdateAssetRequest = { current_value: 110000 };
      
      // Setup initial state
      useNetWorthStore.getState().assets = [mockAsset];
      
      const mockResponse: ApiResponse<Asset> = {
        data: null,
        error: { code: 'UPDATE_ERROR', message: 'Failed to update asset' },
      };
      mockedAssetsApi.update.mockResolvedValue(mockResponse);
      mockedAssetsApi.list.mockResolvedValue({ data: [mockAsset], error: null });

      const { result } = renderHook(() => useNetWorthStore());

      let success: boolean;
      await act(async () => {
        success = await result.current.updateAsset(mockAsset.id, updateData);
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Failed to update asset');
      expect(mockedAssetsApi.list).toHaveBeenCalled(); // Revert optimistic update
    });
  });

  describe('deleteAsset', () => {
    it('should delete asset successfully', async () => {
      // Setup initial state
      useNetWorthStore.getState().assets = [mockAsset];
      
      const mockResponse: ApiResponse<void> = {
        data: undefined,
        error: null,
      };
      mockedAssetsApi.delete.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useNetWorthStore());

      let success: boolean;
      await act(async () => {
        success = await result.current.deleteAsset(mockAsset.id);
      });

      expect(success).toBe(true);
      expect(mockedAssetsApi.delete).toHaveBeenCalledWith(mockAsset.id);
      expect(result.current.assets).toHaveLength(0); // Asset removed optimistically
    });

    it('should handle optimistic delete and revert on error', async () => {
      // Setup initial state
      useNetWorthStore.getState().assets = [mockAsset];
      
      const mockResponse: ApiResponse<void> = {
        data: undefined,
        error: { code: 'DELETE_ERROR', message: 'Failed to delete asset' },
      };
      mockedAssetsApi.delete.mockResolvedValue(mockResponse);
      mockedAssetsApi.list.mockResolvedValue({ data: [mockAsset], error: null });

      const { result } = renderHook(() => useNetWorthStore());

      let success: boolean;
      await act(async () => {
        success = await result.current.deleteAsset(mockAsset.id);
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Failed to delete asset');
      expect(mockedAssetsApi.list).toHaveBeenCalled(); // Revert optimistic delete
    });
  });
});

describe('useAssetData selector', () => {
  beforeEach(() => {
    // Reset store state
    useNetWorthStore.getState().assets = [];
    useNetWorthStore.getState().error = null;
  });

  it('should calculate total asset value correctly', () => {
    const assets: Asset[] = [
      { ...mockAsset, id: '1', current_value: 100000 },
      { ...mockAsset, id: '2', current_value: 50000 },
      { ...mockAsset, id: '3', current_value: 25000 },
    ];
    
    useNetWorthStore.getState().assets = assets;
    
    const { result } = renderHook(() => useAssetData());
    
    expect(result.current.totalAssetValue).toBe(175000);
    expect(result.current.assetCount).toBe(3);
  });

  it('should return top assets sorted by value', () => {
    const assets: Asset[] = [
      { ...mockAsset, id: '1', current_value: 100000, name: 'House' },
      { ...mockAsset, id: '2', current_value: 200000, name: 'Condo' },
      { ...mockAsset, id: '3', current_value: 50000, name: 'Car' },
    ];
    
    useNetWorthStore.getState().assets = assets;
    
    const { result } = renderHook(() => useAssetData());
    
    expect(result.current.topAssets).toHaveLength(3);
    expect(result.current.topAssets[0].name).toBe('Condo'); // Highest value
    expect(result.current.topAssets[1].name).toBe('House'); // Second highest
    expect(result.current.topAssets[2].name).toBe('Car'); // Lowest
  });

  it('should provide category breakdown', () => {
    const assets: Asset[] = [
      { ...mockAsset, id: '1', category: 'property', current_value: 200000 },
      { ...mockAsset, id: '2', category: 'property', current_value: 100000 },
      { ...mockAsset, id: '3', category: 'investments', current_value: 50000 },
    ];
    
    useNetWorthStore.getState().assets = assets;
    
    const { result } = renderHook(() => useAssetData());
    
    expect(result.current.categoryBreakdown).toHaveLength(2);
    
    const propertyCategory = result.current.categoryBreakdown.find(c => c.category === 'property');
    expect(propertyCategory?.total).toBe(300000);
    expect(propertyCategory?.count).toBe(2);
    
    const investmentCategory = result.current.categoryBreakdown.find(c => c.category === 'investments');
    expect(investmentCategory?.total).toBe(50000);
    expect(investmentCategory?.count).toBe(1);
  });

  it('should filter assets by category', () => {
    const assets: Asset[] = [
      { ...mockAsset, id: '1', category: 'property', name: 'House' },
      { ...mockAsset, id: '2', category: 'investments', name: 'Stocks' },
      { ...mockAsset, id: '3', category: 'property', name: 'Land' },
    ];
    
    useNetWorthStore.getState().assets = assets;
    
    const { result } = renderHook(() => useAssetData());
    
    const propertyAssets = result.current.getAssetsByCategory('property');
    expect(propertyAssets).toHaveLength(2);
    expect(propertyAssets.map(a => a.name)).toEqual(['House', 'Land']);
    
    const investmentAssets = result.current.getAssetsByCategory('investments');
    expect(investmentAssets).toHaveLength(1);
    expect(investmentAssets[0].name).toBe('Stocks');
  });

  it('should return recent assets sorted by creation date', () => {
    const assets: Asset[] = [
      { ...mockAsset, id: '1', name: 'Old Asset', created_at: '2023-01-01T00:00:00Z' },
      { ...mockAsset, id: '2', name: 'New Asset', created_at: '2023-03-01T00:00:00Z' },
      { ...mockAsset, id: '3', name: 'Mid Asset', created_at: '2023-02-01T00:00:00Z' },
    ];
    
    useNetWorthStore.getState().assets = assets;
    
    const { result } = renderHook(() => useAssetData());
    
    expect(result.current.recentAssets).toHaveLength(3);
    expect(result.current.recentAssets[0].name).toBe('New Asset'); // Most recent
    expect(result.current.recentAssets[1].name).toBe('Mid Asset');
    expect(result.current.recentAssets[2].name).toBe('Old Asset'); // Oldest
  });
});

describe('useNetWorthDashboard selector', () => {
  beforeEach(() => {
    // Reset store state
    useNetWorthStore.getState().currentNetWorth = null;
    useNetWorthStore.getState().isCalculating = false;
    useNetWorthStore.getState().calculationError = null;
    useNetWorthStore.getState().historicalData = [];
    useNetWorthStore.getState().isLoadingHistory = false;
    useNetWorthStore.getState().assetsBreakdown = [];
    useNetWorthStore.getState().liabilitiesBreakdown = [];
  });

  it('should return dashboard data correctly', () => {
    const mockNetWorth = {
      netWorth: 70000,
      totalAssets: 150000,
      totalLiabilities: 80000,
      monthlyChange: 5000,
      monthlyChangePercentage: 7.5,
      lastUpdated: '2024-01-01T00:00:00.000Z',
    };

    const mockHistoricalData = [
      {
        month: 'Jan',
        netWorth: 65000,
        assets: 145000,
        liabilities: 80000,
        timestamp: '2024-01-01T00:00:00.000Z',
      },
    ];

    useNetWorthStore.getState().currentNetWorth = mockNetWorth;
    useNetWorthStore.getState().historicalData = mockHistoricalData;
    useNetWorthStore.getState().isCalculating = true;

    const { result } = renderHook(() => useNetWorthDashboard());

    expect(result.current.currentNetWorth).toEqual(mockNetWorth);
    expect(result.current.historicalData).toEqual(mockHistoricalData);
    expect(result.current.isCalculating).toBe(true);
    expect(typeof result.current.refreshNetWorth).toBe('function');
    expect(typeof result.current.loadHistoricalData).toBe('function');
    expect(typeof result.current.resetCalculationError).toBe('function');
  });

  it('should provide breakdown data', () => {
    const mockAssetsBreakdown = [
      { category: 'property', total: 200000, percentage: 80, count: 2 },
      { category: 'investments', total: 50000, percentage: 20, count: 1 },
    ];

    const mockLiabilitiesBreakdown = [
      { category: 'mortgages', total: 150000, percentage: 75, count: 1 },
      { category: 'credit_cards', total: 50000, percentage: 25, count: 2 },
    ];

    useNetWorthStore.getState().assetsBreakdown = mockAssetsBreakdown;
    useNetWorthStore.getState().liabilitiesBreakdown = mockLiabilitiesBreakdown;

    const { result } = renderHook(() => useNetWorthDashboard());

    expect(result.current.assetsBreakdown).toEqual(mockAssetsBreakdown);
    expect(result.current.liabilitiesBreakdown).toEqual(mockLiabilitiesBreakdown);
  });

  it('should provide error state information', () => {
    useNetWorthStore.getState().calculationError = 'Calculation failed';
    useNetWorthStore.getState().isLoadingHistory = true;

    const { result } = renderHook(() => useNetWorthDashboard());

    expect(result.current.calculationError).toBe('Calculation failed');
    expect(result.current.isLoadingHistory).toBe(true);
  });
});