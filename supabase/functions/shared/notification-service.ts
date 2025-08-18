interface OneSignalNotificationRequest {
  app_id: string;
  include_external_user_ids?: string[];
  include_player_ids?: string[];
  contents: {
    en: string;
  };
  headings?: {
    en: string;
  };
  data?: {
    type: string;
    action?: string;
    account_id?: string;
    deep_link?: string;
  };
  url?: string;
  small_icon?: string;
  large_icon?: string;
}

interface NotificationDeliveryResult {
  success: boolean;
  notificationId?: string;
  error?: string;
  recipients?: number;
}

export class NotificationService {
  private oneSignalAppId: string;
  private oneSignalApiKey: string;
  private oneSignalBaseUrl = 'https://onesignal.com/api/v1';

  constructor() {
    this.oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID') || '';
    this.oneSignalApiKey = Deno.env.get('ONESIGNAL_API_KEY') || '';

    if (!this.oneSignalAppId || !this.oneSignalApiKey) {
      console.warn('OneSignal credentials not configured. Notifications will be simulated.');
    }
  }

  /**
   * Send re-authentication notification to user
   */
  async sendReAuthNotification(
    userId: string,
    accountName: string,
    phoneNumber: string
  ): Promise<NotificationDeliveryResult> {
    try {
      const notification: OneSignalNotificationRequest = {
        app_id: this.oneSignalAppId,
        include_external_user_ids: [userId],
        headings: {
          en: 'Account Re-authentication Required'
        },
        contents: {
          en: `Your MTN MoMo account "${accountName}" (${phoneNumber}) needs to be re-linked for automatic transaction syncing.`
        },
        data: {
          type: 'auth_required',
          action: 'relink_account',
          account_id: phoneNumber,
          deep_link: '/settings/momo'
        },
        url: '/settings/momo', // Deep link to account management
        small_icon: 'ic_notification',
        large_icon: 'ic_momo_auth'
      };

      return await this.sendNotification(notification);

    } catch (error) {
      console.error('Failed to send re-auth notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown notification error'
      };
    }
  }

  /**
   * Send sync completion notification
   */
  async sendSyncCompletionNotification(
    userId: string,
    accountName: string,
    transactionCount: number
  ): Promise<NotificationDeliveryResult> {
    try {
      if (transactionCount === 0) {
        // Don't send notification if no new transactions
        return { success: true, recipients: 0 };
      }

      const notification: OneSignalNotificationRequest = {
        app_id: this.oneSignalAppId,
        include_external_user_ids: [userId],
        headings: {
          en: 'New Transactions Synced'
        },
        contents: {
          en: `${transactionCount} new transaction${transactionCount > 1 ? 's' : ''} synced from ${accountName}.`
        },
        data: {
          type: 'sync_completion',
          action: 'view_transactions',
          account_id: accountName,
          deep_link: '/transactions'
        },
        url: '/transactions', // Deep link to transactions list
        small_icon: 'ic_notification',
        large_icon: 'ic_sync_success'
      };

      return await this.sendNotification(notification);

    } catch (error) {
      console.error('Failed to send sync completion notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown notification error'
      };
    }
  }

  /**
   * Send sync error notification to admins/developers
   */
  async sendSyncErrorNotification(
    errorMessage: string,
    accountId: string,
    userId: string
  ): Promise<NotificationDeliveryResult> {
    try {
      // This would typically be sent to admin/developer channel
      // For now, we'll just log it
      console.error('Sync error notification:', {
        error: errorMessage,
        accountId,
        userId,
        timestamp: new Date().toISOString()
      });

      return { success: true, recipients: 0 };

    } catch (error) {
      console.error('Failed to send sync error notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown notification error'
      };
    }
  }

  /**
   * Send bulk re-auth notifications for multiple accounts
   */
  async sendBulkReAuthNotifications(
    notifications: Array<{
      userId: string;
      accountName: string;
      phoneNumber: string;
    }>
  ): Promise<NotificationDeliveryResult[]> {
    const results: NotificationDeliveryResult[] = [];

    // Send notifications in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      
      const batchPromises = batch.map(notif => 
        this.sendReAuthNotification(notif.userId, notif.accountName, notif.phoneNumber)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
          });
        }
      });

      // Add delay between batches
      if (i + batchSize < notifications.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Core notification sending logic
   */
  private async sendNotification(
    notification: OneSignalNotificationRequest
  ): Promise<NotificationDeliveryResult> {
    if (!this.oneSignalAppId || !this.oneSignalApiKey) {
      // Simulate notification in development
      console.log('Simulating notification (OneSignal not configured):', notification);
      return {
        success: true,
        notificationId: `sim-${Date.now()}`,
        recipients: 1
      };
    }

    try {
      const response = await fetch(`${this.oneSignalBaseUrl}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.oneSignalApiKey}`,
        },
        body: JSON.stringify(notification),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OneSignal API error: ${response.status} ${errorData.errors || response.statusText}`);
      }

      const responseData = await response.json();
      
      return {
        success: true,
        notificationId: responseData.id,
        recipients: responseData.recipients || 0
      };

    } catch (error) {
      console.error('OneSignal notification error:', error);
      
      // Try to retry once for transient failures
      if (error instanceof Error && (
        error.message.includes('network') || 
        error.message.includes('timeout') ||
        error.message.includes('503') ||
        error.message.includes('502')
      )) {
        console.log('Retrying notification after transient error...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          const retryResponse = await fetch(`${this.oneSignalBaseUrl}/notifications`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${this.oneSignalApiKey}`,
            },
            body: JSON.stringify(notification),
          });

          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            return {
              success: true,
              notificationId: retryData.id,
              recipients: retryData.recipients || 0
            };
          }
        } catch (retryError) {
          console.error('Notification retry also failed:', retryError);
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown notification error'
      };
    }
  }

  /**
   * Create notification templates for different scenarios
   */
  getNotificationTemplates() {
    return {
      reauth: {
        title: 'Account Re-authentication Required',
        message: 'Your MTN MoMo account needs to be re-linked for automatic syncing.',
        action: 'Tap to re-link account',
        deepLink: '/settings/momo'
      },
      syncComplete: {
        title: 'New Transactions Synced',
        message: '{count} new transactions have been added to your account.',
        action: 'View transactions',
        deepLink: '/transactions'
      },
      syncError: {
        title: 'Sync Error',
        message: 'There was an issue syncing your MTN MoMo account.',
        action: 'Check account settings',
        deepLink: '/settings/momo'
      }
    };
  }

  /**
   * Test notification connectivity
   */
  async testNotificationDelivery(userId: string): Promise<NotificationDeliveryResult> {
    const testNotification: OneSignalNotificationRequest = {
      app_id: this.oneSignalAppId,
      include_external_user_ids: [userId],
      headings: {
        en: 'Test Notification'
      },
      contents: {
        en: 'This is a test notification from Kippo Finance App.'
      },
      data: {
        type: 'test',
      }
    };

    return await this.sendNotification(testNotification);
  }
}