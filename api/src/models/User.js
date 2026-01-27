const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    clerkId: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,
      trim: true
    },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    avatarUrl: String,
    mobileNumber: { type: String, trim: true },
    emailConfirmed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
