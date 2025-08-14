import { renderHook, act } from '@testing-library/react-native';
import { useCategoryStore } from '@/stores/categoryStore';
import { categoriesApi } from '@/services/api/categories';

jest.mock('@/services/api/categories', () => ({
  categoriesApi: {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    seedDefaults: jest.fn(),
  },
}));

const mockCategoriesApi = categoriesApi as jest.Mocked<typeof categoriesApi>;

describe('useCategoryStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state before each test
    act(() => {
      useCategoryStore.setState({
        categories: [],
        isLoading: false,
        error: null,
        initialized: false,
      });
    });
  });

  describe('loadCategories', () => {
    it('should load categories successfully', async () => {
      const mockCategories = [
        { id: '1', name: 'Food', icon_name: 'restaurant', user_id: 'user1', created_at: '2025-01-01', updated_at: '2025-01-01' },
        { id: '2', name: 'Transport', icon_name: 'car', user_id: 'user1', created_at: '2025-01-01', updated_at: '2025-01-01' },
      ];

      mockCategoriesApi.list.mockResolvedValue({
        data: mockCategories,
        error: undefined,
      });

      const { result } = renderHook(() => useCategoryStore());

      await act(async () => {
        await result.current.loadCategories();
      });

      expect(result.current.categories).toEqual(mockCategories);
      expect(result.current.initialized).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should seed defaults when no categories exist', async () => {
      mockCategoriesApi.list.mockResolvedValue({
        data: [],
        error: undefined,
      });

      mockCategoriesApi.seedDefaults.mockResolvedValue({
        data: [],
        error: undefined,
      });

      const { result } = renderHook(() => useCategoryStore());

      await act(async () => {
        await result.current.loadCategories();
      });

      expect(mockCategoriesApi.seedDefaults).toHaveBeenCalled();
    });

    it('should handle loading error', async () => {
      mockCategoriesApi.list.mockResolvedValue({
        data: undefined,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch categories',
        },
      });

      const { result } = renderHook(() => useCategoryStore());

      await act(async () => {
        await result.current.loadCategories();
      });

      expect(result.current.error).toBe('Failed to fetch categories');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('createCategory', () => {
    it('should create category successfully', async () => {
      const mockCategory = {
        id: '1',
        name: 'New Category',
        icon_name: 'test-icon',
        user_id: 'user1',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      };

      mockCategoriesApi.create.mockResolvedValue({
        data: mockCategory,
        error: undefined,
      });

      mockCategoriesApi.list.mockResolvedValue({
        data: [mockCategory],
        error: undefined,
      });

      const { result } = renderHook(() => useCategoryStore());

      let success: boolean = false;
      await act(async () => {
        success = await result.current.createCategory('New Category', 'test-icon');
      });

      expect(success).toBe(true);
      expect(mockCategoriesApi.create).toHaveBeenCalledWith({
        name: 'New Category',
        icon_name: 'test-icon',
      });
      expect(mockCategoriesApi.list).toHaveBeenCalled(); // Called to reload categories
    });

    it('should handle creation error', async () => {
      mockCategoriesApi.create.mockResolvedValue({
        data: undefined,
        error: {
          code: 'CREATE_ERROR',
          message: 'Failed to create category',
        },
      });

      const { result } = renderHook(() => useCategoryStore());

      let success: boolean = true;
      await act(async () => {
        success = await result.current.createCategory('New Category', 'test-icon');
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Failed to create category');
    });
  });

  describe('updateCategory', () => {
    it('should update category successfully', async () => {
      const mockCategory = {
        id: '1',
        name: 'Updated Category',
        icon_name: 'updated-icon',
        user_id: 'user1',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      };

      mockCategoriesApi.update.mockResolvedValue({
        data: mockCategory,
        error: undefined,
      });

      mockCategoriesApi.list.mockResolvedValue({
        data: [mockCategory],
        error: undefined,
      });

      const { result } = renderHook(() => useCategoryStore());

      let success: boolean = false;
      await act(async () => {
        success = await result.current.updateCategory('1', 'Updated Category', 'updated-icon');
      });

      expect(success).toBe(true);
      expect(mockCategoriesApi.update).toHaveBeenCalledWith('1', {
        name: 'Updated Category',
        icon_name: 'updated-icon',
      });
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      mockCategoriesApi.delete.mockResolvedValue({
        data: undefined,
        error: undefined,
      });

      mockCategoriesApi.list.mockResolvedValue({
        data: [],
        error: undefined,
      });

      const { result } = renderHook(() => useCategoryStore());

      let success: boolean = false;
      await act(async () => {
        success = await result.current.deleteCategory('1');
      });

      expect(success).toBe(true);
      expect(mockCategoriesApi.delete).toHaveBeenCalledWith('1');
    });
  });

  describe('utility functions', () => {
    it('should set loading state', () => {
      const { result } = renderHook(() => useCategoryStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should set error state', () => {
      const { result } = renderHook(() => useCategoryStore());

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');
    });

    it('should clear error state', () => {
      const { result } = renderHook(() => useCategoryStore());

      act(() => {
        result.current.setError('Test error');
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });
});