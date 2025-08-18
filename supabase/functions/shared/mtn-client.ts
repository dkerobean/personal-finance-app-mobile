interface MTNTransaction {
  externalId: string;
  amount: string;
  currency: string;
  payerMessage?: string;
  payeeNote?: string;
  status: string;
  payer: {
    partyIdType: string;
    partyId: string;
  };
  financialTransactionId?: string;
  createdAt?: string;
}

interface MTNAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

class MTNClient {
  private baseUrl: string;
  private apiKey: string;
  private apiSecret: string;
  private accessToken: string | null = null;

  constructor() {
    this.baseUrl = Deno.env.get('MTN_API_BASE_URL') || 'https://sandbox.momodeveloper.mtn.com';
    this.apiKey = Deno.env.get('MTN_API_KEY') || '';
    this.apiSecret = Deno.env.get('MTN_API_SECRET') || '';

    if (!this.apiKey || !this.apiSecret) {
      console.warn('MTN API credentials not configured. Using mock data.');
    }
  }

  async initialize(): Promise<void> {
    if (!this.apiKey || !this.apiSecret) {
      console.log('MTN API not configured, using mock mode');
      return;
    }

    try {
      await this.authenticate();
    } catch (error) {
      console.error('Failed to initialize MTN client:', error);
      throw new Error('MTN MoMo service initialization failed');
    }
  }

  private async authenticate(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/collection/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${this.apiKey}:${this.apiSecret}`)}`,
          'Ocp-Apim-Subscription-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }

      const data: MTNAuthResponse = await response.json();
      this.accessToken = data.access_token;
    } catch (error) {
      console.error('MTN authentication error:', error);
      throw error;
    }
  }

  async getTransactions(
    phoneNumber: string,
    startDate: string,
    endDate: string
  ): Promise<MTNTransaction[]> {
    // If API is not configured, return mock data
    if (!this.apiKey || !this.apiSecret || !this.accessToken) {
      return this.generateMockTransactions(phoneNumber, startDate, endDate);
    }

    try {
      // In a real implementation, this would call the actual MTN MoMo API
      // For now, we'll use mock data since the MTN MoMo API for transaction history
      // is not publicly documented in their sandbox
      return this.generateMockTransactions(phoneNumber, startDate, endDate);
    } catch (error) {
      console.error('Failed to fetch transactions from MTN API:', error);
      throw new Error('Failed to fetch transactions from MTN MoMo');
    }
  }

  private generateMockTransactions(
    phoneNumber: string,
    startDate: string,
    endDate: string
  ): MTNTransaction[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Generate 1-3 transactions per week within the date range
    const numTransactions = Math.min(Math.max(1, Math.floor(daysDiff / 7) * 2), 15);
    const transactions: MTNTransaction[] = [];

    const mockTransactionTypes = [
      { amount: '25.50', message: 'Lunch at KFC Accra Mall', note: 'Food purchase' },
      { amount: '15.00', message: 'Uber ride to work', note: 'Transportation' },
      { amount: '100.00', message: 'ECG electricity bill payment', note: 'Utility bill' },
      { amount: '2000.00', message: 'Monthly salary deposit', note: 'Salary payment' },
      { amount: '50.00', message: 'Shopping at Shoprite', note: 'Grocery shopping' },
      { amount: '8.50', message: 'Mobile data bundle', note: 'Telecom services' },
      { amount: '200.00', message: 'Transfer to savings account', note: 'Personal transfer' },
      { amount: '35.00', message: 'Pharmacy - medication', note: 'Healthcare' },
      { amount: '120.00', message: 'Fuel station payment', note: 'Transportation' },
      { amount: '75.00', message: 'Restaurant dinner', note: 'Dining out' },
    ];

    for (let i = 0; i < numTransactions; i++) {
      const mockTransaction = mockTransactionTypes[i % mockTransactionTypes.length];
      const randomDate = new Date(
        start.getTime() + Math.random() * (end.getTime() - start.getTime())
      );

      transactions.push({
        externalId: `mtn-mock-${Date.now()}-${i}`,
        amount: mockTransaction.amount,
        currency: 'GHS',
        payerMessage: mockTransaction.message,
        payeeNote: mockTransaction.note,
        status: 'SUCCESSFUL',
        payer: {
          partyIdType: 'MSISDN',
          partyId: phoneNumber,
        },
        financialTransactionId: `fin-${Date.now()}-${i}`,
        createdAt: randomDate.toISOString(),
      });
    }

    // Sort by date descending (newest first)
    return transactions.sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }
}

export const mtnClient = new MTNClient();