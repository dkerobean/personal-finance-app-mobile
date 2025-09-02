export default {
  expo: {
    name: "Kippo",
    slug: "kippo",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.kippo.app",
      infoPlist: {
        NSCameraUsageDescription: "This app needs access to camera to scan QR codes for bank account verification"
      }
    },
    android: {
      package: "com.kippo.app",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      permissions: ["android.permission.CAMERA"]
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
        "onesignal-expo-plugin",
        {
          mode: "development"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      oneSignalAppId: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID || "YOUR_ONESIGNAL_APP_ID",
      eas: {
        projectId: "cc382c54-3fc2-484f-b9f9-103579b6b013"
      }
    },
    newArchEnabled: true
  }
};