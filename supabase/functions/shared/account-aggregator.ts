import { monoClient } from './mono-client.ts'
import { mtnClient } from './mtn-client.ts'

export interface SyncResult {
  success: boolean
  platform: 'mono' | 'mtn_momo'
  totalTransactions: number
  newTransactions: number
  updatedTransactions: number
  accountInfo: {
    name: string
    balance?: number
    institution: string
  }
  errors: string[]
}

export interface AccountSyncData {
  platform: 'mono' | 'mtn_momo'
  transactions: Array<{
    id: string
    amount: number
    type: 'income' | 'expense'
    description: string
    date: string
    reference?: string
    category?: string
    balance?: number
    meta?: Record<string, any>
  }>
  account: {
    name: string
    balance?: number
    institution: string
    accountNumber?: string
  }
  totalTransactions: number
}

/**
 * Unified account aggregator for handling both Mono and MTN MoMo sync operations
 */
export class AccountAggregator {
  
  /**
   * Detect platform type based on account data
   */
  static detectPlatform(account: {
    account_type: string
    mono_account_id?: string
    mtn_reference_id?: string
    mtn_phone_number?: string
  }): 'mono' | 'mtn_momo' | null {
    if (account.account_type === 'bank' && account.mono_account_id) {
      return 'mono'
    } else if (account.account_type === 'mobile_money' && account.mtn_phone_number) {
      return 'mtn_momo'
    }
    return null
  }

  /**
   * Get sync data from appropriate platform
   */
  static async getSyncData(
    account: {
      account_type: string
      mono_account_id?: string
      mtn_reference_id?: string
      mtn_phone_number?: string
      institution_name: string
    },
    startDate: string,
    endDate: string
  ): Promise<AccountSyncData> {
    const platform = AccountAggregator.detectPlatform(account)
    
    if (!platform) {
      throw new Error(`Unable to determine platform for account type: ${account.account_type}`)
    }

    if (platform === 'mono') {
      if (!account.mono_account_id) {
        throw new Error('Bank account is missing Mono Account ID')
      }

      console.log(`Fetching Mono data for account: ${account.mono_account_id}`)
      
      const monoData = await monoClient.getAccountSyncData(
        account.mono_account_id,
        startDate,
        endDate
      )

      return {
        platform: 'mono',
        transactions: monoData.transactions.map(tx => ({
          id: tx.id,
          amount: tx.amount,
          type: tx.type,
          description: tx.description,
          date: tx.date,
          reference: tx.reference,
          category: tx.category,
          balance: tx.balance,
          meta: tx.meta,
        })),
        account: {
          name: monoData.account.name,
          balance: monoData.account.balance,
          institution: monoData.account.institution,
          accountNumber: monoData.account.accountNumber,
        },
        totalTransactions: monoData.totalTransactions,
      }

    } else if (platform === 'mtn_momo') {
      if (!account.mtn_phone_number) {
        throw new Error('Mobile money account is missing phone number')
      }

      console.log(`Fetching MTN MoMo data for phone: ${account.mtn_phone_number}`)
      
      // Initialize MTN MoMo client
      await mtnClient.initialize()

      // Fetch transactions from MTN MoMo API
      const transactions = await mtnClient.getTransactions(
        account.mtn_phone_number,
        startDate,
        endDate
      )

      // Transform MTN MoMo transactions to unified format
      const transformedTransactions = transactions.map(tx => ({
        id: tx.externalId,
        amount: parseFloat(tx.amount),
        type: AccountAggregator.determineMoMoTransactionType(tx),
        description: tx.payerMessage || 'MTN MoMo transaction',
        date: tx.createdAt || new Date().toISOString(),
        reference: tx.externalId,
        category: 'uncategorized',
        meta: {
          status: tx.status,
          payerInfo: tx.payer,
          financialTransactionId: tx.financialTransactionId,
          payeeNote: tx.payeeNote,
        },
      }))

      return {
        platform: 'mtn_momo',
        transactions: transformedTransactions,
        account: {
          name: `MTN MoMo (${account.mtn_phone_number})`,
          institution: account.institution_name,
        },
        totalTransactions: transformedTransactions.length,
      }
    }

    throw new Error(`Unsupported platform: ${platform}`)
  }

  /**
   * Determine transaction type for MTN MoMo transactions
   * This is a simplified heuristic - in practice you'd use more sophisticated logic
   */
  private static determineMoMoTransactionType(transaction: any): 'income' | 'expense' {
    // Simple heuristic based on transaction patterns
    const message = (transaction.payerMessage || '').toLowerCase()
    
    // Common income patterns
    if (message.includes('received') || 
        message.includes('credit') || 
        message.includes('deposit') ||
        message.includes('salary') ||
        message.includes('payment received')) {
      return 'income'
    }
    
    // Common expense patterns  
    if (message.includes('sent') ||
        message.includes('paid') ||
        message.includes('purchase') ||
        message.includes('bill') ||
        message.includes('transfer')) {
      return 'expense'
    }

    // Default to expense for safety (most mobile money transactions are outgoing)
    return 'expense'
  }

  /**
   * Validate account can be synced
   */
  static async validateAccount(account: {
    account_type: string
    mono_account_id?: string
    mtn_reference_id?: string
    mtn_phone_number?: string
  }): Promise<{ valid: boolean; error?: string; platform?: string }> {
    const platform = AccountAggregator.detectPlatform(account)
    
    if (!platform) {
      return {
        valid: false,
        error: `Unable to determine platform for account type: ${account.account_type}`,
      }
    }

    try {
      if (platform === 'mono' && account.mono_account_id) {
        const isValid = await monoClient.validateAccount(account.mono_account_id)
        return {
          valid: isValid,
          platform: 'mono',
          error: isValid ? undefined : 'Invalid Mono account or access denied',
        }
      } else if (platform === 'mtn_momo' && account.mtn_phone_number) {
        // For MTN MoMo, we'll assume it's valid if we have a phone number
        // In practice, you might want to validate the phone number format or make a test API call
        const phoneRegex = /^(\+233|0)[2-9]\d{8}$/
        const isValid = phoneRegex.test(account.mtn_phone_number)
        
        return {
          valid: isValid,
          platform: 'mtn_momo',
          error: isValid ? undefined : 'Invalid MTN MoMo phone number format',
        }
      }

      return {
        valid: false,
        error: 'Missing required platform identifiers',
      }

    } catch (error) {
      return {
        valid: false,
        platform,
        error: error instanceof Error ? error.message : 'Unknown validation error',
      }
    }
  }

  /**
   * Get platform display name
   */
  static getPlatformDisplayName(platform: 'mono' | 'mtn_momo'): string {
    switch (platform) {
      case 'mono':
        return 'Mono Bank'
      case 'mtn_momo':
        return 'MTN Mobile Money'
      default:
        return 'Unknown Platform'
    }
  }

  /**
   * Get platform-specific sync progress messages
   */
  static getSyncMessages(platform: 'mono' | 'mtn_momo') {
    switch (platform) {
      case 'mono':
        return {
          fetching: 'Fetching bank account information via Mono...',
          storing: 'Processing bank transactions...',
          completed: 'Bank account sync completed',
          error: 'Failed to sync bank account',
        }
      case 'mtn_momo':
        return {
          fetching: 'Fetching MTN MoMo transactions...',
          storing: 'Processing mobile money transactions...',
          completed: 'MTN MoMo sync completed',
          error: 'Failed to sync MTN MoMo account',
        }
      default:
        return {
          fetching: 'Fetching account data...',
          storing: 'Processing transactions...',
          completed: 'Account sync completed',
          error: 'Failed to sync account',
        }
    }
  }
}