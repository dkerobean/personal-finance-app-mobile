const express = require('express');
const router = express.Router();
const NetWorthSnapshot = require('../models/NetWorthSnapshot');
const Asset = require('../models/Asset');
const Liability = require('../models/Liability');
const Account = require('../models/Account');

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

    // 2. Calculate totals
    // Assets = Manual Assets + Linked Accounts (Cash, Investment, etc treated as assets)
    // Note: In this app's model, "Accounts" are usually cash/bank accounts. 
    // They should be included in Total Assets.
    
    // Sum of manually tracked assets
    const manualAssetsTotal = assets.reduce(
      (sum, item) => sum + (Number(item.currentValue) || Number(item.current_value) || 0),
      0
    );
    
    // Sum of linked accounts (usually positive balances are assets)
    const accountsTotal = accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
    
    const totalAssets = manualAssetsTotal + accountsTotal;

    // Sum of liabilities
    const totalLiabilities = liabilities.reduce(
      (sum, item) => sum + (Number(item.currentBalance) || Number(item.current_balance) || 0),
      0
    );

    const netWorth = totalAssets - totalLiabilities;

    // 3. Create breakdown for analytics
    const assetBreakdown = {
      manual: manualAssetsTotal,
      accounts: accountsTotal,
      byCategory: assets.reduce((acc, item) => {
        const value = Number(item.currentValue) || Number(item.current_value) || 0;
        acc[item.category] = (acc[item.category] || 0) + value;
        return acc;
      }, {})
    };

    const liabilityBreakdown = {
      byCategory: liabilities.reduce((acc, item) => {
        const value = Number(item.currentBalance) || Number(item.current_balance) || 0;
        acc[item.category] = (acc[item.category] || 0) + value;
        return acc;
      }, {})
    };

    // 4. Save Snapshot
    const snapshot = new NetWorthSnapshot({
      userId,
      totalAssets,
      totalLiabilities,
      netWorth,
      breakdown: {
        assets: assetBreakdown,
        liabilities: liabilityBreakdown
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

    // Use correct field names based on Schema (currentValue vs current_value)
    // The Schema uses camelCase (currentValue), but typical DB might have snake_case if migrated?
    // Let's check the Schema again: api/src/models/Asset.js uses 'currentValue'.
    
    // Sum of manually tracked assets
    const manualAssetsTotal = assets.reduce((sum, item) => {
        const val = Number(item.currentValue) || Number(item.current_value) || 0;
        return sum + val;
    }, 0);
    
    // Sum of linked accounts (usually positive balances are assets)
    const accountsTotal = accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
    
    const totalAssets = manualAssetsTotal + accountsTotal;

    // Liabilities also use currentBalance based on naming conventions, let's assume safely
    const totalLiabilities = liabilities.reduce((sum, item) => {
         const val = Number(item.currentBalance) || Number(item.current_balance) || 0;
         return sum + val;
    }, 0);

    const netWorth = totalAssets - totalLiabilities;
    
    // Calculate Monthly Change
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const previousSnapshot = await NetWorthSnapshot.findOne({
      userId,
      createdAt: { $lte: startOfMonth } // Compare vs Start of Month for "This Month"
    }).sort({ createdAt: -1 });

    let monthlyChange = 0;
    let monthlyChangePercentage = 0;

    if (previousSnapshot) {
      monthlyChange = netWorth - previousSnapshot.netWorth;
      if (previousSnapshot.netWorth !== 0) {
        monthlyChangePercentage = (monthlyChange / Math.abs(previousSnapshot.netWorth)) * 100;
      } else {
        monthlyChangePercentage = monthlyChange > 0 ? 100 : 0;
      }
    } else {
       // Fallback: If no snapshot before this month, check if we have ANY snapshot (new user case)
       // If this is the first month, maybe compare vs the FIRST snapshot of this month?
       const firstSnapshotOfMonth = await NetWorthSnapshot.findOne({
         userId,
         createdAt: { $gte: startOfMonth }
       }).sort({ createdAt: 1 });
       
       if (firstSnapshotOfMonth) {
          monthlyChange = netWorth - firstSnapshotOfMonth.netWorth;
          if (firstSnapshotOfMonth.netWorth !== 0) {
            monthlyChangePercentage = (monthlyChange / Math.abs(firstSnapshotOfMonth.netWorth)) * 100;
          }
       }
    }
    
    console.log(`[NetWorth] Calculated: Assets=${totalAssets}, Liabilities=${totalLiabilities}, NetWorth=${netWorth}`);
    console.log(`[NetWorth] Change: ${monthlyChange} (${monthlyChangePercentage.toFixed(2)}%)`);

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
      const assetBreakdown = {
        manual: manualAssetsTotal,
        accounts: accountsTotal,
      };

      const newSnapshot = new NetWorthSnapshot({
        userId,
        totalAssets,
        totalLiabilities,
        netWorth,
        breakdown: { assets: assetBreakdown, liabilities: {} },
        createdAt: new Date()
      });

      await newSnapshot.save();
      console.log('[NetWorth] Auto-created daily snapshot');
    }

    res.json({
        data: {
            netWorth,
            totalAssets,
            totalLiabilities,
            monthlyChange,
            monthlyChangePercentage,
            currency: 'GHS'
        }
    });

  } catch (error) {
    console.error('Error fetching current net worth:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
