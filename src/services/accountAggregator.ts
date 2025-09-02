import { Account, MonoConnectResponse, MonoLinkingResult, MTNMoMoLinkingResult } from '@/types/models';
import { monoService } from './monoService';
import { mtnMomoService } from './api/mtnMomoService';
import { monoSyncService, SyncProgress } from './monoSyncService';
import { mtnSyncService } from './mtnSyncService';
import { supabase } from './supabaseClient';
import type { ApiResponse } from '@/types/api';

export type AccountLinkingResult = MonoLinkingResult | MTNMoMoLinkingResult;

export interface SyncResult {
  totalTransactions: number;
  newTransactions: number;
  updatedTransactions: number;
  accountType: 'bank' | 'mobile_money';
  institutionName: string;
  errors: string[];
}

export class AccountAggregatorService {
  private static instance: AccountAggregatorService;

  public static getInstance(): AccountAggregatorService {
    if (!AccountAggregatorService.instance) {
      AccountAggregatorService.instance = new AccountAggregatorService();
    }
    return AccountAggregatorService.instance;
  }

  /**
   * Link a bank account via Mono
   */
  async linkBankAccount(monoResponse: MonoConnectResponse): Promise<MonoLinkingResult> {
    try {
      return await monoService.handleMonoConnectSuccess(monoResponse);
    } catch (error) {
      console.error('AccountAggregator: Error linking bank account:', error);
      return {
        success: false,
        error: 'Failed to link bank account. Please try again.'
      };
    }
  }

  /**
   * Link MTN MoMo account
   */
  async linkMTNMoMoAccount(phoneNumber: string, pin: string): Promise<MTNMoMoLinkingResult> {
    try {
      return await mtnMomoService.linkAccount(phoneNumber, pin);
    } catch (error) {
      console.error('AccountAggregator: Error linking MTN MoMo account:', error);
      return {
        success: false,
        error: 'Failed to link MTN MoMo account. Please try again.'
      };
    }
  }

  /**
   * Get all linked accounts for current user
   */
  async getLinkedAccounts(): Promise<Account[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('AccountAggregator: Error fetching accounts:', error);
      return [];
    }
  }

  /**
   * Get accounts by type
   */
  async getAccountsByType(accountType: 'bank' | 'mobile_money'): Promise<Account[]> {
    try {
      const allAccounts = await this.getLinkedAccounts();
      return allAccounts.filter(account => account.account_type === accountType);
    } catch (error) {
      console.error('AccountAggregator: Error fetching accounts by type:', error);
      return [];
    }
  }

  /**
   * Get bank accounts only
   */
  async getBankAccounts(): Promise<Account[]> {
    return this.getAccountsByType('bank');
  }

  /**
   * Get mobile money accounts only
   */
  async getMobileMoneyAccounts(): Promise<Account[]> {
    return this.getAccountsByType('mobile_money');
  }

  /**
   * Unlink account (platform-specific)
   */
  async unlinkAccount(accountId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First, get the account to determine platform
      const { data: account, error: fetchError } = await supabase
        .from('accounts')
        .select('account_type, mono_account_id, mtn_reference_id')
        .eq('id', accountId)
        .single();

      if (fetchError || !account) {
        return {
          success: false,
          error: 'Account not found'
        };
      }

      // Route to appropriate service based on account type
      if (account.account_type === 'bank') {
        return await monoService.unlinkAccount(accountId);
      } else if (account.account_type === 'mobile_money') {
        return await mtnMomoService.unlinkAccount(accountId);
      }

      return {
        success: false,
        error: 'Unknown account type'
      };

    } catch (error) {
      console.error('AccountAggregator: Error unlinking account:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.'
      };
    }
  }

  /**
   * Get account by ID
   */
  async getAccountById(accountId: string): Promise<Account | null> {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('AccountAggregator: Error fetching account by ID:', error);
      return null;
    }
  }

  /**
   * Check if user has linked accounts
   */
  async hasLinkedAccounts(): Promise<boolean> {
    try {
      const accounts = await this.getLinkedAccounts();
      return accounts.length > 0;
    } catch (error) {
      console.error('AccountAggregator: Error checking linked accounts:', error);
      return false;
    }
  }

  /**
   * Get total balance across all accounts
   */
  async getTotalBalance(): Promise<number> {
    try {
      const accounts = await this.getLinkedAccounts();
      return accounts.reduce((total, account) => total + account.balance, 0);
    } catch (error) {
      console.error('AccountAggregator: Error calculating total balance:', error);
      return 0;
    }
  }

  /**
   * Sync account data based on account type
   */
  async syncAccount(accountId: string, dateRange?: {
    startDate: string;
    endDate: string;
  }): Promise<ApiResponse<SyncResult>> {
    try {
      // Get account information to determine platform
      const account = await this.getAccountById(accountId);
      if (!account) {
        return {
          data: null,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account not found',
          },
        };
      }

      // Route to appropriate sync service based on account type
      if (account.account_type === 'bank') {
        return await monoSyncService.syncBankAccount(accountId, dateRange);
      } else if (account.account_type === 'mobile_money') {
        return await mtnSyncService.syncAccount(accountId, dateRange);
      } else {
        return {
          data: null,
          error: {
            code: 'UNSUPPORTED_ACCOUNT_TYPE',
            message: `Unsupported account type: ${account.account_type}`,
          },
        };
      }
    } catch (error) {
      console.error('AccountAggregator: Error syncing account:', error);
      return {
        data: null,
        error: {
          code: 'SYNC_ERROR',
          message: 'An unexpected error occurred during sync',
        },
      };
    }
  }

  /**
   * Sync account with progress callback
   */
  async syncAccountWithProgress(
    accountId: string,
    onProgress: (progress: SyncProgress) => void,
    dateRange?: {
      startDate: string;
      endDate: string;
    }
  ): Promise<ApiResponse<SyncResult>> {
    try {
      // Get account information to determine platform
      const account = await this.getAccountById(accountId);
      if (!account) {
        onProgress({
          status: 'error',
          message: 'Account not found',
          error: 'Account not found',
        });
        return {
          data: null,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account not found',
          },
        };
      }

      // Route to appropriate sync service with progress
      if (account.account_type === 'bank') {
        return await monoSyncService.syncBankAccountWithProgress(
          accountId,
          onProgress,
          dateRange
        );
      } else if (account.account_type === 'mobile_money') {
        return await mtnSyncService.syncAccountWithProgress(
          accountId,
          onProgress,
          dateRange
        );
      } else {
        onProgress({
          status: 'error',
          message: 'Unsupported account type',
          error: `Unsupported account type: ${account.account_type}`,
        });
        return {
          data: null,
          error: {
            code: 'UNSUPPORTED_ACCOUNT_TYPE',
            message: `Unsupported account type: ${account.account_type}`,
          },
        };
      }
    } catch (error) {
      console.error('AccountAggregator: Error in progress sync:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      onProgress({
        status: 'error',
        message: 'Sync failed',
        error: errorMessage,
      });

      return {
        data: null,
        error: {
          code: 'SYNC_ERROR',
          message: errorMessage,
        },
      };
    }
  }

  /**
   * Validate account can be synced
   */
  async validateAccountSync(accountId: string): Promise<ApiResponse<{ isValid: boolean; message?: string }>> {
    try {
      const account = await this.getAccountById(accountId);
      if (!account) {
        return {
          data: { isValid: false, message: 'Account not found' },
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account not found',
          },
        };
      }

      // Route to appropriate validation
      if (account.account_type === 'bank') {
        const result = await monoSyncService.validateBankAccount(accountId);
        if (result.error) {
          return {
            data: { isValid: false, message: result.error.message },
            error: result.error,
          };
        }
        return {
          data: { isValid: !!result.data, message: result.data ? 'Bank account is valid' : 'Bank account validation failed' },
          error: null,
        };
      } else if (account.account_type === 'mobile_money') {
        return await mtnSyncService.validateAccount(accountId);
      } else {
        return {
          data: { isValid: false, message: `Unsupported account type: ${account.account_type}` },
          error: {
            code: 'UNSUPPORTED_ACCOUNT_TYPE',
            message: `Unsupported account type: ${account.account_type}`,
          },
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      return {
        data: { isValid: false, message: errorMessage },
        error: {
          code: 'VALIDATION_ERROR',
          message: errorMessage,
        },
      };
    }
  }

  /**
   * Get sync history for account
   */
  async getSyncHistory(accountId: string, limit: number = 10): Promise<ApiResponse<Array<{
    id: string;
    sync_status: string;
    transactions_synced: number;
    sync_completed_at: string;
    error_message?: string;
  }>>> {
    try {
      const account = await this.getAccountById(accountId);
      if (!account) {
        return {
          data: [],
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account not found',
          },
        };
      }

      // Route to appropriate service
      if (account.account_type === 'bank') {
        return await monoSyncService.getSyncHistory(accountId, limit);
      } else if (account.account_type === 'mobile_money') {
        return await mtnSyncService.getSyncHistory(accountId, limit);
      } else {
        return {
          data: [],
          error: {
            code: 'UNSUPPORTED_ACCOUNT_TYPE',
            message: `Unsupported account type: ${account.account_type}`,
          },
        };
      }
    } catch (error) {
      return {
        data: [],
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch sync history',
        },
      };
    }
  }

  /**
   * Check configuration status for both platforms
   */
  checkConfiguration(): {
    mono: boolean;
    mtnMomo: boolean;
    bothConfigured: boolean;
  } {
    const monoConfigured = monoService.isConfigured();
    const mtnMomoConfigured = mtnMomoService.isConfigured();

    return {
      mono: monoConfigured,
      mtnMomo: mtnMomoConfigured,
      bothConfigured: monoConfigured && mtnMomoConfigured
    };
  }
}

export const accountAggregator = AccountAggregatorService.getInstance();