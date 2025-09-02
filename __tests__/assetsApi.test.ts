import { assetsApi } from '@/services/api/assets';
import { supabase } from '@/services/supabaseClient';
import { handleApiError, createApiResponse } from '@/services/apiClient';
import type { Asset, CreateAssetRequest, UpdateAssetRequest } from '@/types/models';

// Mock dependencies
jest.mock('@/services/supabaseClient');
jest.mock('@/services/apiClient');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockHandleApiError = handleApiError as jest.MockedFunction<typeof handleApiError>;
const mockCreateApiResponse = createApiResponse as jest.MockedFunction<typeof createApiResponse>;

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2023-01-01T00:00:00Z',
};

const mockAsset: Asset = {
  id: 'asset-1',
  user_id: 'user-123',
  name: 'Test House',
  category: 'property',
  asset_type: 'real_estate',
  current_value: 300000,
  original_value: 250000,
  purchase_date: '2020-01-01',
  description: 'Primary residence',
  is_active: true,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

describe('assetsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful auth by default
    mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock default createApiResponse behavior
    mockCreateApiResponse.mockImplementation((data, error?) => ({
      data: error ? null : data,
      error: error || null,
    }));
  });

  describe('list', () => {
    it('should fetch assets successfully', async () => {
      const mockResponse = {
        data: [mockAsset],
        error: null,
      };

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue(mockResponse),
          }),
        }),
      });

      const result = await assetsApi.list();

      expect(mockSupabase.from).toHaveBeenCalledWith('assets');
      expect(mockCreateApiResponse).toHaveBeenCalledWith([mockAsset]);
      expect(result.data).toEqual([mockAsset]);
      expect(result.error).toBeNull();
    });

    it('should handle database error', async () => {
      const dbError = new Error('Database connection failed');

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: dbError,
            }),
          }),
        }),
      });

      mockHandleApiError.mockReturnValue('Database connection failed');

      const result = await assetsApi.list();

      expect(mockHandleApiError).toHaveBeenCalledWith(dbError);
      expect(mockCreateApiResponse).toHaveBeenCalledWith([], {
        code: 'FETCH_ASSETS_ERROR',
        message: 'Database connection failed',
      });
    });
  });

  describe('getById', () => {
    it('should fetch single asset successfully', async () => {
      const mockResponse = {
        data: mockAsset,
        error: null,
      };

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue(mockResponse),
            }),
          }),
        }),
      });

      const result = await assetsApi.getById('asset-1');

      expect(result.data).toEqual(mockAsset);
      expect(result.error).toBeNull();
    });

    it('should handle asset not found', async () => {
      const mockResponse = {
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      };

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue(mockResponse),
            }),
          }),
        }),
      });

      const result = await assetsApi.getById('nonexistent-id');

      expect(mockCreateApiResponse).toHaveBeenCalledWith(null, {
        code: 'ASSET_NOT_FOUND',
        message: 'Asset not found',
      });
    });
  });

  describe('create', () => {
    const createRequest: CreateAssetRequest = {
      name: 'New Investment',
      category: 'investments',
      asset_type: 'stocks',
      current_value: 10000,
      original_value: 8000,
      purchase_date: '2023-06-01',
      description: 'Tech stocks portfolio',
    };

    it('should create asset successfully', async () => {
      const createdAsset = { ...mockAsset, ...createRequest };
      const mockResponse = {
        data: createdAsset,
        error: null,
      };

      mockSupabase.from = jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue(mockResponse),
          }),
        }),
      });

      const result = await assetsApi.create(createRequest);

      expect(mockSupabase.from).toHaveBeenCalledWith('assets');
      expect(result.data).toEqual(createdAsset);
      expect(result.error).toBeNull();
    });

    it('should handle auth error', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const result = await assetsApi.create(createRequest);

      expect(mockCreateApiResponse).toHaveBeenCalledWith(null as any, {
        code: 'AUTH_ERROR',
        message: 'Authentication required',
      });
    });

    it('should validate required fields', async () => {
      const invalidRequest = {
        ...createRequest,
        name: '', // Empty name should fail validation
      };

      const result = await assetsApi.create(invalidRequest);

      expect(mockCreateApiResponse).toHaveBeenCalledWith(null as any, {
        code: 'VALIDATION_ERROR',
        message: 'Asset name is required',
      });
    });

    it('should validate positive current value', async () => {
      const invalidRequest = {
        ...createRequest,
        current_value: -1000, // Negative value should fail validation
      };

      const result = await assetsApi.create(invalidRequest);

      expect(mockCreateApiResponse).toHaveBeenCalledWith(null as any, {
        code: 'VALIDATION_ERROR',
        message: 'Current value must be greater than 0',
      });
    });
  });

  describe('update', () => {
    const updateRequest: UpdateAssetRequest = {
      current_value: 320000,
      description: 'Updated description',
    };

    it('should update asset successfully', async () => {
      const updatedAsset = { ...mockAsset, ...updateRequest };
      const mockResponse = {
        data: updatedAsset,
        error: null,
      };

      mockSupabase.from = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue(mockResponse),
              }),
            }),
          }),
        }),
      });

      const result = await assetsApi.update('asset-1', updateRequest);

      expect(result.data).toEqual(updatedAsset);
      expect(result.error).toBeNull();
    });

    it('should handle asset not found on update', async () => {
      const mockResponse = {
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      };

      mockSupabase.from = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue(mockResponse),
              }),
            }),
          }),
        }),
      });

      const result = await assetsApi.update('nonexistent-id', updateRequest);

      expect(mockCreateApiResponse).toHaveBeenCalledWith(null as any, {
        code: 'ASSET_NOT_FOUND',
        message: 'Asset not found or you do not have permission to update it',
      });
    });

    it('should validate name when provided', async () => {
      const invalidUpdate = { name: '' }; // Empty name should fail

      const result = await assetsApi.update('asset-1', invalidUpdate);

      expect(mockCreateApiResponse).toHaveBeenCalledWith(null as any, {
        code: 'VALIDATION_ERROR',
        message: 'Asset name cannot be empty',
      });
    });

    it('should validate positive current value when provided', async () => {
      const invalidUpdate = { current_value: 0 }; // Zero value should fail

      const result = await assetsApi.update('asset-1', invalidUpdate);

      expect(mockCreateApiResponse).toHaveBeenCalledWith(null as any, {
        code: 'VALIDATION_ERROR',
        message: 'Current value must be greater than 0',
      });
    });
  });

  describe('delete', () => {
    it('should delete asset successfully (soft delete)', async () => {
      const mockResponse = {
        data: { ...mockAsset, is_active: false },
        error: null,
      };

      mockSupabase.from = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue(mockResponse),
              }),
            }),
          }),
        }),
      });

      const result = await assetsApi.delete('asset-1');

      expect(mockCreateApiResponse).toHaveBeenCalledWith(undefined);
      expect(result.error).toBeNull();
    });

    it('should handle asset not found on delete', async () => {
      const mockResponse = {
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      };

      mockSupabase.from = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue(mockResponse),
              }),
            }),
          }),
        }),
      });

      const result = await assetsApi.delete('nonexistent-id');

      expect(mockCreateApiResponse).toHaveBeenCalledWith(undefined, {
        code: 'ASSET_NOT_FOUND',
        message: 'Asset not found or you do not have permission to delete it',
      });
    });
  });

  describe('getTotalValue', () => {
    it('should calculate total value correctly', async () => {
      const mockAssets = [
        { current_value: 100000 },
        { current_value: 50000 },
        { current_value: 25000 },
      ];

      const mockResponse = {
        data: mockAssets,
        error: null,
      };

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue(mockResponse),
          }),
        }),
      });

      const result = await assetsApi.getTotalValue();

      expect(result.data).toEqual({
        totalValue: 175000,
        assetCount: 3,
      });
    });
  });

  describe('getCategoryBreakdown', () => {
    it('should group assets by category correctly', async () => {
      const mockAssets = [
        { category: 'property', current_value: 300000 },
        { category: 'property', current_value: 200000 },
        { category: 'investments', current_value: 50000 },
      ];

      const mockResponse = {
        data: mockAssets,
        error: null,
      };

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue(mockResponse),
          }),
        }),
      });

      const result = await assetsApi.getCategoryBreakdown();

      expect(result.data).toHaveLength(2);
      expect(result.data).toContainEqual({
        category: 'property',
        total: 500000,
        count: 2,
      });
      expect(result.data).toContainEqual({
        category: 'investments',
        total: 50000,
        count: 1,
      });
    });
  });
});