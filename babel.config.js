module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Note: react-native-reanimated plugin was moved to react-native-worklets
      // Since we're not directly using reanimated, this should resolve the warning
    ],
  };
};