const express = require('express');
const router = express.Router();
const { User } = require('../models');

// Sync user from Clerk
router.post('/sync', async (req, res) => {
  try {
    const { clerkId, email, firstName, lastName } = req.body;
    
    if (!clerkId || !email) {
      return res.status(400).json({ error: 'clerkId and email are required' });
    }

    const emailLower = email.toLowerCase();

    // Try to find user by clerkId or email
    let user = await User.findOne({
      $or: [{ clerkId }, { email: emailLower }]
    });

    if (user) {
      // Update existing user
      user.clerkId = clerkId;
      user.email = emailLower;
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.emailConfirmed = true;
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        clerkId,
        email: emailLower,
        firstName,
        lastName,
        emailConfirmed: true
      });
    }

    res.json({ data: user });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user by Clerk ID
router.get('/:clerkId', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.params.clerkId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.patch('/:clerkId', async (req, res) => {
  try {
    const { firstName, lastName, avatarUrl, mobileNumber } = req.body;
    
    const user = await User.findOneAndUpdate(
      { clerkId: req.params.clerkId },
      { firstName, lastName, avatarUrl, mobileNumber },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ data: user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/:clerkId', async (req, res) => {
  try {
    await User.findOneAndDelete({ clerkId: req.params.clerkId });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
