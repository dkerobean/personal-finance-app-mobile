import { NetWorthSnapshotService, SnapshotCreationResult } from '@/services/netWorthSnapshotService';
import { NetWorthService } from '@/services/netWorthService';
import { supabase } from '@/services/supabaseClient';

// Mock dependencies
jest.mock('@/services/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

jest.mock('@/services/netWorthService', () => ({
  NetWorthService: {
    calculateNetWorth: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockNetWorthService = NetWorthService as jest.Mocked<typeof NetWorthService>;

describe('NetWorthSnapshotService', () => {
  const testUserId = 'test-user-id';
  const mockNetWorthData = {
    netWorth: 150000,
    totalAssets: 300000,
    totalLiabilities: 150000,
    monthlyChange: 5000,
    monthlyChangePercentage: 3.45,
    assetsBreakdown: [],
    liabilitiesBreakdown: [],
    monthlyIncome: 8000,
    monthlyExpenses: 6000,
    savingsRate: 25,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock current date to be consistent
    const fixedDate = new Date('2023-11-15T10:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => fixedDate);
    
    mockNetWorthService.calculateNetWorth.mockResolvedValue(mockNetWorthData);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createMonthlySnapshot', () => {
    it('should create a new snapshot when none exists for the current month', async () => {
      // Mock no existing snapshot
      const mockFrom = jest.fn();
      const mockSelect = jest.fn();
      const mockEq = jest.fn();
      const mockLike = jest.fn();
      const mockLimit = jest.fn();
      const mockInsert = jest.fn();

      mockSupabase.from = mockFrom;
      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ like: mockLike });
      mockLike.mockReturnValue({ limit: mockLimit });
      mockLimit.mockResolvedValue({ data: [], error: null });

      // Mock successful insertion
      mockFrom
        .mockReturnValueOnce({
          select: mockSelect.mockReturnValue({
            eq: mockEq.mockReturnValue({
              like: mockLike.mockReturnValue({
                limit: mockLimit.mockResolvedValue({ data: [], error: null })
              })
            })
          })
        })
        .mockReturnValueOnce({
          insert: mockInsert.mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ 
                data: { id: 'snapshot-id', net_worth: 150000 }, 
                error: null 
              })
            })
          })
        });

      const result = await NetWorthSnapshotService.createMonthlySnapshot(testUserId);

      expect(result.success).toBe(true);
      expect(result.snapshot).toBeDefined();
      expect(result.skipped).toBeUndefined();
      expect(mockNetWorthService.calculateNetWorth).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('net_worth_snapshots');
    });

    it('should skip snapshot creation when one already exists for the current month', async () => {
      // Mock existing snapshot
      const mockFrom = jest.fn();
      mockSupabase.from = mockFrom;
      
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            like: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ 
                data: [{ id: 'existing-snapshot' }], 
                error: null 
              })
            })
          })
        })
      });

      const result = await NetWorthSnapshotService.createMonthlySnapshot(testUserId);

      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
      expect(mockNetWorthService.calculateNetWorth).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const mockFrom = jest.fn();
      mockSupabase.from = mockFrom;
      
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            like: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ 
                data: null, 
                error: { message: 'Database connection failed' } 
              })
            })
          })
        })
      });

      const result = await NetWorthSnapshotService.createMonthlySnapshot(testUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Error checking existing snapshots');
    });

    it('should handle net worth calculation errors', async () => {
      // Mock no existing snapshot
      const mockFrom = jest.fn();
      mockSupabase.from = mockFrom;
      
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            like: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        })
      });

      // Mock net worth calculation failure
      mockNetWorthService.calculateNetWorth.mockRejectedValue(new Error('Calculation failed'));

      const result = await NetWorthSnapshotService.createMonthlySnapshot(testUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unexpected error: Calculation failed');
    });
  });

  describe('createSnapshotsForAllUsers', () => {
    it('should process multiple users successfully', async () => {
      const mockUsers = [
        { user_id: 'user1' },
        { user_id: 'user2' },
        { user_id: 'user3' },
      ];

      // Mock RPC call to get users
      mockSupabase.rpc.mockResolvedValue({ data: mockUsers, error: null });

      // Mock no existing snapshots for all users
      const mockFrom = jest.fn();
      mockSupabase.from = mockFrom;
      
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            like: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        })
      });

      // Mock successful insertions
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            like: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: { id: 'snapshot-id' }, 
              error: null 
            })
          })
        })
      });

      const result = await NetWorthSnapshotService.createSnapshotsForAllUsers();

      expect(result.totalUsers).toBe(3);
      expect(result.successful).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle mixed success/failure scenarios', async () => {
      const mockUsers = [
        { user_id: 'user1' },
        { user_id: 'user2' },
      ];

      mockSupabase.rpc.mockResolvedValue({ data: mockUsers, error: null });

      let callCount = 0;
      const mockFrom = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount <= 2) { // First user - success
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                like: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({ data: [], error: null })
                })
              })
            }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: { id: 'snapshot-id' }, 
                  error: null 
                })
              })
            })
          };
        } else { // Second user - failure
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                like: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({ data: [], error: null })
                })
              })
            }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: null, 
                  error: { message: 'Insert failed' } 
                })
              })
            })
          };
        }
      });

      mockSupabase.from = mockFrom;

      const result = await NetWorthSnapshotService.createSnapshotsForAllUsers();

      expect(result.totalUsers).toBe(2);
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });

    it('should handle no users scenario', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

      const result = await NetWorthSnapshotService.createSnapshotsForAllUsers();

      expect(result.totalUsers).toBe(0);
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(0);
    });
  });

  describe('getLatestSnapshot', () => {
    it('should return the most recent snapshot', async () => {
      const mockSnapshot = {
        id: 'snapshot-id',
        user_id: testUserId,
        net_worth: 150000,
        snapshot_date: '2023-10-01',
      };

      const mockFrom = jest.fn();
      mockSupabase.from = mockFrom;
      
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: mockSnapshot, 
                  error: null 
                })
              })
            })
          })
        })
      });

      const result = await NetWorthSnapshotService.getLatestSnapshot(testUserId);

      expect(result.data).toEqual(mockSnapshot);
      expect(result.error).toBeNull();
    });

    it('should handle no snapshots found', async () => {
      const mockFrom = jest.fn();
      mockSupabase.from = mockFrom;
      
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: null, 
                  error: { code: 'PGRST116' } 
                })
              })
            })
          })
        })
      });

      const result = await NetWorthSnapshotService.getLatestSnapshot(testUserId);

      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });
  });

  describe('getHistoricalSnapshots', () => {
    it('should return snapshots within date range', async () => {
      const mockSnapshots = [
        { id: '1', snapshot_date: '2023-09-01', net_worth: 140000 },
        { id: '2', snapshot_date: '2023-10-01', net_worth: 145000 },
        { id: '3', snapshot_date: '2023-11-01', net_worth: 150000 },
      ];

      const mockFrom = jest.fn();
      mockSupabase.from = mockFrom;
      
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({ 
                  data: mockSnapshots, 
                  error: null 
                })
              })
            })
          })
        })
      });

      const result = await NetWorthSnapshotService.getHistoricalSnapshots(
        testUserId,
        '2023-09-01',
        '2023-11-01'
      );

      expect(result.data).toEqual(mockSnapshots);
      expect(result.error).toBeNull();
    });
  });

  describe('calculateNetWorthTrend', () => {
    it('should calculate trend with growth rate', async () => {
      const mockSnapshots = [
        { snapshot_date: '2023-09-01', net_worth: 140000, total_assets: 240000, total_liabilities: 100000 },
        { snapshot_date: '2023-10-01', net_worth: 145000, total_assets: 250000, total_liabilities: 105000 },
        { snapshot_date: '2023-11-01', net_worth: 150000, total_assets: 260000, total_liabilities: 110000 },
      ];

      // Mock getHistoricalSnapshots
      jest.spyOn(NetWorthSnapshotService, 'getHistoricalSnapshots').mockResolvedValue({
        data: mockSnapshots,
        error: null,
      });

      const result = await NetWorthSnapshotService.calculateNetWorthTrend(testUserId, 3);

      expect(result.data).toBeDefined();
      expect(result.data!.snapshots).toHaveLength(3);
      expect(result.data!.growthRate).toBeCloseTo(7.14, 1); // (150000 - 140000) / 140000 * 100
      expect(result.error).toBeNull();
    });

    it('should handle insufficient data points', async () => {
      const mockSnapshots = [
        { snapshot_date: '2023-11-01', net_worth: 150000, total_assets: 260000, total_liabilities: 110000 },
      ];

      jest.spyOn(NetWorthSnapshotService, 'getHistoricalSnapshots').mockResolvedValue({
        data: mockSnapshots,
        error: null,
      });

      const result = await NetWorthSnapshotService.calculateNetWorthTrend(testUserId, 3);

      expect(result.data!.snapshots).toHaveLength(1);
      expect(result.data!.growthRate).toBe(0);
    });
  });
});