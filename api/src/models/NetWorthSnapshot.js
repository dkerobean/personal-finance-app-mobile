const mongoose = require('mongoose');

const netWorthSnapshotSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  totalAssets: {
    type: Number,
    required: true
  },
  totalLiabilities: {
    type: Number,
    required: true
  },
  netWorth: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'GHS'
  },
  breakdown: {
    assets: mongoose.Schema.Types.Mixed,
    liabilities: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying by date range
netWorthSnapshotSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('NetWorthSnapshot', netWorthSnapshotSchema);
