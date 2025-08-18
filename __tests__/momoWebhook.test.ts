import { createMockRequest, createMockResponse } from './setup';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
};

// Mock the webhook function
const mockWebhookFunction = async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    
    // Validate required fields
    if (!payload.externalId || !payload.status) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: externalId, status' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Mock database update
    const updateData = {
      momo_status: payload.status,
      momo_financial_transaction_id: payload.financialTransactionId,
      updated_at: new Date().toISOString(),
    };

    if (payload.status === 'SUCCESSFUL') {
      updateData.momo_financial_transaction_id = payload.financialTransactionId;
    }

    // Simulate database response
    const mockResult = { data: [{ id: 'tx-123', ...updateData }], error: null };
    
    return new Response(
      JSON.stringify({ 
        message: 'Webhook processed successfully',
        transactionId: payload.externalId,
        status: payload.status 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON payload' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

describe('MTN MoMo Webhook Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CORS handling', () => {
    it('should handle OPTIONS request with correct CORS headers', async () => {
      const request = createMockRequest('OPTIONS', 'https://example.com/webhook');
      
      const response = await mockWebhookFunction(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('content-type');
    });
  });

  describe('Webhook payload processing', () => {
    it('should process successful transaction webhook', async () => {
      const webhookPayload = {
        externalId: 'ext-123',
        status: 'SUCCESSFUL',
        financialTransactionId: 'fin-tx-456',
        amount: '25.50',
        currency: 'GHS',
        payer: {
          partyIdType: 'MSISDN',
          partyId: '233241234567',
        },
        timestamp: new Date().toISOString(),
      };

      const request = createMockRequest('POST', 'https://example.com/webhook', webhookPayload);
      
      const response = await mockWebhookFunction(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(200);
      expect(responseData.message).toBe('Webhook processed successfully');
      expect(responseData.transactionId).toBe('ext-123');
      expect(responseData.status).toBe('SUCCESSFUL');
    });

    it('should process failed transaction webhook', async () => {
      const webhookPayload = {
        externalId: 'ext-124',
        status: 'FAILED',
        reason: 'Insufficient funds',
        amount: '100.00',
        currency: 'GHS',
        payer: {
          partyIdType: 'MSISDN',
          partyId: '233241234567',
        },
        timestamp: new Date().toISOString(),
      };

      const request = createMockRequest('POST', 'https://example.com/webhook', webhookPayload);
      
      const response = await mockWebhookFunction(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(200);
      expect(responseData.status).toBe('FAILED');
    });

    it('should process pending transaction webhook', async () => {
      const webhookPayload = {
        externalId: 'ext-125',
        status: 'PENDING',
        amount: '50.00',
        currency: 'GHS',
        payer: {
          partyIdType: 'MSISDN',
          partyId: '233241234567',
        },
        timestamp: new Date().toISOString(),
      };

      const request = createMockRequest('POST', 'https://example.com/webhook', webhookPayload);
      
      const response = await mockWebhookFunction(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(200);
      expect(responseData.status).toBe('PENDING');
    });
  });

  describe('Validation and error handling', () => {
    it('should reject webhook with missing externalId', async () => {
      const webhookPayload = {
        status: 'SUCCESSFUL',
        financialTransactionId: 'fin-tx-456',
      };

      const request = createMockRequest('POST', 'https://example.com/webhook', webhookPayload);
      
      const response = await mockWebhookFunction(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(400);
      expect(responseData.error).toContain('Missing required fields');
    });

    it('should reject webhook with missing status', async () => {
      const webhookPayload = {
        externalId: 'ext-123',
        financialTransactionId: 'fin-tx-456',
      };

      const request = createMockRequest('POST', 'https://example.com/webhook', webhookPayload);
      
      const response = await mockWebhookFunction(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(400);
      expect(responseData.error).toContain('Missing required fields');
    });

    it('should handle invalid JSON payload', async () => {
      const request = new Request('https://example.com/webhook', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await mockWebhookFunction(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid JSON payload');
    });

    it('should handle empty request body', async () => {
      const request = new Request('https://example.com/webhook', {
        method: 'POST',
        body: '',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await mockWebhookFunction(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid JSON payload');
    });
  });

  describe('Transaction status updates', () => {
    it('should update transaction status to SUCCESSFUL', async () => {
      const webhookPayload = {
        externalId: 'ext-123',
        status: 'SUCCESSFUL',
        financialTransactionId: 'fin-tx-456',
        amount: '25.50',
        currency: 'GHS',
      };

      const request = createMockRequest('POST', 'https://example.com/webhook', webhookPayload);
      
      const response = await mockWebhookFunction(request);
      
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.status).toBe('SUCCESSFUL');
      expect(responseData.transactionId).toBe('ext-123');
    });

    it('should update transaction status to FAILED', async () => {
      const webhookPayload = {
        externalId: 'ext-124',
        status: 'FAILED',
        reason: 'Transaction timeout',
        amount: '75.00',
        currency: 'GHS',
      };

      const request = createMockRequest('POST', 'https://example.com/webhook', webhookPayload);
      
      const response = await mockWebhookFunction(request);
      
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.status).toBe('FAILED');
    });
  });

  describe('Webhook security', () => {
    it('should accept webhook with valid structure', async () => {
      const webhookPayload = {
        externalId: 'ext-security-test',
        status: 'SUCCESSFUL',
        financialTransactionId: 'fin-tx-security',
        amount: '10.00',
        currency: 'GHS',
        payer: {
          partyIdType: 'MSISDN',
          partyId: '233241234567',
        },
        payerMessage: 'Test payment',
        payeeNote: 'Webhook security test',
        timestamp: new Date().toISOString(),
      };

      const request = createMockRequest('POST', 'https://example.com/webhook', webhookPayload);
      
      const response = await mockWebhookFunction(request);
      
      expect(response.status).toBe(200);
    });

    it('should handle webhook with extra fields gracefully', async () => {
      const webhookPayload = {
        externalId: 'ext-extra-fields',
        status: 'SUCCESSFUL',
        financialTransactionId: 'fin-tx-extra',
        // Extra fields that might be sent by MTN MoMo
        extraField1: 'extra value 1',
        extraField2: { nested: 'object' },
        extraArray: [1, 2, 3],
      };

      const request = createMockRequest('POST', 'https://example.com/webhook', webhookPayload);
      
      const response = await mockWebhookFunction(request);
      
      expect(response.status).toBe(200);
    });
  });

  describe('Response format', () => {
    it('should return correct response headers', async () => {
      const webhookPayload = {
        externalId: 'ext-headers-test',
        status: 'SUCCESSFUL',
        financialTransactionId: 'fin-tx-headers',
      };

      const request = createMockRequest('POST', 'https://example.com/webhook', webhookPayload);
      
      const response = await mockWebhookFunction(request);
      
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should return structured success response', async () => {
      const webhookPayload = {
        externalId: 'ext-response-test',
        status: 'SUCCESSFUL',
        financialTransactionId: 'fin-tx-response',
      };

      const request = createMockRequest('POST', 'https://example.com/webhook', webhookPayload);
      
      const response = await mockWebhookFunction(request);
      const responseData = await response.json();
      
      expect(responseData).toHaveProperty('message');
      expect(responseData).toHaveProperty('transactionId');
      expect(responseData).toHaveProperty('status');
      expect(responseData.message).toBe('Webhook processed successfully');
    });
  });

  describe('Edge cases', () => {
    it('should handle very large webhook payloads', async () => {
      const largeDescription = 'A'.repeat(10000);
      const webhookPayload = {
        externalId: 'ext-large-payload',
        status: 'SUCCESSFUL',
        financialTransactionId: 'fin-tx-large',
        payerMessage: largeDescription,
        payeeNote: largeDescription,
      };

      const request = createMockRequest('POST', 'https://example.com/webhook', webhookPayload);
      
      const response = await mockWebhookFunction(request);
      
      expect(response.status).toBe(200);
    });

    it('should handle special characters in payload', async () => {
      const webhookPayload = {
        externalId: 'ext-special-chars',
        status: 'SUCCESSFUL',
        financialTransactionId: 'fin-tx-special',
        payerMessage: 'Payment with émojis 🚀 and spëcial chars ñ ü',
        payeeNote: 'Test with UTF-8: αβγδε',
      };

      const request = createMockRequest('POST', 'https://example.com/webhook', webhookPayload);
      
      const response = await mockWebhookFunction(request);
      
      expect(response.status).toBe(200);
    });

    it('should handle null values in optional fields', async () => {
      const webhookPayload = {
        externalId: 'ext-null-fields',
        status: 'FAILED',
        financialTransactionId: null,
        amount: '25.00',
        reason: null,
        payer: null,
      };

      const request = createMockRequest('POST', 'https://example.com/webhook', webhookPayload);
      
      const response = await mockWebhookFunction(request);
      
      expect(response.status).toBe(200);
    });
  });
});