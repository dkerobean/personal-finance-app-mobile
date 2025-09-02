import { liabilitiesApi } from '@/services/api/liabilities';
import { supabase } from '@/services/supabaseClient';
import type { CreateLiabilityRequest, UpdateLiabilityRequest } from '@/types/models';

// Mock Supabase client
jest.mock('@/services/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

// Mock the Supabase query chain
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockSingle = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();

const createMockQuery = () => ({
  select: mockSelect.mockReturnThis(),
  eq: mockEq.mockReturnThis(),
  order: mockOrder.mockReturnThis(),
  single: mockSingle.mockReturnThis(),
  insert: mockInsert.mockReturnThis(),
  update: mockUpdate.mockReturnThis(),
});

describe('liabilitiesApi', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnValue(createMockQuery());
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('list', () => {
    it('should fetch liabilities successfully', async () => {
      const mockLiabilities = [
        {
          id: '1',
          name: 'Credit Card Debt',
          category: 'credit_cards',
          current_balance: 5000,
          created_at: '2023-01-01T00:00:00Z',
        },
        {
          id: '2', 
          name: 'Auto Loan',
          category: 'loans',
          current_balance: 25000,
          created_at: '2023-01-02T00:00:00Z',
        },
      ];

      mockOrder.mockResolvedValue({
        data: mockLiabilities,
        error: null,
      });

      const result = await liabilitiesApi.list();

      expect(supabase.from).toHaveBeenCalledWith('liabilities');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('is_active', true);
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockLiabilities);
    });

    it('should handle fetch error', async () => {
      const mockError = new Error('Database error');
      mockOrder.mockRejectedValue(mockError);

      const result = await liabilitiesApi.list();

      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('FETCH_LIABILITIES_ERROR');
      expect(result.data).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should fetch liability by id successfully', async () => {
      const mockLiability = {
        id: '1',
        name: 'Credit Card Debt',
        category: 'credit_cards',
        current_balance: 5000,
      };

      mockSingle.mockResolvedValue({
        data: mockLiability,
        error: null,
      });

      const result = await liabilitiesApi.getById('1');

      expect(supabase.from).toHaveBeenCalledWith('liabilities');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', '1');
      expect(mockEq).toHaveBeenCalledWith('is_active', true);
      expect(mockSingle).toHaveBeenCalled();
      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockLiability);
    });

    it('should handle liability not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' },
      });

      const result = await liabilitiesApi.getById('nonexistent');

      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('LIABILITY_NOT_FOUND');
      expect(result.data).toBeNull();
    });
  });

  describe('getByCategory', () => {
    it('should fetch liabilities by category successfully', async () => {
      const mockLiabilities = [
        {
          id: '1',
          name: 'Visa Card',
          category: 'credit_cards',
          current_balance: 3000,
        },
        {
          id: '2',
          name: 'MasterCard',
          category: 'credit_cards',
          current_balance: 2000,
        },
      ];

      mockOrder.mockResolvedValue({
        data: mockLiabilities,
        error: null,
      });

      const result = await liabilitiesApi.getByCategory('credit_cards');

      expect(mockEq).toHaveBeenCalledWith('category', 'credit_cards');
      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockLiabilities);
    });
  });

  describe('create', () => {
    const createRequest: CreateLiabilityRequest = {
      name: 'New Credit Card',
      category: 'credit_cards',
      liability_type: 'credit_card',
      current_balance: 1500,
      interest_rate: 18.5,
      monthly_payment: 100,
      description: 'Main credit card',
    };

    it('should create liability successfully', async () => {
      const mockCreatedLiability = {
        id: 'new-liability-id',
        user_id: mockUser.id,
        ...createRequest,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      mockSingle.mockResolvedValue({
        data: mockCreatedLiability,
        error: null,
      });

      const result = await liabilitiesApi.create(createRequest);

      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          user_id: mockUser.id,
          name: createRequest.name,
          category: createRequest.category,
          liability_type: createRequest.liability_type,
          current_balance: createRequest.current_balance,
          interest_rate: createRequest.interest_rate,
          monthly_payment: createRequest.monthly_payment,
          description: createRequest.description,
          is_active: true,
        }),
      ]);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockCreatedLiability);
    });

    it('should validate required fields', async () => {
      const invalidRequest = {
        ...createRequest,
        name: '',
      };

      const result = await liabilitiesApi.create(invalidRequest);

      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toBe('Liability name is required');
    });

    it('should validate current balance', async () => {
      const invalidRequest = {
        ...createRequest,
        current_balance: 0,
      };

      const result = await liabilitiesApi.create(invalidRequest);

      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toBe('Current balance must be greater than 0');
    });

    it('should validate category and type', async () => {
      const invalidRequest = {
        ...createRequest,
        category: undefined as any,
      };

      const result = await liabilitiesApi.create(invalidRequest);

      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toBe('Category and liability type are required');
    });

    it('should handle authentication error', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const result = await liabilitiesApi.create(createRequest);

      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('AUTH_ERROR');
      expect(result.error?.message).toBe('Authentication required');
    });
  });

  describe('update', () => {
    const updateRequest: UpdateLiabilityRequest = {
      name: 'Updated Liability Name',
      current_balance: 2000,
      interest_rate: 20.0,
    };

    it('should update liability successfully', async () => {
      const mockUpdatedLiability = {
        id: '1',
        user_id: mockUser.id,
        name: updateRequest.name,
        current_balance: updateRequest.current_balance,
        interest_rate: updateRequest.interest_rate,
        updated_at: new Date().toISOString(),
      };

      mockSingle.mockResolvedValue({
        data: mockUpdatedLiability,
        error: null,
      });

      const result = await liabilitiesApi.update('1', updateRequest);

      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: updateRequest.name,
          current_balance: updateRequest.current_balance,
          interest_rate: updateRequest.interest_rate,
          updated_at: expect.any(String),
        })
      );
      expect(mockEq).toHaveBeenCalledWith('id', '1');
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockUpdatedLiability);
    });

    it('should handle liability not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' },
      });

      const result = await liabilitiesApi.update('nonexistent', updateRequest);

      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('LIABILITY_NOT_FOUND');
      expect(result.error?.message).toBe('Liability not found or you do not have permission to update it');
    });

    it('should validate updated fields', async () => {
      const invalidUpdate = {
        current_balance: -100,
      };

      const result = await liabilitiesApi.update('1', invalidUpdate);

      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toBe('Current balance must be greater than 0');
    });
  });

  describe('delete', () => {
    it('should soft delete liability successfully', async () => {
      mockSingle.mockResolvedValue({
        data: { id: '1', is_active: false },
        error: null,
      });

      const result = await liabilitiesApi.delete('1');

      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith({
        is_active: false,
        updated_at: expect.any(String),
      });
      expect(mockEq).toHaveBeenCalledWith('id', '1');
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(result.error).toBeNull();
    });

    it('should handle liability not found on delete', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' },
      });

      const result = await liabilitiesApi.delete('nonexistent');

      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('LIABILITY_NOT_FOUND');
      expect(result.error?.message).toBe('Liability not found or you do not have permission to delete it');
    });
  });

  describe('getTotalBalance', () => {
    it('should calculate total balance successfully', async () => {
      const mockLiabilities = [
        { current_balance: 5000 },
        { current_balance: 3000 },
        { current_balance: 2000 },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect.mockReturnThis(),
        eq: mockEq.mockReturnThis(),
      });

      mockEq.mockResolvedValue({
        data: mockLiabilities,
        error: null,
      });

      const result = await liabilitiesApi.getTotalBalance();

      expect(mockSelect).toHaveBeenCalledWith('current_balance');
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockEq).toHaveBeenCalledWith('is_active', true);
      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        totalBalance: 10000,
        liabilityCount: 3,
      });
    });
  });

  describe('getCategoryBreakdown', () => {
    it('should calculate category breakdown successfully', async () => {
      const mockLiabilities = [
        { category: 'credit_cards', current_balance: 5000 },
        { category: 'credit_cards', current_balance: 3000 },
        { category: 'loans', current_balance: 25000 },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect.mockReturnThis(),
        eq: mockEq.mockReturnThis(),
      });

      mockEq.mockResolvedValue({
        data: mockLiabilities,
        error: null,
      });

      const result = await liabilitiesApi.getCategoryBreakdown();

      expect(mockSelect).toHaveBeenCalledWith('category, current_balance');
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
      
      const creditCardsBreakdown = result.data?.find(item => item.category === 'credit_cards');
      expect(creditCardsBreakdown).toEqual({
        category: 'credit_cards',
        total: 8000,
        count: 2,
      });

      const loansBreakdown = result.data?.find(item => item.category === 'loans');
      expect(loansBreakdown).toEqual({
        category: 'loans',
        total: 25000,
        count: 1,
      });
    });
  });
});