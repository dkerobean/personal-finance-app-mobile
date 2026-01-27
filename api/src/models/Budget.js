const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    amount: { type: Number, required: true, min: 0 },
    month: { type: String, required: true, match: /^\d{4}-\d{2}-01$/ }, // YYYY-MM-01
  },
  { timestamps: true }
);

budgetSchema.index({ userId: 1, categoryId: 1, month: 1 }, { unique: true });
budgetSchema.index({ userId: 1, month: 1 });

module.exports = mongoose.model('Budget', budgetSchema);
