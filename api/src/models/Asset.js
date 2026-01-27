const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { 
      type: String, 
      enum: ['property', 'investments', 'cash', 'vehicles', 'personal', 'business', 'other'],
      required: true 
    },
    assetType: { 
      type: String, 
      enum: [
        'real_estate', 'land', 'rental_property',
        'stocks', 'bonds', 'mutual_funds', 'etf', 'cryptocurrency', 'retirement_account',
        'savings', 'checking', 'money_market', 'cd', 'foreign_currency',
        'car', 'motorcycle', 'boat', 'rv',
        'jewelry', 'art', 'collectibles', 'electronics',
        'business_equity', 'business_assets', 'intellectual_property',
        'other'
      ],
      required: true 
    },
    currentValue: { type: Number, required: true, min: 0 },
    originalValue: Number,
    purchaseDate: Date,
    description: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

assetSchema.index({ userId: 1, isActive: 1 });
assetSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Asset', assetSchema);
