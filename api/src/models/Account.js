const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    accountName: { type: String, required: true, trim: true },
    accountType: { type: String, enum: ['bank', 'mobile_money'], required: true },
    institutionName: { type: String, required: true, trim: true },
    balance: { type: Number, default: 0 },
    monoAccountId: { type: String, sparse: true },
    mtnReferenceId: { type: String, sparse: true },
    mtnPhoneNumber: String,
    lastSyncedAt: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

accountSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Account', accountSchema);
