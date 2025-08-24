import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get OneSignal App ID from environment variables
const ONESIGNAL_APP_ID = Constants.expoConfig?.extra?.oneSignalAppId || process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;

// Conditional import to avoid native module errors in Expo Go
let OneSignal: any;
let isOneSignalAvailable = false;

try {
  // Only import OneSignal if we're in a development build or production
  const { OneSignal: OneSignalImport } = require('react-native-onesignal');
  OneSignal = OneSignalImport;
  isOneSignalAvailable = true;
  
  // Log configuration status
  if (ONESIGNAL_APP_ID) {
    console.log('OneSignal: Configuration found, App ID available');
  } else {
    console.warn('OneSignal: App ID not configured in environment variables');
  }
} catch (error) {
  console.warn('OneSignal not available - running in Expo Go or missing native module:', error.message || error);
  // Create a mock OneSignal object for development
  OneSignal = {
    initialize: () => {},
    Notifications: {
      requestPermission: () => Promise.resolve(false),
      getPermissionAsync: () => Promise.resolve(false),
      addEventListener: () => {},
    },
    User: {
      pushSubscription: {
        addEventListener: () => {},
        optOut: () => Promise.resolve(),
        optIn: () => Promise.resolve(),
        getOptedIn: () => false,
      },
    },
    login: () => Promise.resolve(),
    logout: () => Promise.resolve(),
  };
  isOneSignalAvailable = false;
}

interface OneSignalConfig {
  appId: string;
  enabled: boolean;
}

interface NotificationPermissionResult {
  granted: boolean;
  denied: boolean;
  provisional: boolean;
}

interface DeviceRegistrationResult {
  success: boolean;
  playerId?: string;
  error?: string;
}

export class OneSignalService {
  private static instance: OneSignalService;
  private config: OneSignalConfig;
  private isInitialized = false;
  private playerId: string | null = null;

  private constructor() {
    // Use the centralized ONESIGNAL_APP_ID constant
    this.config = {
      appId: ONESIGNAL_APP_ID || '',
      enabled: isOneSignalAvailable && Boolean(ONESIGNAL_APP_ID), // Only enable if OneSignal is available and configured
    };
    
    // Log configuration status
    if (this.config.enabled) {
      console.log('OneSignalService: Initialized successfully with App ID');
    } else if (!isOneSignalAvailable) {
      console.warn('OneSignalService: OneSignal SDK not available (running in Expo Go?)');
    } else if (!ONESIGNAL_APP_ID) {
      console.warn('OneSignalService: App ID not configured - add EXPO_PUBLIC_ONESIGNAL_APP_ID to your .env file');
    }
  }

  static getInstance(): OneSignalService {
    if (!OneSignalService.instance) {
      OneSignalService.instance = new OneSignalService();
    }
    return OneSignalService.instance;
  }

  /**
   * Check if we're running in Expo Go environment
   */
  private isExpoGo(): boolean {
    return Constants.appOwnership === 'expo';
  }

  /**
   * Initialize OneSignal with app configuration
   */
  async initialize(userId?: string): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    if (!isOneSignalAvailable) {
      console.warn('OneSignal native module not available - running in Expo Go or missing dependency');
      return false;
    }

    if (!this.config.enabled) {
      console.warn('OneSignal not configured - notifications will be disabled');
      return false;
    }

    if (this.isExpoGo()) {
      console.warn('OneSignal not supported in Expo Go - use development build for push notifications');
      return false;
    }

    try {
      // Initialize OneSignal with app configuration
      OneSignal.initialize(this.config.appId);

      // Set up event listeners before requesting permissions
      this.setupEventListeners();

      // Request notification permissions
      const permissionResult = await this.requestPermissions();

      // Set external user ID if provided and permissions are granted
      if (userId && permissionResult.granted) {
        await this.setUserId(userId);
      }

      this.isInitialized = true;
      console.log('OneSignal initialized successfully', {
        appId: this.config.appId,
        permissionsGranted: permissionResult.granted
      });
      return true;

    } catch (error) {
      console.error('Failed to initialize OneSignal:', error);
      return false;
    }
  }

  /**
   * Request notification permissions from the user
   */
  async requestPermissions(): Promise<NotificationPermissionResult> {
    try {
      // Request notification permissions from OneSignal
      const result = await OneSignal.Notifications.requestPermission(true);
      
      console.log('OneSignal permission result:', result);
      
      return {
        granted: result === true,
        denied: result === false,
        provisional: false
      };

    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return {
        granted: false,
        denied: true,
        provisional: false
      };
    }
  }

  /**
   * Get current notification permission status
   */
  async getPermissionStatus(): Promise<NotificationPermissionResult> {
    try {
      // Check current notification permission status
      const hasPermission = await OneSignal.Notifications.getPermissionAsync();
      
      return {
        granted: hasPermission,
        denied: !hasPermission,
        provisional: false
      };

    } catch (error) {
      console.error('Error getting permission status:', error);
      return {
        granted: false,
        denied: true,
        provisional: false
      };
    }
  }

  /**
   * Set the external user ID for targeting notifications
   */
  async setUserId(userId: string): Promise<boolean> {
    if (!this.isInitialized) {
      console.warn('OneSignal not initialized - cannot set user ID');
      return false;
    }

    try {
      // Set external user ID for targeted notifications
      await OneSignal.login(userId);
      console.log('OneSignal user ID set successfully:', userId);
      return true;

    } catch (error) {
      console.error('Failed to set OneSignal user ID:', error);
      return false;
    }
  }

  /**
   * Remove the external user ID
   */
  async removeUserId(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      // Remove external user ID (logout)
      await OneSignal.logout();
      console.log('OneSignal user ID removed successfully');
      return true;

    } catch (error) {
      console.error('Failed to remove OneSignal user ID:', error);
      return false;
    }
  }

  /**
   * Get the OneSignal player ID for this device
   */
  getPlayerId(): Promise<string | null> {
    if (!this.isInitialized) {
      return Promise.resolve(null);
    }

    try {
      // Get the OneSignal player/subscription ID for this device
      // For OneSignal v5, we need to get the subscription ID differently
      return new Promise((resolve) => {
        OneSignal.User.pushSubscription.addEventListener('change', (event) => {
          const subscriptionId = event.current?.id;
          if (subscriptionId) {
            this.playerId = subscriptionId;
            resolve(subscriptionId);
          } else {
            resolve(null);
          }
        });
        
        // Try to get current subscription immediately
        const currentSubscription = OneSignal.User.pushSubscription;
        if (currentSubscription) {
          // Check if subscription has ID property through direct access
          const subscriptionId = (currentSubscription as any).id;
          if (subscriptionId) {
            this.playerId = subscriptionId;
            resolve(subscriptionId);
            return;
          }
        }
        
        // If no immediate subscription available, resolve with null
        setTimeout(() => resolve(null), 1000);
      });

    } catch (error) {
      console.error('Failed to get OneSignal player ID:', error);
      return Promise.resolve(null);
    }
  }

  /**
   * Register device for notifications and return registration data
   */
  async registerDevice(userId: string): Promise<DeviceRegistrationResult> {
    try {
      // Initialize if not already done
      if (!this.isInitialized) {
        const initialized = await this.initialize(userId);
        if (!initialized) {
          return {
            success: false,
            error: 'Failed to initialize OneSignal'
          };
        }
      }

      // Set user ID
      await this.setUserId(userId);

      // Get player ID
      const playerId = await this.getPlayerId();
      
      if (!playerId) {
        return {
          success: false,
          error: 'Failed to get device player ID'
        };
      }

      return {
        success: true,
        playerId
      };

    } catch (error) {
      console.error('Device registration failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown registration error'
      };
    }
  }

  /**
   * Send a test notification to verify setup
   */
  async sendTestNotification(): Promise<boolean> {
    if (!this.config.enabled) {
      console.log('OneSignal not configured - cannot send test notification');
      return false;
    }

    if (!this.isInitialized) {
      console.warn('OneSignal not initialized - cannot send test notification');
      return false;
    }

    try {
      // Test notifications should be sent through the backend API
      // This is handled by the alert service via API call
      console.log('Test notification request will be handled by backend API');
      return true;

    } catch (error) {
      console.error('Failed to send test notification:', error);
      return false;
    }
  }

  /**
   * Set up event listeners for notification events
   */
  private setupEventListeners(): void {
    try {
      // Listen for notification clicks
      OneSignal.Notifications.addEventListener('click', (event) => {
        console.log('OneSignal notification clicked:', event.notification);
        
        // Handle deep linking for budget alerts
        const notification = event.notification;
        const additionalData = notification.additionalData as Record<string, any> | undefined;
        if (additionalData?.alert_type && additionalData?.budget_id) {
          this.handleBudgetAlertNotification(notification);
        }
      });

      // Listen for notification received (when app is in foreground)
      OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
        console.log('OneSignal notification received in foreground:', event.notification);
        // Allow the notification to show by default
        event.preventDefault();
        event.notification.display();
      });

      // Listen for subscription changes
      OneSignal.User.pushSubscription.addEventListener('change', (event) => {
        console.log('OneSignal subscription changed:', event.current);
        
        // Update stored player ID
        const subscriptionId = event.current.id;
        if (subscriptionId) {
          this.playerId = subscriptionId;
        }
      });

      console.log('OneSignal event listeners set up successfully');

    } catch (error) {
      console.error('Failed to set up OneSignal event listeners:', error);
    }
  }

  /**
   * Handle budget alert notifications with specific logic
   */
  private handleBudgetAlertNotification(notification: any): void {
    const additionalData = notification.additionalData as Record<string, any> | undefined;
    const alertType = additionalData?.alert_type;
    const budgetId = additionalData?.budget_id;
    
    console.log('Budget alert notification clicked:', {
      type: alertType,
      budgetId,
      title: notification.title,
      body: notification.body
    });

    // Handle deep linking to budget detail screen
    if (budgetId) {
      this.handleNotificationDeepLink(`/budgets/${budgetId}/transactions`);
    }
  }

  /**
   * Handle deep linking from notifications
   */
  private handleNotificationDeepLink(deepLink: string): void {
    console.log('Handling notification deep link:', deepLink);
    
    try {
      // Import Expo Router for navigation (dynamic import to avoid circular dependencies)
      import('expo-router').then((router) => {
        router.router.push(deepLink as any);
        console.log('Navigated to:', deepLink);
      }).catch((error) => {
        console.error('Failed to navigate via deep link:', error);
      });
    } catch (error) {
      console.error('Deep link navigation error:', error);
    }
  }

  /**
   * Disable notifications
   */
  async disableNotifications(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      // Disable push notifications by opting out
      await OneSignal.User.pushSubscription.optOut();
      console.log('OneSignal notifications disabled successfully');
      return true;

    } catch (error) {
      console.error('Failed to disable notifications:', error);
      return false;
    }
  }

  /**
   * Enable notifications
   */
  async enableNotifications(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      // Enable push notifications by opting in
      await OneSignal.User.pushSubscription.optIn();
      console.log('OneSignal notifications enabled successfully');
      return true;

    } catch (error) {
      console.error('Failed to enable notifications:', error);
      return false;
    }
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      // Check if user is opted in for push notifications
      const isOptedIn = OneSignal.User.pushSubscription.getOptedIn();
      return isOptedIn;

    } catch (error) {
      console.error('Failed to check notification status:', error);
      return false;
    }
  }

  /**
   * Get OneSignal configuration info
   */
  getConfig(): OneSignalConfig {
    return { ...this.config };
  }

  /**
   * Check if OneSignal is properly configured
   */
  isConfigured(): boolean {
    return this.config.enabled;
  }
}

// Export singleton instance
export const oneSignalService = OneSignalService.getInstance();