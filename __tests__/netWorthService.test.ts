import { NetWorthService, NetWorthData } from '@/services/netWorthService';
import { supabase } from '@/services/supabaseClient';
import type { Asset, Liability } from '@/types/models';

// Mock Supabase client
jest.mock('@/services/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('NetWorthService', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  const mockAssets: Asset[] = [
    {
      id: '1',
      user_id: 'test-user-id',
      name: 'Primary Home',
      category: 'property',
      asset_type: 'real_estate',
      current_value: 300000,
      original_value: 250000,
      description: 'Primary residence',
      is_active: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: '2',
      user_id: 'test-user-id',
      name: 'Investment Portfolio',
      category: 'investments',
      asset_type: 'stocks',
      current_value: 50000,
      original_value: 40000,
      description: 'Stock portfolio',
      is_active: true,
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
  ];

  const mockLiabilities: Liability[] = [
    {
      id: '1',
      user_id: 'test-user-id',
      name: 'Home Mortgage',
      category: 'mortgages',
      liability_type: 'primary_mortgage' as any,
      current_balance: 200000,
      original_balance: 250000,
      interest_rate: 3.5,
      monthly_payment: 1500,
      due_date: undefined,
      description: 'Primary mortgage',
      is_active: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
  ];

  const mockAccounts = [
    { balance: 15000, account_type: 'bank' },
    { balance: 5000, account_type: 'mobile_money' },
  ];

  const mockTransactions = [
    { amount: 5000, type: 'income' },
    { amount: 3000, type: 'income' },
    { amount: 2000, type: 'expense' },
    { amount: 1500, type: 'expense' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth.getUser
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('calculateNetWorth', () => {
    it('should calculate net worth correctly with all data sources', async () => {
      // Mock database queries
      const mockFrom = jest.fn();
      const mockSelect = jest.fn();
      const mockEq = jest.fn();
      const mockGte = jest.fn();

      mockSupabase.from = mockFrom;
      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ eq: jest.fn().mockReturnValue({ 
        data: mockAssets, 
        error: null 
      }) });

      // Set up different responses for different tables
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({ data: mockAssets, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({ data: mockLiabilities, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({ data: mockAccounts, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({ data: mockTransactions, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    single: jest.fn().mockReturnValue({ data: { net_worth: 320000 }, error: null })
                  })
                })
              })
            })
          })
        });

      const result = await NetWorthService.calculateNetWorth();

      expect(result.totalAssets).toBe(370000); // 300000 + 50000 + 15000 + 5000
      expect(result.totalLiabilities).toBe(200000);
      expect(result.netWorth).toBe(170000); // 370000 - 200000
      expect(result.monthlyIncome).toBe(8000); // 5000 + 3000
      expect(result.monthlyExpenses).toBe(3500); // 2000 + 1500
      expect(result.savingsRate).toBe(56.25); // ((8000 - 3500) / 8000) * 100
    });

    it('should handle missing assets gracefully', async () => {
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({ data: [], error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({ data: mockLiabilities, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({ data: mockAccounts, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({ data: [], error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    single: jest.fn().mockReturnValue({ data: null, error: { code: 'PGRST116' } })
                  })
                })
              })
            })
          })
        });

      const result = await NetWorthService.calculateNetWorth();

      expect(result.totalAssets).toBe(20000); // Only accounts: 15000 + 5000
      expect(result.totalLiabilities).toBe(200000);
      expect(result.netWorth).toBe(-180000); // Negative net worth
    });

    it('should return mock data when no user is authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await NetWorthService.calculateNetWorth();

      expect(result.netWorth).toBe(125000);
      expect(result.totalAssets).toBe(275000);
      expect(result.totalLiabilities).toBe(150000);
      expect(result.assetsBreakdown).toHaveLength(4);
      expect(result.liabilitiesBreakdown).toHaveLength(3);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({ data: null, error: { message: 'Database error' } })
            })
          })
        });

      const result = await NetWorthService.calculateNetWorth();

      // Should return mock data on error
      expect(result.netWorth).toBe(125000);
    });
  });

  describe('asset breakdown calculations', () => {
    it('should calculate asset breakdown correctly', async () => {
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({ data: mockAssets, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({ data: [], error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({ data: mockAccounts, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({ data: [], error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    single: jest.fn().mockReturnValue({ data: null, error: { code: 'PGRST116' } })
                  })
                })
              })
            })
          })
        });

      const result = await NetWorthService.calculateNetWorth();

      expect(result.assetsBreakdown).toHaveLength(3);
      
      const propertyBreakdown = result.assetsBreakdown.find(item => item.category === 'property');
      expect(propertyBreakdown?.amount).toBe(300000);
      expect(propertyBreakdown?.percentage).toBeCloseTo(81.08, 1); // 300000 / 370000 * 100

      const investmentsBreakdown = result.assetsBreakdown.find(item => item.category === 'investments');
      expect(investmentsBreakdown?.amount).toBe(50000);
      expect(investmentsBreakdown?.percentage).toBeCloseTo(13.51, 1);

      const cashBreakdown = result.assetsBreakdown.find(item => item.category === 'cash');
      expect(cashBreakdown?.amount).toBe(20000);
      expect(cashBreakdown?.isConnected).toBe(true);
    });
  });

  describe('liability breakdown calculations', () => {
    it('should calculate liability breakdown correctly', async () => {
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({ data: [], error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({ data: mockLiabilities, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({ data: [], error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({ data: [], error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    single: jest.fn().mockReturnValue({ data: null, error: { code: 'PGRST116' } })
                  })
                })
              })
            })
          })
        });

      const result = await NetWorthService.calculateNetWorth();

      expect(result.liabilitiesBreakdown).toHaveLength(1);
      
      const mortgageBreakdown = result.liabilitiesBreakdown.find(item => item.category === 'mortgages');
      expect(mortgageBreakdown?.amount).toBe(200000);
      expect(mortgageBreakdown?.percentage).toBe(100);
      expect(mortgageBreakdown?.itemCount).toBe(1);
      expect(mortgageBreakdown?.isConnected).toBe(false);
    });
  });

  describe('monthly change calculations', () => {
    it('should calculate monthly change correctly', async () => {
      const mockSnapshot = { net_worth: 150000 };

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({ data: [], error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({ data: [], error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({ data: [], error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({ data: [], error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    single: jest.fn().mockReturnValue({ data: mockSnapshot, error: null })
                  })
                })
              })
            })
          })
        });

      const result = await NetWorthService.calculateNetWorth();

      // Net worth would be 0 (no assets or liabilities), previous was 150000
      expect(result.monthlyChange).toBe(-150000);
      expect(result.monthlyChangePercentage).toBeCloseTo(-100, 1);
    });
  });

  describe('saveNetWorthSnapshot', () => {
    it('should save snapshot successfully', async () => {
      const mockNetWorthData: NetWorthData = {
        netWorth: 100000,
        totalAssets: 200000,
        totalLiabilities: 100000,
        monthlyChange: 5000,
        monthlyChangePercentage: 5,
        assetsBreakdown: [],
        liabilitiesBreakdown: [],
        monthlyIncome: 8000,
        monthlyExpenses: 6000,
        savingsRate: 25,
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({ error: null })
      });

      await NetWorthService.saveNetWorthSnapshot('test-user', mockNetWorthData);

      expect(mockSupabase.from).toHaveBeenCalledWith('net_worth_snapshots');
    });

    it('should handle save errors gracefully', async () => {
      const mockNetWorthData: NetWorthData = {
        netWorth: 100000,
        totalAssets: 200000,
        totalLiabilities: 100000,
        monthlyChange: 5000,
        monthlyChangePercentage: 5,
        assetsBreakdown: [],
        liabilitiesBreakdown: [],
        monthlyIncome: 8000,
        monthlyExpenses: 6000,
        savingsRate: 25,
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({ error: { message: 'Insert failed' } })
      });

      // Should not throw error, but log it
      await expect(NetWorthService.saveNetWorthSnapshot('test-user', mockNetWorthData))
        .resolves
        .not.toThrow();
    });
  });
});