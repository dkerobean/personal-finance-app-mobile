import { supabase } from '@/services/supabaseClient';
import type { Transaction } from '@/types/models';

interface AlertProcessingOptions {
  userId?: string;
  budgetId?: string;
  transactionId?: string;
  delayMs?: number; // Delay before processing to batch multiple rapid changes
}

class AlertProcessingService {
  private processingQueue = new Map<string, ReturnType<typeof setTimeout>>();

  /**
   * Trigger alert processing for transaction-related changes
   */
  async triggerAlertProcessing(options: AlertProcessingOptions = {}): Promise<void> {
    const { userId, budgetId, transactionId, delayMs = 5000 } = options;

    // Create a key for batching similar requests
    const queueKey = budgetId || userId || 'global';

    // Clear any existing timeout for this key
    if (this.processingQueue.has(queueKey)) {
      clearTimeout(this.processingQueue.get(queueKey)!);
    }

    // Set a new timeout to process alerts after the delay
    const timeoutId = setTimeout(async () => {
      try {
        await this.processAlerts({
          userId,
          budgetId,
          transactionId
        });
      } catch (error) {
        console.error('Alert processing failed:', error);
      } finally {
        this.processingQueue.delete(queueKey);
      }
    }, delayMs);

    this.processingQueue.set(queueKey, timeoutId);
  }

  /**
   * Trigger alert processing after transaction creation
   */
  async onTransactionCreated(transaction: Transaction): Promise<void> {
    if (transaction.type === 'expense') {
      await this.triggerAlertProcessing({
        userId: transaction.user_id,
        transactionId: transaction.id
      });
    }
  }

  /**
   * Trigger alert processing after transaction update
   */
  async onTransactionUpdated(
    transactionId: string, 
    oldTransaction: Transaction, 
    newTransaction: Transaction
  ): Promise<void> {
    // Check if the update affects budget calculations
    const affectsBudget = 
      oldTransaction.amount !== newTransaction.amount ||
      oldTransaction.type !== newTransaction.type ||
      oldTransaction.category_id !== newTransaction.category_id ||
      oldTransaction.transaction_date !== newTransaction.transaction_date;

    if (affectsBudget) {
      await this.triggerAlertProcessing({
        userId: newTransaction.user_id,
        transactionId: transactionId
      });
    }
  }

  /**
   * Trigger alert processing after transaction deletion
   */
  async onTransactionDeleted(transaction: Transaction): Promise<void> {
    if (transaction.type === 'expense') {
      await this.triggerAlertProcessing({
        userId: transaction.user_id,
        transactionId: transaction.id
      });
    }
  }

  /**
   * Trigger alert processing for bulk operations
   */
  async onBulkTransactionChanges(userId: string, affectedCategoryIds: string[]): Promise<void> {
    await this.triggerAlertProcessing({
      userId,
      delayMs: 10000 // Longer delay for bulk operations
    });
  }

  /**
   * Process alerts by calling the budget-alerts Edge Function
   */
  private async processAlerts(options: {
    userId?: string;
    budgetId?: string;
    transactionId?: string;
  }): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('budget-alerts', {
        body: {
          type: 'transaction_change',
          user_id: options.userId,
          budget_id: options.budgetId,
          transaction_id: options.transactionId
        }
      });

      if (error) {
        console.error('Alert processing error:', error);
        return;
      }

      const result = data;
      if (result && !result.success) {
        console.error('Alert processing failed:', result.errors);
      } else if (result) {
        console.log(`Alert processing completed: ${result.alerts_sent} alerts sent`);
      }

    } catch (error) {
      console.error('Failed to trigger alert processing:', error);
    }
  }

  /**
   * Process alerts for a specific budget immediately (no delay)
   */
  async processAlertsForBudget(budgetId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('budget-alerts', {
        body: {
          type: 'manual_check',
          budget_id: budgetId,
          force_check: true
        }
      });

      if (error) {
        console.error('Manual alert processing error:', error);
        return false;
      }

      return data?.success || false;
    } catch (error) {
      console.error('Failed to process alerts for budget:', error);
      return false;
    }
  }

  /**
   * Clean up any pending alert processing
   */
  cleanup(): void {
    for (const timeoutId of this.processingQueue.values()) {
      clearTimeout(timeoutId);
    }
    this.processingQueue.clear();
  }
}

// Export singleton instance
export const alertProcessingService = new AlertProcessingService();