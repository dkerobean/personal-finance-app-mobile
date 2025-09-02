import { renderHook, act } from '@testing-library/react-hooks';
import { useNetWorthStore, useLiabilityData } from '@/stores/netWorthStore';
import { liabilitiesApi } from '@/services/api/liabilities';
import type { Liability, CreateLiabilityRequest, UpdateLiabilityRequest } from '@/types/models';

// Mock the liabilities API
jest.mock('@/services/api/liabilities', () => ({
  liabilitiesApi: {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedLiabilitiesApi = liabilitiesApi as jest.Mocked<typeof liabilitiesApi>;

describe('netWorthStore - Liabilities', () => {
  const mockLiabilities: Liability[] = [
    {
      id: '1',
      user_id: 'test-user',
      name: 'Credit Card Debt',
      category: 'credit_cards',
      liability_type: 'credit_card',
      current_balance: 5000,
      original_balance: 8000,
      interest_rate: 18.5,
      monthly_payment: 200,
      due_date: '2024-01-15',
      description: 'Main credit card',
      is_active: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: '2',
      user_id: 'test-user',
      name: 'Auto Loan',
      category: 'loans',
      liability_type: 'auto_loan',
      current_balance: 25000,
      original_balance: 30000,
      interest_rate: 5.5,
      monthly_payment: 500,
      due_date: null,
      description: 'Car financing',
      is_active: true,
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
    {
      id: '3',
      user_id: 'test-user',
      name: 'Mortgage',
      category: 'mortgages',
      liability_type: 'primary_mortgage',
      current_balance: 250000,
      original_balance: 300000,
      interest_rate: 3.5,
      monthly_payment: 1800,
      due_date: null,
      description: 'Primary residence',
      is_active: true,
      created_at: '2023-01-03T00:00:00Z',
      updated_at: '2023-01-03T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset store state
    useNetWorthStore.getState().liabilities = [];
    useNetWorthStore.getState().isLoadingLiabilities = false;
    useNetWorthStore.getState().error = null;
  });

  describe('loadLiabilities', () => {
    it('should load liabilities successfully', async () => {
      mockedLiabilitiesApi.list.mockResolvedValue({
        data: mockLiabilities,
        error: null,
      });

      const { result } = renderHook(() => useNetWorthStore());

      await act(async () => {
        await result.current.loadLiabilities();
      });

      expect(mockedLiabilitiesApi.list).toHaveBeenCalled();
      expect(result.current.liabilities).toHaveLength(3);
      expect(result.current.liabilities[0].name).toBe('Mortgage'); // Should be sorted by creation date desc
      expect(result.current.isLoadingLiabilities).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle load error', async () => {
      mockedLiabilitiesApi.list.mockResolvedValue({
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch liabilities',
        },
      });

      const { result } = renderHook(() => useNetWorthStore());

      await act(async () => {
        await result.current.loadLiabilities();
      });

      expect(result.current.liabilities).toHaveLength(0);
      expect(result.current.error).toBe('Failed to fetch liabilities');
      expect(result.current.isLoadingLiabilities).toBe(false);
    });

    it('should set loading states correctly', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockedLiabilitiesApi.list.mockReturnValue(promise);

      const { result } = renderHook(() => useNetWorthStore());

      // Start loading
      act(() => {
        result.current.loadLiabilities();
      });

      expect(result.current.isLoadingLiabilities).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!({ data: mockLiabilities, error: null });
        await promise;
      });

      expect(result.current.isLoadingLiabilities).toBe(false);
    });
  });

  describe('createLiability', () => {
    const createRequest: CreateLiabilityRequest = {
      name: 'New Credit Card',
      category: 'credit_cards',
      liability_type: 'credit_card',
      current_balance: 1500,
      interest_rate: 15.0,
      monthly_payment: 100,
      description: 'Store credit card',
    };

    it('should create liability successfully', async () => {
      const newLiability: Liability = {
        id: 'new-id',
        user_id: 'test-user',
        ...createRequest,
        original_balance: null,
        due_date: null,
        is_active: true,
        created_at: '2023-01-04T00:00:00Z',
        updated_at: '2023-01-04T00:00:00Z',
      };

      mockedLiabilitiesApi.create.mockResolvedValue({
        data: newLiability,
        error: null,
      });

      // Mock loadLiabilities for the refetch after create
      mockedLiabilitiesApi.list.mockResolvedValue({
        data: [...mockLiabilities, newLiability],
        error: null,
      });

      const { result } = renderHook(() => useNetWorthStore());

      const success = await act(async () => {
        return await result.current.createLiability(createRequest);
      });

      expect(success).toBe(true);
      expect(mockedLiabilitiesApi.create).toHaveBeenCalledWith(createRequest);
      expect(mockedLiabilitiesApi.list).toHaveBeenCalled(); // Should refetch
      expect(result.current.error).toBeNull();
    });

    it('should handle create error', async () => {
      mockedLiabilitiesApi.create.mockResolvedValue({
        data: null,
        error: {
          code: 'CREATE_ERROR',
          message: 'Failed to create liability',
        },
      });

      const { result } = renderHook(() => useNetWorthStore());

      const success = await act(async () => {
        return await result.current.createLiability(createRequest);
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Failed to create liability');
    });

    it('should perform optimistic update', async () => {
      const newLiability: Liability = {
        id: 'new-id',
        user_id: 'test-user',
        ...createRequest,
        original_balance: null,
        due_date: null,
        is_active: true,
        created_at: '2023-01-04T00:00:00Z',
        updated_at: '2023-01-04T00:00:00Z',
      };

      // Set up initial state
      useNetWorthStore.getState().liabilities = mockLiabilities;

      let resolveCreate: (value: any) => void;
      const createPromise = new Promise((resolve) => {
        resolveCreate = resolve;
      });
      mockedLiabilitiesApi.create.mockReturnValue(createPromise);

      const { result } = renderHook(() => useNetWorthStore());

      // Start create operation
      act(() => {
        result.current.createLiability(createRequest);
      });

      // Check optimistic update - new liability should be added to the list
      await act(async () => {
        resolveCreate!({ data: newLiability, error: null });
        await createPromise;
      });

      expect(result.current.liabilities).toContain(newLiability);
    });
  });

  describe('updateLiability', () => {
    const updateRequest: UpdateLiabilityRequest = {
      name: 'Updated Credit Card Name',
      current_balance: 4500,
      monthly_payment: 250,
    };

    it('should update liability successfully', async () => {
      const updatedLiability = {
        ...mockLiabilities[0],
        ...updateRequest,
        updated_at: '2023-01-05T00:00:00Z',
      };

      mockedLiabilitiesApi.update.mockResolvedValue({
        data: updatedLiability,
        error: null,
      });

      // Mock loadLiabilities for the refetch after update
      mockedLiabilitiesApi.list.mockResolvedValue({
        data: [updatedLiability, ...mockLiabilities.slice(1)],
        error: null,
      });

      // Set up initial state
      useNetWorthStore.getState().liabilities = mockLiabilities;

      const { result } = renderHook(() => useNetWorthStore());

      const success = await act(async () => {
        return await result.current.updateLiability('1', updateRequest);
      });

      expect(success).toBe(true);
      expect(mockedLiabilitiesApi.update).toHaveBeenCalledWith('1', updateRequest);
      expect(mockedLiabilitiesApi.list).toHaveBeenCalled(); // Should refetch
    });

    it('should perform optimistic update', async () => {
      // Set up initial state
      useNetWorthStore.getState().liabilities = mockLiabilities;

      let resolveUpdate: (value: any) => void;
      const updatePromise = new Promise((resolve) => {
        resolveUpdate = resolve;
      });
      mockedLiabilitiesApi.update.mockReturnValue(updatePromise);

      const { result } = renderHook(() => useNetWorthStore());

      // Start update operation
      act(() => {
        result.current.updateLiability('1', updateRequest);
      });

      // Check optimistic update
      const updatedLiability = result.current.liabilities.find(l => l.id === '1');
      expect(updatedLiability?.name).toBe(updateRequest.name);
      expect(updatedLiability?.current_balance).toBe(updateRequest.current_balance);

      // Resolve the update
      await act(async () => {
        resolveUpdate!({
          data: { ...mockLiabilities[0], ...updateRequest },
          error: null,
        });
        await updatePromise;
      });
    });

    it('should revert optimistic update on error', async () => {
      // Set up initial state
      useNetWorthStore.getState().liabilities = mockLiabilities;

      mockedLiabilitiesApi.update.mockResolvedValue({
        data: null,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update liability',
        },
      });

      // Mock loadLiabilities for the rollback
      mockedLiabilitiesApi.list.mockResolvedValue({
        data: mockLiabilities,
        error: null,
      });

      const { result } = renderHook(() => useNetWorthStore());

      const success = await act(async () => {
        return await result.current.updateLiability('1', updateRequest);
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Failed to update liability');
      expect(mockedLiabilitiesApi.list).toHaveBeenCalled(); // Should revert
    });
  });

  describe('deleteLiability', () => {
    it('should delete liability successfully', async () => {
      mockedLiabilitiesApi.delete.mockResolvedValue({
        data: undefined,
        error: null,
      });

      // Set up initial state
      useNetWorthStore.getState().liabilities = mockLiabilities;

      const { result } = renderHook(() => useNetWorthStore());

      const success = await act(async () => {
        return await result.current.deleteLiability('1');
      });

      expect(success).toBe(true);
      expect(mockedLiabilitiesApi.delete).toHaveBeenCalledWith('1');
      // Check optimistic update - liability should be removed
      expect(result.current.liabilities.find(l => l.id === '1')).toBeUndefined();
    });

    it('should perform optimistic delete', async () => {
      // Set up initial state
      useNetWorthStore.getState().liabilities = mockLiabilities;

      let resolveDelete: (value: any) => void;
      const deletePromise = new Promise((resolve) => {
        resolveDelete = resolve;
      });
      mockedLiabilitiesApi.delete.mockReturnValue(deletePromise);

      const { result } = renderHook(() => useNetWorthStore());

      // Start delete operation
      act(() => {
        result.current.deleteLiability('1');
      });

      // Check optimistic delete - liability should be removed immediately
      expect(result.current.liabilities.find(l => l.id === '1')).toBeUndefined();
      expect(result.current.liabilities).toHaveLength(2);

      // Resolve the delete
      await act(async () => {
        resolveDelete!({ data: undefined, error: null });
        await deletePromise;
      });
    });

    it('should revert optimistic delete on error', async () => {
      // Set up initial state
      useNetWorthStore.getState().liabilities = mockLiabilities;

      mockedLiabilitiesApi.delete.mockResolvedValue({
        data: undefined,
        error: {
          code: 'DELETE_ERROR',
          message: 'Failed to delete liability',
        },
      });

      // Mock loadLiabilities for the rollback
      mockedLiabilitiesApi.list.mockResolvedValue({
        data: mockLiabilities,
        error: null,
      });

      const { result } = renderHook(() => useNetWorthStore());

      const success = await act(async () => {
        return await result.current.deleteLiability('1');
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Failed to delete liability');
      expect(mockedLiabilitiesApi.list).toHaveBeenCalled(); // Should revert
    });
  });
});

describe('useLiabilityData', () => {
  const testLiabilities: Liability[] = [
    {
      id: '1',
      user_id: 'test-user',
      name: 'Credit Card Debt',
      category: 'credit_cards',
      liability_type: 'credit_card',
      current_balance: 5000,
      original_balance: 8000,
      interest_rate: 18.5,
      monthly_payment: 200,
      due_date: '2024-01-15',
      description: 'Main credit card',
      is_active: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: '2',
      user_id: 'test-user',
      name: 'Auto Loan',
      category: 'loans',
      liability_type: 'auto_loan',
      current_balance: 25000,
      original_balance: 30000,
      interest_rate: 5.5,
      monthly_payment: 500,
      due_date: null,
      description: 'Car financing',
      is_active: true,
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
    {
      id: '3',
      user_id: 'test-user',
      name: 'Mortgage',
      category: 'mortgages',
      liability_type: 'primary_mortgage',
      current_balance: 250000,
      original_balance: 300000,
      interest_rate: 3.5,
      monthly_payment: 1800,
      due_date: null,
      description: 'Primary residence',
      is_active: true,
      created_at: '2023-01-03T00:00:00Z',
      updated_at: '2023-01-03T00:00:00Z',
    },
  ];

  beforeEach(() => {
    // Reset store state
    useNetWorthStore.getState().liabilities = [];
    useNetWorthStore.getState().isLoadingLiabilities = false;
    useNetWorthStore.getState().error = null;
  });

  it('should calculate total liability balance correctly', () => {
    useNetWorthStore.getState().liabilities = [
      { ...testLiabilities[0], current_balance: 5000 },
      { ...testLiabilities[1], current_balance: 25000 },
      { ...testLiabilities[2], current_balance: 250000 },
    ];

    const { result } = renderHook(() => useLiabilityData());

    expect(result.current.totalLiabilityBalance).toBe(280000);
  });

  it('should return liability count correctly', () => {
    useNetWorthStore.getState().liabilities = testLiabilities;

    const { result } = renderHook(() => useLiabilityData());

    expect(result.current.liabilityCount).toBe(3);
  });

  it('should return top liabilities sorted by balance', () => {
    useNetWorthStore.getState().liabilities = testLiabilities;

    const { result } = renderHook(() => useLiabilityData());

    const topLiabilities = result.current.topLiabilities;
    expect(topLiabilities[0].current_balance).toBe(250000); // Mortgage should be first
    expect(topLiabilities[1].current_balance).toBe(25000); // Auto loan second
    expect(topLiabilities[2].current_balance).toBe(5000); // Credit card third
  });

  it('should calculate category breakdown correctly', () => {
    useNetWorthStore.getState().liabilities = testLiabilities;

    const { result } = renderHook(() => useLiabilityData());

    const breakdown = result.current.categoryBreakdown;
    expect(breakdown).toHaveLength(3);
    
    const creditCardsBreakdown = breakdown.find(b => b.category === 'credit_cards');
    expect(creditCardsBreakdown?.total).toBe(5000);
    expect(creditCardsBreakdown?.count).toBe(1);

    const loansBreakdown = breakdown.find(b => b.category === 'loans');
    expect(loansBreakdown?.total).toBe(25000);
    expect(loansBreakdown?.count).toBe(1);

    const mortgagesBreakdown = breakdown.find(b => b.category === 'mortgages');
    expect(mortgagesBreakdown?.total).toBe(250000);
    expect(mortgagesBreakdown?.count).toBe(1);
  });

  it('should calculate total monthly payments correctly', () => {
    useNetWorthStore.getState().liabilities = testLiabilities;

    const { result } = renderHook(() => useLiabilityData());

    expect(result.current.totalMonthlyPayments).toBe(2500); // 200 + 500 + 1800
  });

  it('should return highest interest rates correctly', () => {
    useNetWorthStore.getState().liabilities = testLiabilities;

    const { result } = renderHook(() => useLiabilityData());

    const highestRates = result.current.highestInterestRates;
    expect(highestRates[0].interest_rate).toBe(18.5); // Credit card should be first
    expect(highestRates[1].interest_rate).toBe(5.5); // Auto loan second
    expect(highestRates[2].interest_rate).toBe(3.5); // Mortgage third
  });

  it('should filter liabilities by category', () => {
    useNetWorthStore.getState().liabilities = testLiabilities;

    const { result } = renderHook(() => useLiabilityData());

    const creditCardLiabilities = result.current.getLiabilitiesByCategory('credit_cards');
    expect(creditCardLiabilities).toHaveLength(1);
    expect(creditCardLiabilities[0].name).toBe('Credit Card Debt');

    const loanLiabilities = result.current.getLiabilitiesByCategory('loans');
    expect(loanLiabilities).toHaveLength(1);
    expect(loanLiabilities[0].name).toBe('Auto Loan');
  });

  it('should return recent liabilities correctly', () => {
    useNetWorthStore.getState().liabilities = testLiabilities;

    const { result } = renderHook(() => useLiabilityData());

    const recentLiabilities = result.current.recentLiabilities;
    expect(recentLiabilities[0].name).toBe('Mortgage'); // Most recent by creation date
  });
});