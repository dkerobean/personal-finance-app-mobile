import { MonoConnectResponse, MonoAccountData, MonoLinkingResult, Account } from '@/types/models';
import * as SecureStore from 'expo-secure-store';
import { supabase } from './supabaseClient';

export class MonoService {
  private static instance: MonoService;
  private baseURL = 'https://api.withmono.com/v2';

  public static getInstance(): MonoService {
    if (!MonoService.instance) {
      MonoService.instance = new MonoService();
    }
    return MonoService.instance;
  }

  /**
   * Handle successful Mono Connect Widget response
   * @param connectResponse Response from Mono Connect Widget
   */
  async handleMonoConnectSuccess(connectResponse: MonoConnectResponse): Promise<MonoLinkingResult> {
    try {
      // Store the Mono code securely
      await SecureStore.setItemAsync(`mono_code_${connectResponse.id}`, connectResponse.code);

      // Call backend to exchange code for account information
      const { data, error } = await supabase.functions.invoke('accounts-link-bank', {
        body: {
          mono_code: connectResponse.code,
          mono_id: connectResponse.id
        }
      });

      if (error) {
        console.error('Error linking Mono account:', error);
        return {
          success: false,
          error: 'Failed to link bank account. Please try again.'
        };
      }

      return {
        success: true,
        account: data.account
      };

    } catch (error) {
      console.error('MonoService: Error handling connect success:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.'
      };
    }
  }

  /**
   * Retry account linking with stored Mono code
   * @param monoId Mono Connect session ID
   */
  async retryAccountLinking(monoId: string): Promise<MonoLinkingResult> {
    try {
      const storedCode = await SecureStore.getItemAsync(`mono_code_${monoId}`);
      
      if (!storedCode) {
        return {
          success: false,
          error: 'No stored authentication found. Please try linking again.'
        };
      }

      return await this.handleMonoConnectSuccess({
        code: storedCode,
        id: monoId
      });

    } catch (error) {
      console.error('MonoService: Error retrying account linking:', error);
      return {
        success: false,
        error: 'Failed to retry account linking. Please try again.'
      };
    }
  }

  /**
   * Unlink Mono bank account
   * @param accountId Account ID to unlink
   */
  async unlinkAccount(accountId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', accountId)
        .eq('account_type', 'bank');

      if (error) {
        console.error('Error unlinking Mono account:', error);
        return {
          success: false,
          error: 'Failed to unlink bank account. Please try again.'
        };
      }

      // Clean up stored codes (optional - they'll expire anyway)
      const { data: accountData } = await supabase
        .from('accounts')
        .select('mono_account_id')
        .eq('id', accountId)
        .single();

      if (accountData?.mono_account_id) {
        await SecureStore.deleteItemAsync(`mono_code_${accountData.mono_account_id}`);
      }

      return { success: true };

    } catch (error) {
      console.error('MonoService: Error unlinking account:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.'
      };
    }
  }

  /**
   * Get Mono public key from environment
   */
  getPublicKey(): string {
    const publicKey = process.env.EXPO_PUBLIC_MONO_PUBLIC_KEY;
    if (!publicKey) {
      console.warn('EXPO_PUBLIC_MONO_PUBLIC_KEY not configured. Mono service will be disabled.');
      return '';
    }
    return publicKey;
  }

  /**
   * Check if Mono integration is properly configured
   */
  isConfigured(): boolean {
    return !!process.env.EXPO_PUBLIC_MONO_PUBLIC_KEY;
  }

  /**
   * Get Mono Connect Widget configuration
   */
  getConnectConfig() {
    if (!this.isConfigured()) {
      console.warn('Mono service not configured, returning placeholder config');
      return {
        publicKey: '',
        onSuccess: () => console.log('Mono service disabled'),
        onError: (error: any) => console.log('Mono service disabled'),
        onClose: () => console.log('Mono service disabled'),
      };
    }

    return {
      publicKey: this.getPublicKey(),
      onSuccess: this.handleMonoConnectSuccess.bind(this),
      onError: (error: any) => {
        console.error('Mono Connect Widget Error:', error);
      },
      onClose: () => {
        console.log('Mono Connect Widget closed');
      }
    };
  }
}

export const monoService = MonoService.getInstance();