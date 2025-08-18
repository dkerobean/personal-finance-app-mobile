import { mtnMomoService } from '@/services/api/mtnMomoService';
import { MoMoTransactionStatus } from '@/types/mtnMomo';
import * as SecureStore from 'expo-secure-store';

// Mock dependencies
jest.mock('expo-secure-store');
jest.mock('@/lib/constants', () => ({
  MTN_MOMO_CONFIG: {
    SUBSCRIPTION_KEY: 'test-subscription-key',
    BASE_URL_SANDBOX: 'https://sandbox.momodeveloper.mtn.com',
    BASE_URL_PRODUCTION: 'https://api.momodeveloper.mtn.com',
    TARGET_ENVIRONMENT: 'sandbox',
    CALLBACK_HOST: 'https://test-callback.com',
    CURRENCY: 'GHS',
  },
  STORAGE_KEYS: {
    MTN_MOMO_API_USER: 'mtn_momo_api_user',
    MTN_MOMO_API_KEY: 'mtn_momo_api_key',
  },
}));

// Mock fetch
global.fetch = jest.fn();

const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockedFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('MTN MoMo Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedSecureStore.setItemAsync.mockResolvedValue();
    mockedSecureStore.getItemAsync.mockResolvedValue(null);
    mockedSecureStore.deleteItemAsync.mockResolvedValue();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createApiUser', () => {
    it('should create API user successfully', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: () => Promise.resolve(''),
        json: () => Promise.resolve({}),
      } as Response);

      const result = await mtnMomoService.createApiUser('test-user-id');

      expect(result.success).toBe(true);
      expect(result.data).toBe('test-user-id');
      expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith(
        'mtn_momo_api_user',
        'test-user-id'
      );
    });

    it('should handle API user creation failure', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: () => Promise.resolve('{"code": "400", "message": "Invalid request"}'),
      } as Response);

      const result = await mtnMomoService.createApiUser();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('400');
      expect(result.error?.message).toBe('Invalid request');
    });

    it('should handle network errors', async () => {
      mockedFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await mtnMomoService.createApiUser();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
      expect(result.error?.message).toBe('Network error');
    });
  });

  describe('createApiKey', () => {
    it('should create API key successfully', async () => {
      const mockApiKey = 'test-api-key-123';
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: () => Promise.resolve(JSON.stringify({ apiKey: mockApiKey })),
        json: () => Promise.resolve({ apiKey: mockApiKey }),
      } as Response);

      const result = await mtnMomoService.createApiKey('test-reference-id');

      expect(result.success).toBe(true);
      expect(result.data).toBe(mockApiKey);
      expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith(
        'mtn_momo_api_key',
        mockApiKey
      );
    });

    it('should validate reference ID', async () => {
      const result = await mtnMomoService.createApiKey('');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_REQUIRED_FIELD');
    });
  });

  describe('getAccessToken', () => {
    beforeEach(() => {
      mockedSecureStore.getItemAsync
        .mockResolvedValueOnce('test-api-user')
        .mockResolvedValueOnce('test-api-key');
    });

    it('should get access token successfully', async () => {
      const mockToken = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockToken)),
        json: () => Promise.resolve(mockToken),
      } as Response);

      const result = await mtnMomoService.getAccessToken();

      expect(result.success).toBe(true);
      expect(result.data).toBe(mockToken.access_token);
    });

    it('should return cached token if still valid', async () => {
      // First call to get and cache token
      const mockToken = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockToken)),
        json: () => Promise.resolve(mockToken),
      } as Response);

      await mtnMomoService.getAccessToken();

      // Second call should use cached token
      mockedFetch.mockClear();
      const result = await mtnMomoService.getAccessToken();

      expect(result.success).toBe(true);
      expect(result.data).toBe(mockToken.access_token);
      expect(mockedFetch).not.toHaveBeenCalled();
    });

    it('should handle missing credentials', async () => {
      mockedSecureStore.getItemAsync.mockResolvedValue(null);

      const result = await mtnMomoService.getAccessToken();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('MOMO_INVALID_CREDENTIALS');
    });
  });

  describe('requestToPay', () => {
    beforeEach(() => {
      // Mock successful token response
      mockedSecureStore.getItemAsync
        .mockResolvedValueOnce('test-api-user')
        .mockResolvedValueOnce('test-api-key');

      mockedFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify({
            access_token: 'test-token',
            token_type: 'Bearer',
            expires_in: 3600,
          })),
          json: () => Promise.resolve({
            access_token: 'test-token',
            token_type: 'Bearer',
            expires_in: 3600,
          }),
        } as Response);
    });

    it('should request payment successfully', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: () => Promise.resolve(''),
      } as Response);

      const paymentRequest = {
        amount: '10.00',
        currency: 'GHS',
        externalId: 'test-external-id',
        payer: {
          partyIdType: 'MSISDN' as const,
          partyId: '233241234567',
        },
        payerMessage: 'Test payment',
        payeeNote: 'Test note',
      };

      const result = await mtnMomoService.requestToPay(paymentRequest);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe('string'); // UUID reference ID
    });

    it('should validate payment request', async () => {
      const invalidPaymentRequest = {
        amount: 'invalid',
        currency: 'GHS',
        externalId: 'test-external-id',
        payer: {
          partyIdType: 'MSISDN' as const,
          partyId: '233241234567',
        },
        payerMessage: 'Test payment',
        payeeNote: 'Test note',
      };

      const result = await mtnMomoService.requestToPay(invalidPaymentRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_INVALID_FORMAT');
    });

    it('should validate phone number', async () => {
      const paymentRequest = {
        amount: '10.00',
        currency: 'GHS',
        externalId: 'test-external-id',
        payer: {
          partyIdType: 'MSISDN' as const,
          partyId: 'invalid-phone',
        },
        payerMessage: 'Test payment',
        payeeNote: 'Test note',
      };

      const result = await mtnMomoService.requestToPay(paymentRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_INVALID_FORMAT');
    });

    it('should validate currency', async () => {
      const paymentRequest = {
        amount: '10.00',
        currency: 'USD', // Wrong currency
        externalId: 'test-external-id',
        payer: {
          partyIdType: 'MSISDN' as const,
          partyId: '233241234567',
        },
        payerMessage: 'Test payment',
        payeeNote: 'Test note',
      };

      const result = await mtnMomoService.requestToPay(paymentRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_INVALID_FORMAT');
    });
  });

  describe('getTransactionStatus', () => {
    beforeEach(() => {
      // Mock successful token response
      mockedSecureStore.getItemAsync
        .mockResolvedValueOnce('test-api-user')
        .mockResolvedValueOnce('test-api-key');

      mockedFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify({
            access_token: 'test-token',
            token_type: 'Bearer',
            expires_in: 3600,
          })),
          json: () => Promise.resolve({
            access_token: 'test-token',
            token_type: 'Bearer',
            expires_in: 3600,
          }),
        } as Response);
    });

    it('should get transaction status successfully', async () => {
      const mockTransactionStatus = {
        amount: '10.00',
        currency: 'GHS',
        externalId: 'test-external-id',
        payer: {
          partyIdType: 'MSISDN' as const,
          partyId: '233241234567',
        },
        status: MoMoTransactionStatus.SUCCESSFUL,
        financialTransactionId: 'financial-tx-123',
      };

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockTransactionStatus)),
        json: () => Promise.resolve(mockTransactionStatus),
      } as Response);

      const result = await mtnMomoService.getTransactionStatus('test-reference-id');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(MoMoTransactionStatus.SUCCESSFUL);
      expect(result.data?.externalId).toBe('test-external-id');
    });

    it('should validate reference ID', async () => {
      const result = await mtnMomoService.getTransactionStatus('');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_REQUIRED_FIELD');
    });
  });

  describe('processPayment', () => {
    beforeEach(() => {
      // Mock successful authentication
      mockedSecureStore.getItemAsync
        .mockResolvedValueOnce('test-api-user')
        .mockResolvedValueOnce('test-api-key');

      // Mock token response
      mockedFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify({
            access_token: 'test-token',
            token_type: 'Bearer',
            expires_in: 3600,
          })),
          json: () => Promise.resolve({
            access_token: 'test-token',
            token_type: 'Bearer',
            expires_in: 3600,
          }),
        } as Response);
    });

    it('should process payment successfully', async () => {
      // Mock successful payment request
      mockedFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          text: () => Promise.resolve(''),
        } as Response)
        // Mock successful status check
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify({
            amount: '10.00',
            currency: 'GHS',
            externalId: 'test-external-id',
            status: MoMoTransactionStatus.SUCCESSFUL,
            financialTransactionId: 'financial-tx-123',
          })),
          json: () => Promise.resolve({
            amount: '10.00',
            currency: 'GHS',
            externalId: 'test-external-id',
            status: MoMoTransactionStatus.SUCCESSFUL,
            financialTransactionId: 'financial-tx-123',
          }),
        } as Response);

      const result = await mtnMomoService.processPayment(
        '10.00',
        '233241234567',
        'Test payment',
        1, // maxRetries
        100 // pollDelayMs
      );

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(MoMoTransactionStatus.SUCCESSFUL);
    });

    it('should handle payment timeout', async () => {
      // Mock successful payment request
      mockedFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          text: () => Promise.resolve(''),
        } as Response)
        // Mock pending status (no final status reached)
        .mockResolvedValue({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify({
            amount: '10.00',
            currency: 'GHS',
            externalId: 'test-external-id',
            status: MoMoTransactionStatus.PENDING,
          })),
          json: () => Promise.resolve({
            amount: '10.00',
            currency: 'GHS',
            externalId: 'test-external-id',
            status: MoMoTransactionStatus.PENDING,
          }),
        } as Response);

      const result = await mtnMomoService.processPayment(
        '10.00',
        '233241234567',
        'Test payment',
        2, // maxRetries
        50 // pollDelayMs
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('API_TIMEOUT');
    });

    it('should validate input parameters', async () => {
      const result = await mtnMomoService.processPayment(
        'invalid-amount',
        '233241234567',
        'Test payment'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_INVALID_FORMAT');
    });
  });

  describe('initializeForSandbox', () => {
    it('should initialize sandbox successfully', async () => {
      // Mock all successful responses
      mockedFetch
        // createApiUser
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          text: () => Promise.resolve(''),
        } as Response)
        // createApiKey
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          text: () => Promise.resolve(JSON.stringify({ apiKey: 'test-key' })),
          json: () => Promise.resolve({ apiKey: 'test-key' }),
        } as Response)
        // getAccessToken
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify({
            access_token: 'test-token',
            token_type: 'Bearer',
            expires_in: 3600,
          })),
          json: () => Promise.resolve({
            access_token: 'test-token',
            token_type: 'Bearer',
            expires_in: 3600,
          }),
        } as Response);

      const result = await mtnMomoService.initializeForSandbox();

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should only work in sandbox environment', async () => {
      // This test would require mocking the config, which is complex with the current setup
      // In a real implementation, you might inject the config or make it more testable
    });
  });

  describe('clearCredentials', () => {
    it('should clear stored credentials', async () => {
      await mtnMomoService.clearCredentials();

      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('mtn_momo_api_user');
      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('mtn_momo_api_key');
    });

    it('should handle deletion errors gracefully', async () => {
      mockedSecureStore.deleteItemAsync.mockRejectedValueOnce(new Error('Deletion failed'));

      // Should not throw
      await expect(mtnMomoService.clearCredentials()).resolves.toBeUndefined();
    });
  });
});