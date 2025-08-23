import { corsHeaders } from './cors.ts'

const MONO_BASE_URL = 'https://api.withmono.com/v2'
const MONO_SECRET_KEY = Deno.env.get('MONO_SECRET_KEY')

interface MonoAccount {
  id: string
  account: {
    id: string
    name: string
    accountNumber: string
    type: string
    balance: number
    currency: string
    bvn: string
  }
  institution: {
    name: string
    bankCode: string
    type: string
  }
}

interface MonoTransaction {
  id: string
  amount: number
  type: 'debit' | 'credit'
  narration: string
  date: string
  balance: number
  reference: string
  category: string
  meta?: {
    location?: string
    channel?: string
  }
}

interface MonoTransactionsResponse {
  data: MonoTransaction[]
  meta: {
    total: number
    pages: number
    previous: string | null
    next: string | null
  }
}

interface MonoAccountInfo {
  account: {
    id: string
    name: string
    accountNumber: string
    type: string
    balance: number
    currency: string
    bvn: string
  }
  institution: {
    name: string
    bankCode: string
    type: string
  }
}

export interface MonoSyncTransaction {
  id: string
  amount: number
  type: 'income' | 'expense'
  description: string
  date: string
  reference: string
  category: string
  balance: number
  meta?: {
    location?: string
    channel?: string
  }
}

export interface MonoSyncResult {
  transactions: MonoSyncTransaction[]
  account: {
    name: string
    balance: number
    institution: string
    accountNumber: string
  }
  totalTransactions: number
}

class MonoClient {
  private secretKey: string

  constructor() {
    if (!MONO_SECRET_KEY) {
      throw new Error('MONO_SECRET_KEY environment variable is required')
    }
    this.secretKey = MONO_SECRET_KEY
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${MONO_BASE_URL}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'mono-sec-key': this.secretKey,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Mono API error (${response.status}): ${errorText}`)
    }

    return await response.json()
  }

  /**
   * Get account information using Mono Account ID
   */
  async getAccountInfo(monoAccountId: string): Promise<MonoAccountInfo> {
    try {
      const response = await this.makeRequest<MonoAccount>(`/accounts/${monoAccountId}`)
      
      return {
        account: {
          id: response.account.id,
          name: response.account.name,
          accountNumber: response.account.accountNumber,
          type: response.account.type,
          balance: response.account.balance,
          currency: response.account.currency,
          bvn: response.account.bvn,
        },
        institution: {
          name: response.institution.name,
          bankCode: response.institution.bankCode,
          type: response.institution.type,
        },
      }
    } catch (error) {
      console.error('Error fetching Mono account info:', error)
      throw new Error(`Failed to fetch account information: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get account transactions using Mono Account ID
   */
  async getTransactions(
    monoAccountId: string, 
    startDate: string, 
    endDate: string
  ): Promise<MonoSyncTransaction[]> {
    try {
      const params = new URLSearchParams({
        start: startDate,
        end: endDate,
        paginate: 'false', // Get all transactions in the date range
      })

      const response = await this.makeRequest<MonoTransactionsResponse>(
        `/accounts/${monoAccountId}/transactions?${params}`
      )

      // Transform Mono transactions to our internal format
      const transformedTransactions: MonoSyncTransaction[] = response.data.map((transaction) => ({
        id: transaction.id,
        amount: Math.abs(transaction.amount), // Always positive, type determines direction
        type: transaction.type === 'credit' ? 'income' : 'expense',
        description: transaction.narration || 'Bank transaction',
        date: transaction.date,
        reference: transaction.reference,
        category: transaction.category || 'uncategorized',
        balance: transaction.balance,
        meta: transaction.meta,
      }))

      return transformedTransactions
    } catch (error) {
      console.error('Error fetching Mono transactions:', error)
      throw new Error(`Failed to fetch transactions: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get complete account sync data (account info + transactions)
   */
  async getAccountSyncData(
    monoAccountId: string,
    startDate: string,
    endDate: string
  ): Promise<MonoSyncResult> {
    try {
      const [accountInfo, transactions] = await Promise.all([
        this.getAccountInfo(monoAccountId),
        this.getTransactions(monoAccountId, startDate, endDate),
      ])

      return {
        transactions,
        account: {
          name: accountInfo.account.name,
          balance: accountInfo.account.balance,
          institution: accountInfo.institution.name,
          accountNumber: accountInfo.account.accountNumber,
        },
        totalTransactions: transactions.length,
      }
    } catch (error) {
      console.error('Error syncing Mono account data:', error)
      throw new Error(`Failed to sync account data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Validate Mono Account ID exists and is accessible
   */
  async validateAccount(monoAccountId: string): Promise<boolean> {
    try {
      await this.getAccountInfo(monoAccountId)
      return true
    } catch (error) {
      console.error('Mono account validation failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const monoClient = new MonoClient()