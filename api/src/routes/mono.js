const express = require('express');
const router = express.Router();
const Account = require('../models/Account'); // Assuming Account model exists

// Exchange Mono code for Account ID
router.post('/exchange-token', async (req, res) => {
  try {
    const { code, userId } = req.body;

    if (!code || !userId) {
      return res.status(400).json({ error: 'Code and userId are required' });
    }

    const secretKey = process.env.MONO_SECRET_KEY;
    if (!secretKey) {
      console.error('MONO_SECRET_KEY is not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    console.log('Mono Exchange: Received code:', code);
    console.log('Mono Exchange: Secret Key loaded:', !!secretKey);

    // Exchange code for Account ID
    const response = await fetch('https://api.withmono.com/v2/accounts/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'mono-sec-key': secretKey,
      },
      body: JSON.stringify({ code }),
      redirect: 'error', // Fail on redirect
    });

    console.log('Mono API Response Status:', response.status);
    console.log('Mono API Response URL:', response.url);

    const text = await response.text();
    console.log('Mono API Response Body (first 100 chars):', text.substring(0, 100));

    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        throw new Error(`Failed to parse Mono API response: ${text.substring(0, 50)}...`);
    }

    if (!response.ok) {
      console.error('Mono API error:', data);
      return res.status(response.status).json({ 
        error: data.message || 'Failed to exchange token with Mono',
        details: data
      });
    }

    const accountId = data.id; // The persistent Mono Account ID

    // Create a new Account record in our DB
    // We might want to fetch account details first (name, balance, etc)
    // For now, let's just save the link. Ideally we fetch info.
    // Let's fetch the account info immediately.
    
    const infoResponse = await fetch(`https://api.withmono.com/v1/accounts/${accountId}`, {
        method: 'GET',
        headers: {
            'mono-sec-key': secretKey,
        }
    });
    
    const infoData = await infoResponse.json();
    const institution = infoData.institution; // { name, type, ... }
    
    // Check if account already exists for user
    let account = await Account.findOne({ 'monoAccountId': accountId });
    
    if (account) {
        return res.status(200).json({ success: true, message: 'Account already linked', data: account });
    }

    // Determine type
    const accountType = institution.type === 'MOMO' ? 'mobile_money' : 'bank';

    // Create new account
    const newAccount = new Account({
      userId,
      accountName: infoData.account.name || institution.name,
      accountType: accountType,
      balance: infoData.account.balance / 100, 
      institutionName: institution.name,
      // institutionLogo: institution.icon, // Schema doesn't have this yet, ignoring
      monoAccountId: accountId,
      lastSyncedAt: new Date(),
      isActive: true
    });

    await newAccount.save();

    res.status(200).json({ success: true, data: newAccount });

  } catch (error) {
    console.error('Error handling Mono exchange:', error);
    // console.error(error.response.data) if axios, but using fetch
    if (error instanceof Error) {
        res.status(500).json({ error: error.message, stack: error.stack });
    } else {
        res.status(500).json({ error: 'Unknown internal server error' });
    }
  }
});

module.exports = router;
