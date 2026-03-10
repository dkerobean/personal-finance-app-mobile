const express = require('express');
const router = express.Router();
const NetWorthSnapshot = require('../models/NetWorthSnapshot');
const Asset = require('../models/Asset');
const Liability = require('../models/Liability');
const Account = require('../models/Account');
const { calculateNetWorthSummary } = require('../services/netWorthCalculator');

// GET /api/networth/history
// Get net worth history for a user
router.get('/history', async (req, res) => {
  try {
    const { userId, months } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const query = { userId };
    const monthsNumber = Number(months);

    if (Number.isFinite(monthsNumber) && monthsNumber > 0) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - monthsNumber);
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    const history = await NetWorthSnapshot.find(query).sort({ createdAt: 1 });

    res.json({ data: history });
  } catch (error) {
    console.error('Error fetching net worth history:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/networth/snapshot
// Trigger a new net worth snapshot calculation and save it
router.post('/snapshot', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // 1. Fetch all current data
    const [assets, liabilities, accounts] = await Promise.all([
      Asset.find({ userId, isActive: true }),
      Liability.find({ userId, isActive: true }),
      Account.find({ userId })
    ]);

    const summary = calculateNetWorthSummary({ assets, liabilities, accounts });

    // 4. Save Snapshot
    const snapshot = new NetWorthSnapshot({
      userId,
      totalAssets: summary.totalAssets,
      totalLiabilities: summary.totalLiabilities,
      netWorth: summary.netWorth,
      breakdown: {
        assets: {
          manual: summary.manualAssetsValue,
          accounts: summary.connectedAccountsValue,
          categories: summary.assetsBreakdown,
        },
        liabilities: {
          manual: summary.manualLiabilitiesValue,
          overdrawnAccounts: summary.connectedAccountDebt,
          categories: summary.liabilitiesBreakdown,
        }
      },
      createdAt: new Date()
    });

    await snapshot.save();

    res.json({ data: snapshot });
  } catch (error) {
    console.error('Error creating net worth snapshot:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/networth/current
// Calculate current Net Worth on the fly (can be used for Home Screen)
router.get('/current', async (req, res) => {
  try {
    const { userId } = req.query;
    console.log('[NetWorth] Fetching current net worth for user:', userId);
    
    // Disable Caching
    res.set('Cache-Control', 'no-store');
    
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const [assets, liabilities, accounts] = await Promise.all([
        Asset.find({ userId, isActive: true }), // CHANGED is_active to isActive to match Schema
        Liability.find({ userId, isActive: true }), // CHANGED is_active to isActive
        Account.find({ userId })
    ]);
    
    console.log(`[NetWorth] Found: ${assets.length} assets, ${liabilities.length} liabilities, ${accounts.length} accounts`);

    // Log raw data for debugging
    if (assets.length > 0) console.log('[NetWorth] First Asset:', assets[0]);

    // Calculate Monthly Change
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const previousSnapshot = await NetWorthSnapshot.findOne({
      userId,
      createdAt: { $lte: startOfMonth } // Compare vs Start of Month for "This Month"
    }).sort({ createdAt: -1 });

    const summary = calculateNetWorthSummary({
      assets,
      liabilities,
      accounts,
      previousSnapshot,
    });
    
    console.log(`[NetWorth] Calculated: Assets=${summary.totalAssets}, Liabilities=${summary.totalLiabilities}, NetWorth=${summary.netWorth}`);
    console.log(`[NetWorth] Change: ${summary.monthlyChange} (${summary.monthlyChangePercentage.toFixed(2)}%)`);

    // Auto-create snapshot if none exists today (builds trend data over time)
    const todayDate = new Date();
    const startOfDay = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const todaysSnapshot = await NetWorthSnapshot.findOne({
      userId,
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    });

    if (!todaysSnapshot) {
      // Create a snapshot for today
      const newSnapshot = new NetWorthSnapshot({
        userId,
        totalAssets: summary.totalAssets,
        totalLiabilities: summary.totalLiabilities,
        netWorth: summary.netWorth,
        breakdown: {
          assets: {
            manual: summary.manualAssetsValue,
            accounts: summary.connectedAccountsValue,
            categories: summary.assetsBreakdown,
          },
          liabilities: {
            manual: summary.manualLiabilitiesValue,
            overdrawnAccounts: summary.connectedAccountDebt,
            categories: summary.liabilitiesBreakdown,
          },
        },
        createdAt: new Date()
      });

      await newSnapshot.save();
      console.log('[NetWorth] Auto-created daily snapshot');
    }

    res.json({
        data: {
            ...summary,
            currency: 'GHS'
        }
    });

  } catch (error) {
    console.error('Error fetching current net worth:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
