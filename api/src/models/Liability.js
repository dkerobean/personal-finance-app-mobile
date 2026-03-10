const mongoose = require('mongoose');

const liabilitySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { 
      type: String, 
      enum: ['loans', 'credit_cards', 'mortgages', 'business_debt', 'other'],
      required: true 
    },
    liabilityType: { 
      type: String, 
      enum: [
        'mortgage', 'auto_loan', 'personal_loan', 'credit_card', 'student_loan', 'business_loan',
        'overdraft', 'payday_loan', 'buy_now_pay_later', 'medical_debt', 'tax_debt', 'utility_bill',
        'line_of_credit', 'margin_loan', 'family_loan', 'home_equity_loan', 'vendor_payable', 'legal_obligation',
        'other'
      ],
      required: true 
    },
    currentBalance: { type: Number, required: true, min: 0 },
    customCategory: { type: String, trim: true, maxlength: 80 },
    customType: { type: String, trim: true, maxlength: 80 },
    originalBalance: Number,
    interestRate: { type: Number, min: 0, max: 100 },
    monthlyPayment: { type: Number, min: 0 },
    dueDate: Date,
    description: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

liabilitySchema.index({ userId: 1, isActive: 1 });
liabilitySchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Liability', liabilitySchema);
