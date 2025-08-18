// Using built-in matchers from @testing-library/react-native v12.4+

// Set up environment variables for tests
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.EXPO_PUBLIC_RESEND_API_KEY = 'test-resend-key';

// Increase timeout for tests to prevent memory issues
jest.setTimeout(30000);

// Configure Jest for better memory management
global.gc && global.gc();

// Mock problematic ES modules
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
}));

// Mock React Native core modules to prevent memory leaks
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
    Platform: {
      ...RN.Platform,
      OS: 'ios',
    },
    DevMenu: {
      reload: jest.fn(),
    },
    NativeModules: {
      ...RN.NativeModules,
      DevMenu: {
        reload: jest.fn(),
      },
    },
  };
});

// Mock Expo SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock Expo Router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: jest.fn(() => ({})),
  Link: ({ children }: { children: React.ReactNode }) => children,
  Stack: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
      verifyOtp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  })),
}));

// Helper functions for webhook tests
export const createMockRequest = (method: string, url: string, body?: any): Request => {
  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    requestInit.body = JSON.stringify(body);
  }

  return new Request(url, requestInit);
};

export const createMockResponse = (status: number, body?: any): Response => {
  const responseInit: ResponseInit = {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const responseBody = body ? JSON.stringify(body) : undefined;
  return new Response(responseBody, responseInit);
};

