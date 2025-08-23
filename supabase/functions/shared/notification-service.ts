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
    budget_id?: string;
    alert_type?: string;
    deep_link?: string;
  };
  url?: string;
  small_icon?: string;
  large_icon?: string;
}

interface ResendEmailRequest {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface NotificationDeliveryResult {
  success: boolean;
  notificationId?: string;
  emailId?: string;
  error?: string;
  recipients?: number;
  emailSent?: boolean;
  pushSent?: boolean;
}

export class NotificationService {
  private oneSignalAppId: string;
  private oneSignalApiKey: string;
  private oneSignalBaseUrl = 'https://onesignal.com/api/v1';
  private resendApiKey: string;
  private resendBaseUrl = 'https://api.resend.com';

  constructor() {
    this.oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID') || '';
    this.oneSignalApiKey = Deno.env.get('ONESIGNAL_API_KEY') || '';
    this.resendApiKey = Deno.env.get('RESEND_API_KEY') || '';

    if (!this.oneSignalAppId || !this.oneSignalApiKey) {
      console.warn('OneSignal credentials not configured. Push notifications will be simulated.');
    }
    
    if (!this.resendApiKey) {
      console.warn('RESEND API key not configured. Email notifications will be simulated.');
    }
  }

  /**
   * Send re-authentication notification to user with platform support
   */
  async sendReAuthNotification(
    userId: string,
    accountName: string,
    accountId: string,
    platformSource: 'mono' | 'mtn_momo'
  ): Promise<NotificationDeliveryResult> {
    try {
      const platformConfig = {
        mono: {
          title: 'Bank Account Re-authentication Required',
          message: `Your bank account "${accountName}" needs to be re-linked for automatic transaction syncing.`,
          deepLink: '/settings/bank-accounts',
          icon: 'ic_bank_auth'
        },
        mtn_momo: {
          title: 'MTN MoMo Re-authentication Required',
          message: `Your MTN MoMo account "${accountName}" needs to be re-linked for automatic transaction syncing.`,
          deepLink: '/settings/momo',
          icon: 'ic_momo_auth'
        }
      };

      const config = platformConfig[platformSource];
      
      const notification: OneSignalNotificationRequest = {
        app_id: this.oneSignalAppId,
        include_external_user_ids: [userId],
        headings: {
          en: config.title
        },
        contents: {
          en: config.message
        },
        data: {
          type: 'auth_required',
          action: 'relink_account',
          account_id: accountId,
          platform_source: platformSource,
          deep_link: config.deepLink
        },
        url: config.deepLink,
        small_icon: 'ic_notification',
        large_icon: config.icon
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
   * Send sync completion notification with platform support
   */
  async sendSyncCompletionNotification(
    userId: string,
    accountName: string,
    transactionCount: number,
    platformSource: 'mono' | 'mtn_momo'
  ): Promise<NotificationDeliveryResult> {
    try {
      if (transactionCount === 0) {
        // Don't send notification if no new transactions
        return { success: true, recipients: 0 };
      }

      const platformConfig = {
        mono: {
          title: 'Bank Transactions Synced',
          prefix: 'Bank',
          icon: 'ic_bank_sync_success'
        },
        mtn_momo: {
          title: 'MoMo Transactions Synced', 
          prefix: 'MoMo',
          icon: 'ic_momo_sync_success'
        }
      };

      const config = platformConfig[platformSource];

      const notification: OneSignalNotificationRequest = {
        app_id: this.oneSignalAppId,
        include_external_user_ids: [userId],
        headings: {
          en: config.title
        },
        contents: {
          en: `${config.prefix}: ${transactionCount} new transaction${transactionCount > 1 ? 's' : ''} synced from ${accountName}.`
        },
        data: {
          type: 'sync_completion',
          action: 'view_transactions',
          account_id: accountName,
          platform_source: platformSource,
          deep_link: '/transactions'
        },
        url: '/transactions', // Deep link to transactions list
        small_icon: 'ic_notification',
        large_icon: config.icon
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
   * Send bulk re-auth notifications for multiple accounts with platform support
   */
  async sendBulkReAuthNotifications(
    notifications: Array<{
      userId: string;
      accountName: string;
      accountId: string;
      platformSource: 'mono' | 'mtn_momo';
    }>
  ): Promise<NotificationDeliveryResult[]> {
    const results: NotificationDeliveryResult[] = [];

    // Send notifications in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      
      const batchPromises = batch.map(notif => 
        this.sendReAuthNotification(notif.userId, notif.accountName, notif.accountId, notif.platformSource)
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
   * Send email via RESEND API
   */
  private async sendEmail(emailRequest: ResendEmailRequest): Promise<{
    success: boolean;
    emailId?: string;
    error?: string;
  }> {
    if (!this.resendApiKey) {
      // Simulate email in development
      console.log('Simulating email (RESEND not configured):', emailRequest);
      return {
        success: true,
        emailId: `sim-email-${Date.now()}`
      };
    }

    try {
      const response = await fetch(`${this.resendBaseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`RESEND API error: ${response.status} ${errorData.message || response.statusText}`);
      }

      const responseData = await response.json();
      
      return {
        success: true,
        emailId: responseData.id
      };

    } catch (error) {
      console.error('RESEND email error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error'
      };
    }
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
      mono: {
        reauth: {
          title: 'Bank Account Re-authentication Required',
          message: 'Your bank account needs to be re-linked for automatic syncing.',
          action: 'Tap to re-link account',
          deepLink: '/settings/bank-accounts'
        },
        syncComplete: {
          title: 'Bank Transactions Synced',
          message: '{count} new bank transactions have been added to your account.',
          action: 'View transactions',
          deepLink: '/transactions'
        },
        syncError: {
          title: 'Bank Sync Error',
          message: 'There was an issue syncing your bank account.',
          action: 'Check account settings',
          deepLink: '/settings/bank-accounts'
        }
      },
      mtn_momo: {
        reauth: {
          title: 'MTN MoMo Re-authentication Required',
          message: 'Your MTN MoMo account needs to be re-linked for automatic syncing.',
          action: 'Tap to re-link account',
          deepLink: '/settings/momo'
        },
        syncComplete: {
          title: 'MoMo Transactions Synced',
          message: '{count} new MoMo transactions have been added to your account.',
          action: 'View transactions',
          deepLink: '/transactions'
        },
        syncError: {
          title: 'MoMo Sync Error',
          message: 'There was an issue syncing your MTN MoMo account.',
          action: 'Check account settings',
          deepLink: '/settings/momo'
        }
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

  /**
   * Send budget warning notification (90% threshold)
   * Supports both push notification and email
   */
  async sendBudgetWarningNotification(
    userId: string,
    budgetId: string,
    categoryName: string,
    spentAmount: number,
    budgetAmount: number,
    percentage: number,
    userEmail?: string,
    emailAlertsEnabled: boolean = true
  ): Promise<NotificationDeliveryResult> {
    try {
      // Send push notification
      const pushNotification: OneSignalNotificationRequest = {
        app_id: this.oneSignalAppId,
        include_external_user_ids: [userId],
        headings: {
          en: 'Budget Warning ⚠️'
        },
        contents: {
          en: `You've spent ₵${spentAmount.toFixed(2)} (${percentage.toFixed(0)}%) of your ₵${budgetAmount.toFixed(2)} budget for ${categoryName}. Consider monitoring your spending.`
        },
        data: {
          type: 'budget_alert',
          alert_type: 'warning',
          budget_id: budgetId,
          action: 'view_budget',
          deep_link: `/budgets/${budgetId}`
        },
        url: `/budgets/${budgetId}`,
        small_icon: 'ic_notification',
        large_icon: 'ic_budget_warning'
      };

      const pushResult = await this.sendNotification(pushNotification);
      let emailResult = { success: true, emailId: undefined };

      // Send email notification if enabled and email provided
      if (emailAlertsEnabled && userEmail) {
        const emailRequest: ResendEmailRequest = {
          from: 'Kippo Finance <alerts@kippo.com>',
          to: userEmail,
          subject: `Budget Warning: ${categoryName} - ${percentage.toFixed(0)}% Used`,
          html: this.generateBudgetWarningEmailHTML(categoryName, spentAmount, budgetAmount, percentage, budgetId),
          text: `Budget Warning: You've spent ₵${spentAmount.toFixed(2)} (${percentage.toFixed(0)}%) of your ₵${budgetAmount.toFixed(2)} budget for ${categoryName}. Consider monitoring your spending to stay within your limit.`
        };

        emailResult = await this.sendEmail(emailRequest);
      }

      return {
        success: pushResult.success || emailResult.success,
        notificationId: pushResult.notificationId,
        emailId: emailResult.emailId,
        error: !pushResult.success && !emailResult.success 
          ? `Push: ${pushResult.error}, Email: ${emailResult.error}` 
          : undefined,
        recipients: pushResult.recipients,
        pushSent: pushResult.success,
        emailSent: emailResult.success
      };

    } catch (error) {
      console.error('Failed to send budget warning notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown notification error',
        pushSent: false,
        emailSent: false
      };
    }
  }

  /**
   * Send budget exceeded notification (100%+ threshold)
   * Supports both push notification and email
   */
  async sendBudgetExceededNotification(
    userId: string,
    budgetId: string,
    categoryName: string,
    spentAmount: number,
    budgetAmount: number,
    overAmount: number,
    userEmail?: string,
    emailAlertsEnabled: boolean = true
  ): Promise<NotificationDeliveryResult> {
    try {
      // Send push notification
      const pushNotification: OneSignalNotificationRequest = {
        app_id: this.oneSignalAppId,
        include_external_user_ids: [userId],
        headings: {
          en: 'Budget Exceeded 🚨'
        },
        contents: {
          en: `You've exceeded your ₵${budgetAmount.toFixed(2)} budget for ${categoryName} by ₵${overAmount.toFixed(2)}. Total spent: ₵${spentAmount.toFixed(2)}.`
        },
        data: {
          type: 'budget_alert',
          alert_type: 'over_budget',
          budget_id: budgetId,
          action: 'view_budget',
          deep_link: `/budgets/${budgetId}`
        },
        url: `/budgets/${budgetId}`,
        small_icon: 'ic_notification',
        large_icon: 'ic_budget_exceeded'
      };

      const pushResult = await this.sendNotification(pushNotification);
      let emailResult = { success: true, emailId: undefined };

      // Send email notification if enabled and email provided
      if (emailAlertsEnabled && userEmail) {
        const emailRequest: ResendEmailRequest = {
          from: 'Kippo Finance <alerts@kippo.com>',
          to: userEmail,
          subject: `Budget Exceeded: ${categoryName} - Over by ₵${overAmount.toFixed(2)}`,
          html: this.generateBudgetExceededEmailHTML(categoryName, spentAmount, budgetAmount, overAmount, budgetId),
          text: `Budget Exceeded: You've exceeded your ₵${budgetAmount.toFixed(2)} budget for ${categoryName} by ₵${overAmount.toFixed(2)}. Total spent: ₵${spentAmount.toFixed(2)}. Consider reviewing your spending.`
        };

        emailResult = await this.sendEmail(emailRequest);
      }

      return {
        success: pushResult.success || emailResult.success,
        notificationId: pushResult.notificationId,
        emailId: emailResult.emailId,
        error: !pushResult.success && !emailResult.success 
          ? `Push: ${pushResult.error}, Email: ${emailResult.error}` 
          : undefined,
        recipients: pushResult.recipients,
        pushSent: pushResult.success,
        emailSent: emailResult.success
      };

    } catch (error) {
      console.error('Failed to send budget exceeded notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown notification error',
        pushSent: false,
        emailSent: false
      };
    }
  }

  /**
   * Send bulk budget alert notifications
   */
  async sendBulkBudgetAlerts(
    alerts: Array<{
      userId: string;
      budgetId: string;
      categoryName: string;
      spentAmount: number;
      budgetAmount: number;
      percentage: number;
      alertType: 'warning' | 'over_budget';
    }>
  ): Promise<NotificationDeliveryResult[]> {
    const results: NotificationDeliveryResult[] = [];

    // Send alerts in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < alerts.length; i += batchSize) {
      const batch = alerts.slice(i, i + batchSize);
      
      const batchPromises = batch.map(alert => {
        if (alert.alertType === 'warning') {
          return this.sendBudgetWarningNotification(
            alert.userId,
            alert.budgetId,
            alert.categoryName,
            alert.spentAmount,
            alert.budgetAmount,
            alert.percentage
          );
        } else {
          const overAmount = alert.spentAmount - alert.budgetAmount;
          return this.sendBudgetExceededNotification(
            alert.userId,
            alert.budgetId,
            alert.categoryName,
            alert.spentAmount,
            alert.budgetAmount,
            overAmount
          );
        }
      });
      
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
      if (i + batchSize < alerts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Generate budget warning email HTML
   */
  private generateBudgetWarningEmailHTML(
    categoryName: string,
    spentAmount: number,
    budgetAmount: number,
    percentage: number,
    budgetId: string
  ): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Budget Warning</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #ffffff;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        .warning-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .content {
            padding: 40px 30px;
        }
        .alert-summary {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .budget-stats {
            background-color: #f1f5f9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .stat-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 16px;
        }
        .stat-label {
            font-weight: 600;
            color: #374151;
        }
        .stat-value {
            color: #111827;
        }
        .progress-bar {
            background-color: #e5e7eb;
            height: 12px;
            border-radius: 6px;
            overflow: hidden;
            margin: 15px 0;
        }
        .progress-fill {
            background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
            height: 100%;
            width: ${Math.min(percentage, 100)}%;
            transition: width 0.3s ease;
        }
        .button {
            display: inline-block;
            background-color: #f59e0b;
            color: #ffffff;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        .footer {
            background-color: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            margin: 5px 0;
            font-size: 14px;
            color: #64748b;
        }
        @media (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            .content, .header, .footer {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="warning-icon">⚠️</div>
            <h1>Budget Warning</h1>
        </div>
        
        <div class="content">
            <div class="alert-summary">
                <p><strong>You're approaching your budget limit for ${categoryName}!</strong></p>
                <p>You've spent ${percentage.toFixed(0)}% of your monthly budget. Consider monitoring your spending to stay within your limit.</p>
            </div>
            
            <div class="budget-stats">
                <div class="stat-row">
                    <span class="stat-label">Category:</span>
                    <span class="stat-value">${categoryName}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Budget Amount:</span>
                    <span class="stat-value">₵${budgetAmount.toFixed(2)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Amount Spent:</span>
                    <span class="stat-value">₵${spentAmount.toFixed(2)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Remaining:</span>
                    <span class="stat-value">₵${(budgetAmount - spentAmount).toFixed(2)}</span>
                </div>
                
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <p style="text-align: center; margin-top: 10px; font-weight: 600; color: #f59e0b;">
                    ${percentage.toFixed(0)}% Used
                </p>
            </div>
            
            <p>To help manage your spending:</p>
            <ul>
                <li>Review your recent transactions in this category</li>
                <li>Consider adjusting your budget if needed</li>
                <li>Look for ways to reduce spending in ${categoryName}</li>
            </ul>
            
            <div style="text-align: center;">
                <a href="kippo://budgets/${budgetId}" class="button">View Budget Details</a>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Kippo Finance</strong></p>
            <p>This is an automated budget alert. You can adjust your notification preferences in the app.</p>
            <p>© ${new Date().getFullYear()} Kippo. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate budget exceeded email HTML
   */
  private generateBudgetExceededEmailHTML(
    categoryName: string,
    spentAmount: number,
    budgetAmount: number,
    overAmount: number,
    budgetId: string
  ): string {
    const percentage = (spentAmount / budgetAmount) * 100;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Budget Exceeded</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: #ffffff;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        .alert-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .content {
            padding: 40px 30px;
        }
        .alert-summary {
            background-color: #fee2e2;
            border-left: 4px solid #dc2626;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .budget-stats {
            background-color: #f1f5f9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .stat-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 16px;
        }
        .stat-label {
            font-weight: 600;
            color: #374151;
        }
        .stat-value {
            color: #111827;
        }
        .over-amount {
            color: #dc2626;
            font-weight: bold;
        }
        .progress-bar {
            background-color: #e5e7eb;
            height: 12px;
            border-radius: 6px;
            overflow: hidden;
            margin: 15px 0;
            position: relative;
        }
        .progress-fill {
            background: linear-gradient(90deg, #dc2626 0%, #b91c1c 100%);
            height: 100%;
            width: 100%;
        }
        .progress-overflow {
            position: absolute;
            top: 0;
            right: 0;
            height: 100%;
            background: repeating-linear-gradient(
                45deg,
                #dc2626,
                #dc2626 4px,
                #b91c1c 4px,
                #b91c1c 8px
            );
            width: ${Math.min((percentage - 100) / percentage * 100, 30)}%;
        }
        .button {
            display: inline-block;
            background-color: #dc2626;
            color: #ffffff;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        .footer {
            background-color: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            margin: 5px 0;
            font-size: 14px;
            color: #64748b;
        }
        @media (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            .content, .header, .footer {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="alert-icon">🚨</div>
            <h1>Budget Exceeded</h1>
        </div>
        
        <div class="content">
            <div class="alert-summary">
                <p><strong>You've exceeded your budget limit for ${categoryName}!</strong></p>
                <p>You've spent ₵${overAmount.toFixed(2)} more than your monthly budget of ₵${budgetAmount.toFixed(2)}.</p>
            </div>
            
            <div class="budget-stats">
                <div class="stat-row">
                    <span class="stat-label">Category:</span>
                    <span class="stat-value">${categoryName}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Budget Amount:</span>
                    <span class="stat-value">₵${budgetAmount.toFixed(2)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Amount Spent:</span>
                    <span class="stat-value">₵${spentAmount.toFixed(2)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Over Budget:</span>
                    <span class="stat-value over-amount">₵${overAmount.toFixed(2)}</span>
                </div>
                
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                    <div class="progress-overflow"></div>
                </div>
                <p style="text-align: center; margin-top: 10px; font-weight: 600; color: #dc2626;">
                    ${percentage.toFixed(0)}% Used
                </p>
            </div>
            
            <p>Consider taking these actions:</p>
            <ul>
                <li>Review your recent transactions to understand the overspending</li>
                <li>Adjust your budget for next month if this was a one-time expense</li>
                <li>Look for opportunities to reduce spending in other categories</li>
                <li>Set up spending alerts to prevent future overages</li>
            </ul>
            
            <div style="text-align: center;">
                <a href="kippo://budgets/${budgetId}" class="button">Review Budget</a>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Kippo Finance</strong></p>
            <p>This is an automated budget alert. You can adjust your notification preferences in the app.</p>
            <p>© ${new Date().getFullYear()} Kippo. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Get budget alert notification templates
   */
  getBudgetAlertTemplates() {
    return {
      warning: {
        title: 'Budget Warning ⚠️',
        message: 'You\'ve spent {percentage}% of your {budget_amount} budget for {category_name}. Consider monitoring your spending.',
        action: 'View Budget Details',
        deepLink: '/budgets/{budget_id}'
      },
      over_budget: {
        title: 'Budget Exceeded 🚨',
        message: 'You\'ve exceeded your {budget_amount} budget for {category_name} by {over_amount}. Total spent: {spent_amount}.',
        action: 'Review Budget',
        deepLink: '/budgets/{budget_id}'
      }
    };
  }
}