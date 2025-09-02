import { supabase } from './supabaseClient';
import { NetWorthService, NetWorthData } from './netWorthService';

export interface SnapshotCreationResult {
  success: boolean;
  snapshot?: any;
  error?: string;
  skipped?: boolean;
}

export class NetWorthSnapshotService {
  /**
   * Creates a monthly snapshot for a user if one doesn't already exist for the current month
   */
  static async createMonthlySnapshot(userId: string): Promise<SnapshotCreationResult> {
    try {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      // Check if snapshot already exists for this month
      const { data: existingSnapshot, error: checkError } = await supabase
        .from('net_worth_snapshots')
        .select('id')
        .eq('user_id', userId)
        .like('snapshot_date', `${currentMonth}%`)
        .limit(1);

      if (checkError) {
        return {
          success: false,
          error: `Error checking existing snapshots: ${checkError.message}`,
        };
      }

      if (existingSnapshot && existingSnapshot.length > 0) {
        return {
          success: true,
          skipped: true,
        };
      }

      // Calculate current net worth
      const netWorthData = await NetWorthService.calculateNetWorth();
      
      // Create snapshot
      const snapshotDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      const { data: snapshot, error: insertError } = await supabase
        .from('net_worth_snapshots')
        .insert({
          user_id: userId,
          snapshot_date: snapshotDate,
          total_assets: netWorthData.totalAssets,
          total_liabilities: netWorthData.totalLiabilities,
          net_worth: netWorthData.netWorth,
          manual_assets_value: netWorthData.totalAssets,
          manual_liabilities_value: netWorthData.totalLiabilities,
          created_at: now.toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        return {
          success: false,
          error: `Error creating snapshot: ${insertError.message}`,
        };
      }

      return {
        success: true,
        snapshot,
      };

    } catch (error) {
      return {
        success: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Creates snapshots for all active users (batch processing)
   */
  static async createSnapshotsForAllUsers(): Promise<{
    totalUsers: number;
    successful: number;
    failed: number;
    skipped: number;
    errors: string[];
  }> {
    const results = {
      totalUsers: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    try {
      // Get all users who have assets or liabilities (active users)
      const { data: users, error: usersError } = await supabase.rpc('get_active_networth_users');
      
      if (usersError) {
        results.errors.push(`Error fetching users: ${usersError.message}`);
        return results;
      }

      if (!users || users.length === 0) {
        return results;
      }

      results.totalUsers = users.length;

      // Process snapshots for each user
      for (const user of users) {
        const result = await this.createMonthlySnapshot(user.user_id);
        
        if (result.success) {
          if (result.skipped) {
            results.skipped++;
          } else {
            results.successful++;
          }
        } else {
          results.failed++;
          if (result.error) {
            results.errors.push(`User ${user.user_id}: ${result.error}`);
          }
        }

        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }

    } catch (error) {
      results.errors.push(`Batch processing error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return results;
  }

  /**
   * Gets the latest snapshot for a user
   */
  static async getLatestSnapshot(userId: string) {
    try {
      const { data, error } = await supabase
        .from('net_worth_snapshots')
        .select('*')
        .eq('user_id', userId)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Gets historical snapshots for a user within a date range
   */
  static async getHistoricalSnapshots(userId: string, startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase
        .from('net_worth_snapshots')
        .select('*')
        .eq('user_id', userId)
        .gte('snapshot_date', startDate)
        .lte('snapshot_date', endDate)
        .order('snapshot_date', { ascending: true });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Calculates net worth trend over time
   */
  static async calculateNetWorthTrend(userId: string, months: number = 12) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const { data: snapshots, error } = await this.getHistoricalSnapshots(
        userId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      if (error || !snapshots) {
        return { data: null, error };
      }

      const trendData = snapshots.map(snapshot => ({
        date: snapshot.snapshot_date,
        netWorth: Number(snapshot.net_worth),
        totalAssets: Number(snapshot.total_assets),
        totalLiabilities: Number(snapshot.total_liabilities),
      }));

      // Calculate growth rate if we have at least 2 data points
      let growthRate = 0;
      if (trendData.length >= 2) {
        const oldest = trendData[0];
        const newest = trendData[trendData.length - 1];
        if (oldest.netWorth > 0) {
          growthRate = ((newest.netWorth - oldest.netWorth) / oldest.netWorth) * 100;
        }
      }

      return {
        data: {
          snapshots: trendData,
          growthRate,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
        error: null,
      };

    } catch (error) {
      return { data: null, error };
    }
  }
}