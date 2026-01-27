const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    userId: { type: String, default: null, index: true }, // null for system categories
    name: { type: String, required: true, trim: true },
    iconName: { type: String, required: true, default: 'help-circle' },
  },
  { timestamps: true }
);

categorySchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
