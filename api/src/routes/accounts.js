const express = require('express');
const router = express.Router();
const { Account } = require('../models');

// GET /accounts - Get all accounts for a user
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const accounts = await Account.find({ 
      user_id: userId,
      is_active: true 
    }).sort({ created_at: -1 });

    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// GET /accounts/:id - Get account by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    const account = await Account.findOne({ _id: id, user_id: userId });
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json(account);
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
});

// POST /accounts - Create a new account
router.post('/', async (req, res) => {
  try {
    const { 
      userId, 
      account_name, 
      account_type, 
      institution_name, 
      balance,
      platform_source, 
      // ... other fields
    } = req.body;

    if (!userId || !account_name || !account_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newAccount = new Account({
      user_id: userId,
      account_name,
      account_type,
      institution_name,
      balance: balance || 0,
      platform_source,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    });

    await newAccount.save();
    res.status(201).json(newAccount);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// DELETE /accounts/:id - Soft delete account
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query; // Ensure ownership

    const account = await Account.findOneAndUpdate(
      { _id: id, user_id: userId },
      { is_active: false, updated_at: new Date() },
      { new: true }
    );

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// POST /accounts/link-momo - Link MTN MoMo account
router.post('/link-momo', async (req, res) => {
  try {
    const { userId, phone_number, account_name, balance } = req.body;

    if (!userId || !phone_number) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if account already exists
    const existingAccount = await Account.findOne({
      user_id: userId,
      'details.phone_number': phone_number,
      account_type: 'mobile_money',
      is_active: true
    });

    if (existingAccount) {
      return res.status(400).json({ error: 'This MoMo account is already linked' });
    }

    const newAccount = new Account({
      user_id: userId,
      account_name: account_name || `MTN MoMo (${phone_number})`,
      account_type: 'mobile_money',
      institution_name: 'MTN MoMo',
      balance: balance || 0,
      platform_source: 'manual', // or 'momo_api' if actually integrated
      is_active: true,
      details: {
        phone_number,
        provider: 'MTN'
      },
      created_at: new Date(),
      updated_at: new Date()
    });

    await newAccount.save();
    res.status(201).json({ account: newAccount });
  } catch (error) {
    console.error('Error linking MoMo account:', error);
    res.status(500).json({ error: 'Failed to link MoMo account' });
  }
});

module.exports = router;
