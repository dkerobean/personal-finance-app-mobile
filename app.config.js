export default {
  expo: {
    name: "Kippo",
    slug: "kippo",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      backgroundColor: "#006D4F",
      resizeMode: "contain"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.kippo.app",
      buildNumber: "1",
      config: {
        usesNonExemptEncryption: false
      }
    },
    android: {
      package: "com.kippo.app",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      permissions: []
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    scheme: "kippo",
    plugins: [
      "expo-router",
      "expo-secure-store",
      [
        "expo-build-properties",
        {
          ios: {
            deploymentTarget: "15.1"
          }
        }
      ],
      [
        "onesignal-expo-plugin",
        {
          mode: process.env.EAS_BUILD_PROFILE === "production" ? "production" : "development"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      oneSignalAppId: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID,
      clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      monoAppId: process.env.EXPO_PUBLIC_MONO_APP_ID,
      monoPublicKey: process.env.EXPO_PUBLIC_MONO_PUBLIC_KEY,
      eas: {
        projectId: "cc382c54-3fc2-484f-b9f9-103579b6b013"
      }
    },
    newArchEnabled: true
  }
};
