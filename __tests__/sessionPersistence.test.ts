import { secureStorage } from '@/lib/storage';
import { STORAGE_KEYS } from '@/lib/constants';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock console to avoid warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

describe('Session Persistence', () => {
  const mockSecureStore = require('expo-secure-store');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('secureStorage', () => {
    it('should store session data correctly', async () => {
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';

      await secureStorage.storeSession(accessToken, refreshToken);

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        STORAGE_KEYS.AUTH_TOKEN,
        accessToken
      );
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        STORAGE_KEYS.REFRESH_TOKEN,
        refreshToken
      );
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        STORAGE_KEYS.SESSION_CREATED_AT,
        expect.any(String)
      );
    });

    it('should retrieve stored session data', async () => {
      const mockAccessToken = 'stored-access-token';
      const mockRefreshToken = 'stored-refresh-token';
      const mockCreatedAt = '1640995200000'; // Mock timestamp

      mockSecureStore.getItemAsync
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken)
        .mockResolvedValueOnce(mockCreatedAt);

      const result = await secureStorage.getStoredSession();

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        createdAt: parseInt(mockCreatedAt, 10),
      });
    });

    it('should validate storage integrity', async () => {
      // Test case: token exists but no creation timestamp
      mockSecureStore.getItemAsync
        .mockResolvedValueOnce('some-token')
        .mockResolvedValueOnce('some-refresh-token')
        .mockResolvedValueOnce(null);

      const result = await secureStorage.validateStorageIntegrity();

      expect(result).toBe(false);
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(STORAGE_KEYS.AUTH_TOKEN);
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(STORAGE_KEYS.REFRESH_TOKEN);
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(STORAGE_KEYS.SESSION_CREATED_AT);
    });

    it('should detect old tokens and clear them', async () => {
      const oldTimestamp = (Date.now() - 8 * 24 * 60 * 60 * 1000).toString(); // 8 days ago

      mockSecureStore.getItemAsync
        .mockResolvedValueOnce('some-token')
        .mockResolvedValueOnce('some-refresh-token')
        .mockResolvedValueOnce(oldTimestamp);

      const result = await secureStorage.validateStorageIntegrity();

      expect(result).toBe(false);
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledTimes(3);
    });

    it('should pass integrity check for valid data', async () => {
      const recentTimestamp = (Date.now() - 60 * 60 * 1000).toString(); // 1 hour ago

      mockSecureStore.getItemAsync
        .mockResolvedValueOnce('valid-token')
        .mockResolvedValueOnce('valid-refresh-token')
        .mockResolvedValueOnce(recentTimestamp);

      const result = await secureStorage.validateStorageIntegrity();

      expect(result).toBe(true);
      expect(mockSecureStore.deleteItemAsync).not.toHaveBeenCalled();
    });

    it('should clear auth data without affecting other data', async () => {
      await secureStorage.clearAuthData();

      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(STORAGE_KEYS.AUTH_TOKEN);
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(STORAGE_KEYS.REFRESH_TOKEN);
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(STORAGE_KEYS.SESSION_CREATED_AT);
      expect(mockSecureStore.deleteItemAsync).not.toHaveBeenCalledWith(STORAGE_KEYS.ONBOARDING_COMPLETED);
    });
  });
});