const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    transactionDate: { type: Date, required: true, index: true },
    description: String,
    // Platform-specific
    monoTransactionId: { type: String, sparse: true },
    mtnReferenceId: { type: String, sparse: true },
    momoExternalId: { type: String, sparse: true },
    momoTransactionId: { type: String, sparse: true },
    momoReferenceId: { type: String, sparse: true },
    momoStatus: { type: String, default: 'PENDING' },
    momoPayerInfo: mongoose.Schema.Types.Mixed,
    momoFinancialTransactionId: String,
    merchantName: String,
    location: String,
    institutionName: String,
    isSynced: { type: Boolean, default: false },
    isAutoCategorized: { type: Boolean, default: false },
    categorizationConfidence: Number,
    syncLogId: { type: mongoose.Schema.Types.ObjectId, ref: 'TransactionSyncLog' },
    platformSource: { type: String, enum: ['mono', 'mtn_momo', 'manual'], default: 'manual' },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, transactionDate: -1 });
transactionSchema.index({ userId: 1, categoryId: 1 });
transactionSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
