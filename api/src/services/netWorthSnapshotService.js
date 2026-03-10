const NetWorthSnapshot = require('../models/NetWorthSnapshot');
const Asset = require('../models/Asset');
const Liability = require('../models/Liability');
const Account = require('../models/Account');
const { calculateNetWorthSummary } = require('./netWorthCalculator');

async function createNetWorthSnapshotForUser(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }

  const [assets, liabilities, accounts] = await Promise.all([
    Asset.find({ userId, isActive: true }),
    Liability.find({ userId, isActive: true }),
    Account.find({ userId }),
  ]);

  const latestSnapshot = await NetWorthSnapshot.findOne({ userId }).sort({ createdAt: -1 });
  const summary = calculateNetWorthSummary({
    assets,
    liabilities,
    accounts,
    previousSnapshot: latestSnapshot,
  });

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
      },
    },
    createdAt: new Date(),
  });

  await snapshot.save();
  return snapshot;
}

module.exports = {
  createNetWorthSnapshotForUser,
};
