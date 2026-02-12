const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    type: { 
      type: String, 
      enum: [
        'budget_alert', 
        'budget_exceeded', 
        'low_balance', 
        'large_transaction', 
        'savings_goal', 
        'net_worth_milestone',
        'bill_reminder',
        'weekly_summary',
        'system'
      ],
      required: true 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: mongoose.Schema.Types.Mixed, // Additional context (e.g., budgetId, amount)
    isRead: { type: Boolean, default: false },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high'], 
      default: 'medium' 
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
