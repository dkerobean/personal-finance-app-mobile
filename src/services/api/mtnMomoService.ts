import { v4 as uuidv4 } from 'uuid';
import * as SecureStore from 'expo-secure-store';
import { MTN_MOMO_CONFIG, STORAGE_KEYS } from '@/lib/constants';
import { 
  MoMoError, 
  ValidationError,
  handleMoMoApiError, 
  validateInput, 
  validators, 
  logError,
  ERROR_CODES 
} from '@/lib/errorUtilsPolyfill';
import type {
  MoMoApiUser,
  MoMoApiKey,
  MoMoAccessToken,
  MoMoPaymentRequest,
  MoMoTransactionStatusResponse,
  MoMoAccountBalance,
  MoMoServiceConfig,
  MoMoServiceResponse,
  MoMoApiError
} from '@/types/mtnMomo';
import { MoMoTransactionStatus } from '@/types/mtnMomo';

class MtnMomoService {
  private config: MoMoServiceConfig;
  private apiUser?: string;
  private apiKey?: string;
  private accessToken?: string;
  private tokenExpiresAt?: number;

  constructor() {
    this.config = {
      subscriptionKey: MTN_MOMO_CONFIG.SUBSCRIPTION_KEY,
      baseUrl: MTN_MOMO_CONFIG.TARGET_ENVIRONMENT === 'sandbox' 
        ? MTN_MOMO_CONFIG.BASE_URL_SANDBOX 
        : MTN_MOMO_CONFIG.BASE_URL_PRODUCTION,
      targetEnvironment: MTN_MOMO_CONFIG.TARGET_ENVIRONMENT,
      callbackHost: MTN_MOMO_CONFIG.CALLBACK_HOST,
      currency: MTN_MOMO_CONFIG.CURRENCY
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: any = {}
  ): Promise<MoMoServiceResponse<T>> {
    try {
      const url = `${this.config.baseUrl}${endpoint}`;
      
      const defaultHeaders = {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
        'X-Target-Environment': this.config.targetEnvironment,
      };

      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: MoMoApiError;
        
        try {
          const parsedError = JSON.parse(errorText);
          errorData = {
            code: parsedError.code || response.status.toString(),
            message: parsedError.message || response.statusText,
            details: parsedError
          };
        } catch {
          errorData = {
            code: response.status.toString(),
            message: response.statusText || 'Request failed',
            details: errorText
          };
        }

        return { success: false, error: errorData };
      }

      // Handle 201 responses that might not have content
      if (response.status === 201) {
        return { success: true, data: {} as T };
      }

      // Handle empty responses
      const text = await response.text();
      if (!text) {
        return { success: true, data: {} as T };
      }

      const data = JSON.parse(text);
      return { success: true, data };
    } catch (error) {
      console.error('MTN MoMo API Request failed:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network request failed',
          details: error
        }
      };
    }
  }

  // Step 1: Create API User (sandbox only)
  async createApiUser(referenceId?: string): Promise<MoMoServiceResponse<string>> {
    try {
      const userId = referenceId || uuidv4();
      
      const response = await this.makeRequest<void>('/v1_0/apiuser', {
        method: 'POST',
        headers: {
          'X-Reference-Id': userId,
        },
        body: JSON.stringify({
          providerCallbackHost: this.config.callbackHost || 'https://webhook.site/unique-id'
        }),
      });

      if (response.success) {
        this.apiUser = userId;
        await SecureStore.setItemAsync(STORAGE_KEYS.MTN_MOMO_API_USER, userId);
        return { success: true, data: userId };
      }

      return {
        success: false,
        error: response.error
      };
    } catch (error) {
      logError(error as Error, 'createApiUser');
      const momoError = handleMoMoApiError(error);
      return {
        success: false,
        error: momoError.toAppError()
      };
    }
  }

  // Step 2: Get API User Info
  async getApiUserInfo(referenceId: string): Promise<MoMoServiceResponse<MoMoApiUser>> {
    try {
      validateInput('referenceId', referenceId, (val) => val.trim().length > 0, 'Reference ID is required');
      
      return this.makeRequest<MoMoApiUser>(`/v1_0/apiuser/${referenceId}`);
    } catch (error) {
      logError(error as Error, 'getApiUserInfo');
      
      if (error instanceof ValidationError) {
        return {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_REQUIRED_FIELD,
            message: error.message,
            timestamp: new Date().toISOString()
          }
        };
      }
      
      const momoError = handleMoMoApiError(error);
      return {
        success: false,
        error: momoError.toAppError()
      };
    }
  }

  // Step 3: Create API Key
  async createApiKey(referenceId: string): Promise<MoMoServiceResponse<string>> {
    try {
      validateInput('referenceId', referenceId, (val) => val.trim().length > 0, 'Reference ID is required');
      
      const response = await this.makeRequest<MoMoApiKey>(`/v1_0/apiuser/${referenceId}/apikey`, {
        method: 'POST',
      });

      if (response.success && response.data) {
        this.apiKey = response.data.apiKey;
        await SecureStore.setItemAsync(STORAGE_KEYS.MTN_MOMO_API_KEY, response.data.apiKey);
        return { success: true, data: response.data.apiKey };
      }

      return {
        success: false,
        error: response.error
      };
    } catch (error) {
      logError(error as Error, 'createApiKey');
      
      if (error instanceof ValidationError) {
        return {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_REQUIRED_FIELD,
            message: error.message,
            timestamp: new Date().toISOString()
          }
        };
      }
      
      const momoError = handleMoMoApiError(error);
      return {
        success: false,
        error: momoError.toAppError()
      };
    }
  }

  // Step 4: Get Access Token
  async getAccessToken(): Promise<MoMoServiceResponse<string>> {
    try {
      if (!this.apiUser || !this.apiKey) {
        await this.loadStoredCredentials();
      }

      if (!this.apiUser || !this.apiKey) {
        throw new MoMoError(
          ERROR_CODES.MOMO_INVALID_CREDENTIALS,
          'API user and key are required. Please initialize the service first.',
          { hasApiUser: !!this.apiUser, hasApiKey: !!this.apiKey },
          'getAccessToken'
        );
      }

      // Check if current token is still valid
      if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
        return { success: true, data: this.accessToken };
      }

      // Create Basic Auth header
      const credentials = btoa(`${this.apiUser}:${this.apiKey}`);

      const response = await this.makeRequest<MoMoAccessToken>('/collection/token/', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
        },
      });

      if (response.success && response.data) {
        this.accessToken = response.data.access_token;
        this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000);
        return { success: true, data: response.data.access_token };
      }

      return {
        success: false,
        error: response.error
      };
    } catch (error) {
      logError(error as Error, 'getAccessToken');
      
      if (error instanceof MoMoError) {
        return {
          success: false,
          error: error.toAppError()
        };
      }
      
      const momoError = handleMoMoApiError(error);
      return {
        success: false,
        error: momoError.toAppError()
      };
    }
  }

  // Step 5: Request to Pay
  async requestToPay(paymentRequest: MoMoPaymentRequest): Promise<MoMoServiceResponse<string>> {
    try {
      // Validate payment request
      validateInput('amount', paymentRequest.amount, validators.amount, 'Please enter a valid amount between 0.01 and 100,000 GHS');
      validateInput('phoneNumber', paymentRequest.payer.partyId, validators.phoneNumber, 'Please enter a valid Ghana phone number');
      
      if (!paymentRequest.currency || paymentRequest.currency !== this.config.currency) {
        throw new ValidationError('currency', `Currency must be ${this.config.currency}`, paymentRequest.currency);
      }
      
      const tokenResponse = await this.getAccessToken();
      if (!tokenResponse.success || !tokenResponse.data) {
        return tokenResponse;
      }

      const referenceId = uuidv4();

      const response = await this.makeRequest<void>('/collection/v1_0/requesttopay', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenResponse.data}`,
          'X-Reference-Id': referenceId,
        },
        body: JSON.stringify(paymentRequest),
      });

      if (response.success) {
        return { success: true, data: referenceId };
      }

      return {
        success: false,
        error: response.error
      };
    } catch (error) {
      logError(error as Error, 'requestToPay');
      
      if (error instanceof ValidationError) {
        return {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_INVALID_FORMAT,
            message: error.message,
            timestamp: new Date().toISOString(),
            details: { field: error.field, value: error.value }
          }
        };
      }
      
      const momoError = handleMoMoApiError(error);
      return {
        success: false,
        error: momoError.toAppError()
      };
    }
  }

  // Step 6: Get Transaction Status
  async getTransactionStatus(referenceId: string): Promise<MoMoServiceResponse<MoMoTransactionStatusResponse>> {
    try {
      validateInput('referenceId', referenceId, (val) => val.trim().length > 0, 'Reference ID is required');
      
      const tokenResponse = await this.getAccessToken();
      if (!tokenResponse.success || !tokenResponse.data) {
        return {
          success: false,
          error: tokenResponse.error
        };
      }

      return this.makeRequest<MoMoTransactionStatusResponse>(`/collection/v1_0/requesttopay/${referenceId}`, {
        headers: {
          'Authorization': `Bearer ${tokenResponse.data}`,
        },
      });
    } catch (error) {
      logError(error as Error, 'getTransactionStatus');
      
      if (error instanceof ValidationError) {
        return {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_REQUIRED_FIELD,
            message: error.message,
            timestamp: new Date().toISOString()
          }
        };
      }
      
      const momoError = handleMoMoApiError(error);
      return {
        success: false,
        error: momoError.toAppError()
      };
    }
  }

  // Get Account Balance
  async getAccountBalance(): Promise<MoMoServiceResponse<MoMoAccountBalance>> {
    try {
      const tokenResponse = await this.getAccessToken();
      if (!tokenResponse.success || !tokenResponse.data) {
        return {
          success: false,
          error: tokenResponse.error
        };
      }

      return this.makeRequest<MoMoAccountBalance>('/collection/v1_0/account/balance', {
        headers: {
          'Authorization': `Bearer ${tokenResponse.data}`,
        },
      });
    } catch (error) {
      logError(error as Error, 'getAccountBalance');
      const momoError = handleMoMoApiError(error);
      return {
        success: false,
        error: momoError.toAppError()
      };
    }
  }

  // Initialize service for sandbox environment
  async initializeForSandbox(): Promise<MoMoServiceResponse<boolean>> {
    try {
      if (this.config.targetEnvironment !== 'sandbox') {
        throw new MoMoError(
          ERROR_CODES.MOMO_SERVICE_UNAVAILABLE,
          'Sandbox initialization is only available in sandbox environment',
          { currentEnvironment: this.config.targetEnvironment },
          'initializeForSandbox'
        );
      }

      // Step 1: Create API User
      const userResponse = await this.createApiUser();
      if (!userResponse.success || !userResponse.data) {
        return {
          success: false,
          error: userResponse.error
        };
      }

      // Step 2: Create API Key
      const keyResponse = await this.createApiKey(userResponse.data);
      if (!keyResponse.success) {
        return {
          success: false,
          error: keyResponse.error
        };
      }

      // Step 3: Test token generation
      const tokenResponse = await this.getAccessToken();
      if (!tokenResponse.success) {
        return {
          success: false,
          error: tokenResponse.error
        };
      }

      return { success: true, data: true };
    } catch (error) {
      logError(error as Error, 'initializeForSandbox');
      
      if (error instanceof MoMoError) {
        return {
          success: false,
          error: error.toAppError()
        };
      }
      
      const momoError = handleMoMoApiError(error);
      return {
        success: false,
        error: momoError.toAppError()
      };
    }
  }

  // Load stored credentials
  private async loadStoredCredentials(): Promise<void> {
    try {
      const [apiUser, apiKey] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.MTN_MOMO_API_USER),
        SecureStore.getItemAsync(STORAGE_KEYS.MTN_MOMO_API_KEY),
      ]);

      if (apiUser) this.apiUser = apiUser;
      if (apiKey) this.apiKey = apiKey;
    } catch (error) {
      logError(error as Error, 'loadStoredCredentials');
      // Don't throw here as this is a private method used internally
      // The calling methods will handle missing credentials appropriately
    }
  }

  // Utility method to process payment with polling
  async processPayment(
    amount: string,
    phoneNumber: string,
    description: string,
    maxRetries: number = 5,
    pollDelayMs: number = 3000
  ): Promise<MoMoServiceResponse<MoMoTransactionStatusResponse>> {
    try {
      // Validate inputs
      validateInput('amount', amount, validators.amount, 'Please enter a valid amount between 0.01 and 100,000 GHS');
      validateInput('phoneNumber', phoneNumber, validators.phoneNumber, 'Please enter a valid Ghana phone number');
      validateInput('description', description, validators.description, 'Description cannot exceed 255 characters');

      // Create payment request
      const paymentRequest: MoMoPaymentRequest = {
        amount,
        currency: this.config.currency,
        externalId: uuidv4(),
        payer: {
          partyIdType: 'MSISDN',
          partyId: phoneNumber,
        },
        payerMessage: description,
        payeeNote: `Payment from ${this.config.targetEnvironment}`,
      };

      // Initiate payment
      const paymentResponse = await this.requestToPay(paymentRequest);
      if (!paymentResponse.success || !paymentResponse.data) {
        return {
          success: false,
          error: paymentResponse.error
        };
      }

      const referenceId = paymentResponse.data;

      // Poll for status
      let attempts = 0;
      while (attempts < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, pollDelayMs));

        const statusResponse = await this.getTransactionStatus(referenceId);
        if (!statusResponse.success) {
          attempts++;
          continue;
        }

        const status = statusResponse.data?.status;
        if (status === MoMoTransactionStatus.SUCCESSFUL || status === MoMoTransactionStatus.FAILED) {
          return statusResponse;
        }

        attempts++;
      }

      // Timeout
      throw new MoMoError(
        ERROR_CODES.API_TIMEOUT,
        'Transaction status polling timed out',
        { referenceId, attempts },
        'processPayment'
      );

    } catch (error) {
      logError(error as Error, 'processPayment');
      
      if (error instanceof MoMoError) {
        return {
          success: false,
          error: error.toAppError()
        };
      }

      const momoError = handleMoMoApiError(error);
      return {
        success: false,
        error: momoError.toAppError()
      };
    }
  }

  // Clean up stored credentials
  async clearCredentials(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(STORAGE_KEYS.MTN_MOMO_API_USER),
        SecureStore.deleteItemAsync(STORAGE_KEYS.MTN_MOMO_API_KEY),
      ]);
      
      this.apiUser = undefined;
      this.apiKey = undefined;
      this.accessToken = undefined;
      this.tokenExpiresAt = undefined;
    } catch (error) {
      logError(error as Error, 'clearCredentials');
      // Don't throw here as clearing credentials should be best-effort
      // Log the error but continue execution
    }
  }
}

export const mtnMomoService = new MtnMomoService();