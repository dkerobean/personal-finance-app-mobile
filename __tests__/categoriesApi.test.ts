import { categoriesApi } from '@/services/api/categories';
import { supabase } from '@/services/supabaseClient';

jest.mock('@/services/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    })),
  },
}));

describe('categoriesApi', () => {
  const mockSupabaseChain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnValue(mockSupabaseChain);
  });

  describe('list', () => {
    it('should return categories on success', async () => {
      const mockCategories = [
        { id: '1', name: 'Food', icon_name: 'restaurant', user_id: 'user1', created_at: '2025-01-01', updated_at: '2025-01-01' },
        { id: '2', name: 'Transport', icon_name: 'car', user_id: 'user1', created_at: '2025-01-01', updated_at: '2025-01-01' },
      ];

      mockSupabaseChain.order.mockResolvedValue({
        data: mockCategories,
        error: null,
      });

      const result = await categoriesApi.list();

      expect(supabase.from).toHaveBeenCalledWith('categories');
      expect(mockSupabaseChain.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseChain.order).toHaveBeenCalledWith('name');
      expect(result.data).toEqual(mockCategories);
      expect(result.error).toBeUndefined();
    });

    it('should return error on failure', async () => {
      const mockError = new Error('Database error');
      mockSupabaseChain.order.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await categoriesApi.list();

      expect(result.data).toEqual([]);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('FETCH_CATEGORIES_ERROR');
    });
  });

  describe('create', () => {
    it('should create category successfully', async () => {
      const mockCategory = {
        id: '1',
        name: 'New Category',
        icon_name: 'test-icon',
        user_id: 'user1',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      };

      mockSupabaseChain.single.mockResolvedValue({
        data: mockCategory,
        error: null,
      });

      const result = await categoriesApi.create({
        name: 'New Category',
        icon_name: 'test-icon',
      });

      expect(supabase.from).toHaveBeenCalledWith('categories');
      expect(mockSupabaseChain.insert).toHaveBeenCalledWith({
        name: 'New Category',
        icon_name: 'test-icon',
      });
      expect(result.data).toEqual(mockCategory);
      expect(result.error).toBeUndefined();
    });

    it('should return error on creation failure', async () => {
      const mockError = new Error('Creation failed');
      mockSupabaseChain.single.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await categoriesApi.create({
        name: 'New Category',
        icon_name: 'test-icon',
      });

      expect(result.data).toEqual({});
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('CREATE_CATEGORY_ERROR');
    });
  });

  describe('update', () => {
    it('should update category successfully', async () => {
      const mockCategory = {
        id: '1',
        name: 'Updated Category',
        icon_name: 'updated-icon',
        user_id: 'user1',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      };

      mockSupabaseChain.single.mockResolvedValue({
        data: mockCategory,
        error: null,
      });

      const result = await categoriesApi.update('1', {
        name: 'Updated Category',
        icon_name: 'updated-icon',
      });

      expect(supabase.from).toHaveBeenCalledWith('categories');
      expect(mockSupabaseChain.update).toHaveBeenCalledWith({
        name: 'Updated Category',
        icon_name: 'updated-icon',
        updated_at: expect.any(String),
      });
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('id', '1');
      expect(result.data).toEqual(mockCategory);
      expect(result.error).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should delete category successfully', async () => {
      mockSupabaseChain.eq.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await categoriesApi.delete('1');

      expect(supabase.from).toHaveBeenCalledWith('categories');
      expect(mockSupabaseChain.delete).toHaveBeenCalled();
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('id', '1');
      expect(result.error).toBeUndefined();
    });
  });

  describe('seedDefaults', () => {
    it('should seed default categories successfully', async () => {
      const mockCategories = [
        { id: '1', name: 'Food', icon_name: 'restaurant', user_id: 'user1', created_at: '2025-01-01', updated_at: '2025-01-01' },
        { id: '2', name: 'Transport', icon_name: 'car', user_id: 'user1', created_at: '2025-01-01', updated_at: '2025-01-01' },
      ];

      mockSupabaseChain.select.mockResolvedValue({
        data: mockCategories,
        error: null,
      });

      const result = await categoriesApi.seedDefaults();

      expect(supabase.from).toHaveBeenCalledWith('categories');
      expect(mockSupabaseChain.insert).toHaveBeenCalledWith([
        { name: 'Food', icon_name: 'restaurant' },
        { name: 'Transport', icon_name: 'car' },
        { name: 'Salary', icon_name: 'attach-money' },
        { name: 'Entertainment', icon_name: 'movie' },
        { name: 'Shopping', icon_name: 'shopping-bag' },
        { name: 'Bills', icon_name: 'receipt' },
        { name: 'Health', icon_name: 'local-hospital' },
        { name: 'Education', icon_name: 'school' },
      ]);
      expect(result.data).toEqual(mockCategories);
      expect(result.error).toBeUndefined();
    });
  });
});