module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/', '__tests__/setup.ts', '__tests__/utils.ts'],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|uuid)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  // Memory management settings
  maxWorkers: 2,
  logHeapUsage: true,
  detectOpenHandles: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};