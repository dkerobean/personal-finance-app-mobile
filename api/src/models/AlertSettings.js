const mongoose = require('mongoose');

const alertSettingsSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    budgetAlertsEnabled: { type: Boolean, default: true },
    warningThreshold: { type: Number, default: 90, min: 0, max: 100 },
    overBudgetAlertsEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AlertSettings', alertSettingsSchema);
