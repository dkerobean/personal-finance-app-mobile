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
        'primary_home', 'real_estate', 'land', 'rental_property', 'commercial_property',
        'stocks', 'bonds', 'mutual_funds', 'etf', 'cryptocurrency', 'retirement_account', 'treasury_bill', 'pension_fund', 'brokerage_account', 'reits', 'private_equity',
        'savings', 'checking', 'money_market', 'cd', 'foreign_currency', 'mobile_money_wallet', 'emergency_fund', 'fixed_deposit', 'cash_on_hand',
        'car', 'motorcycle', 'boat', 'rv', 'commercial_vehicle',
        'jewelry', 'art', 'collectibles', 'electronics', 'precious_metals',
        'business_equity', 'business_assets', 'intellectual_property', 'inventory', 'accounts_receivable', 'equipment',
        'other'
      ],
      required: true 
    },
    currentValue: { type: Number, required: true, min: 0 },
    customCategory: { type: String, trim: true, maxlength: 80 },
    customType: { type: String, trim: true, maxlength: 80 },
    originalValue: Number,
    purchaseDate: Date,
    valuationMethod: {
      type: String,
      enum: ['manual', 'market', 'appraisal'],
      default: 'manual',
    },
    tickerSymbol: { type: String, trim: true, uppercase: true, maxlength: 20 },
    unitsHeld: { type: Number, min: 0 },
    unitPrice: { type: Number, min: 0 },
    lastValuationDate: Date,
    description: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

assetSchema.index({ userId: 1, isActive: 1 });
assetSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Asset', assetSchema);
