const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add explicit resolver configuration to handle undefined paths
config.resolver = {
  ...config.resolver,
  alias: {
    '@': path.resolve(__dirname, 'src'),
  },
  // Ensure all extensions are handled properly
  sourceExts: [...(config.resolver?.sourceExts || []), 'jsx', 'js', 'ts', 'tsx', 'json'],
  // Add fallback for undefined paths
  resolverMainFields: ['react-native', 'browser', 'main'],
};

module.exports = config;