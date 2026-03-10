const APPRECIATING_ASSET_TYPES = new Set([
  'primary_home',
  'real_estate',
  'land',
  'rental_property',
  'commercial_property',
  'stocks',
  'bonds',
  'mutual_funds',
  'etf',
  'cryptocurrency',
  'retirement_account',
  'treasury_bill',
  'pension_fund',
  'brokerage_account',
  'reits',
  'private_equity',
  'precious_metals',
  'business_equity',
  'intellectual_property',
]);

const LIQUID_ASSET_TYPES = new Set([
  'savings',
  'checking',
  'money_market',
  'cd',
  'foreign_currency',
  'mobile_money_wallet',
  'emergency_fund',
  'fixed_deposit',
  'cash_on_hand',
  'treasury_bill',
  'brokerage_account',
  'accounts_receivable',
]);

const ASSET_COLORS = {
  property: '#15803D',
  investments: '#2563EB',
  cash: '#0F766E',
  vehicles: '#C2410C',
  personal: '#BE185D',
  business: '#4F46E5',
  other: '#6B7280',
  connected_accounts: '#0891B2',
};

const LIABILITY_COLORS = {
  loans: '#DC2626',
  credit_cards: '#B91C1C',
  mortgages: '#991B1B',
  business_debt: '#7F1D1D',
  other: '#6B7280',
  overdrawn_accounts: '#9F1239',
};

const formatLabel = (value = '') =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const toPositiveNumber = (value) => {
  const numericValue = Number(value || 0);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const getAssetCurrentValue = (asset) => {
  if (asset.valuationMethod === 'market' && asset.unitsHeld && asset.unitPrice) {
    return Number((toPositiveNumber(asset.unitsHeld) * toPositiveNumber(asset.unitPrice)).toFixed(2));
  }

  return toPositiveNumber(asset.currentValue || asset.current_value);
};

const buildAssetHolding = (asset) => {
  const currentValue = getAssetCurrentValue(asset);
  const originalValue = toPositiveNumber(asset.originalValue || asset.original_value);
  const gainAmount = originalValue ? currentValue - originalValue : 0;
  const gainPercentage = originalValue ? (gainAmount / originalValue) * 100 : null;

  return {
    id: String(asset._id || asset.id),
    name: asset.name,
    label: asset.customType || formatLabel(asset.assetType || asset.asset_type),
    amount: currentValue,
    changeAmount: gainAmount,
    changePercentage: gainPercentage,
    category: asset.category,
    trackingMethod: asset.valuationMethod || 'manual',
    lastUpdated: asset.lastValuationDate || asset.updatedAt || asset.updated_at,
  };
};

const buildLiabilityHolding = (liability) => {
  const currentBalance = toPositiveNumber(liability.currentBalance || liability.current_balance);
  const originalBalance = toPositiveNumber(liability.originalBalance || liability.original_balance);
  const paidDownAmount = originalBalance ? originalBalance - currentBalance : 0;

  return {
    id: String(liability._id || liability.id),
    name: liability.name,
    label: liability.customType || formatLabel(liability.liabilityType || liability.liability_type),
    amount: currentBalance,
    changeAmount: paidDownAmount,
    interestRate: toPositiveNumber(liability.interestRate || liability.interest_rate) || null,
    monthlyPayment: toPositiveNumber(liability.monthlyPayment || liability.monthly_payment) || null,
    category: liability.category,
    lastUpdated: liability.updatedAt || liability.updated_at,
  };
};

const buildBreakdown = (entries, total, palette) =>
  Object.values(entries)
    .map((entry) => ({
      key: entry.key,
      label: entry.label,
      amount: entry.amount,
      percentage: total > 0 ? (entry.amount / total) * 100 : 0,
      count: entry.count,
      color: palette[entry.key] || '#6B7280',
      isConnected: Boolean(entry.isConnected),
    }))
    .sort((left, right) => right.amount - left.amount);

function calculateNetWorthSummary({
  assets = [],
  liabilities = [],
  accounts = [],
  previousSnapshot = null,
}) {
  const assetBreakdownMap = {};
  const liabilityBreakdownMap = {};

  let manualAssetsValue = 0;
  let appreciatingAssetsValue = 0;
  let liquidAssetsValue = 0;
  let totalAssetGain = 0;

  const topAssets = assets.map((asset) => {
    const currentValue = getAssetCurrentValue(asset);
    manualAssetsValue += currentValue;

    if (APPRECIATING_ASSET_TYPES.has(asset.assetType || asset.asset_type)) {
      appreciatingAssetsValue += currentValue;
    }

    if (LIQUID_ASSET_TYPES.has(asset.assetType || asset.asset_type)) {
      liquidAssetsValue += currentValue;
    }

    const categoryKey = asset.category || 'other';
    if (!assetBreakdownMap[categoryKey]) {
      assetBreakdownMap[categoryKey] = {
        key: categoryKey,
        label: formatLabel(categoryKey),
        amount: 0,
        count: 0,
        isConnected: false,
      };
    }

    assetBreakdownMap[categoryKey].amount += currentValue;
    assetBreakdownMap[categoryKey].count += 1;

    const originalValue = toPositiveNumber(asset.originalValue || asset.original_value);
    if (originalValue) {
      totalAssetGain += currentValue - originalValue;
    }

    return buildAssetHolding(asset);
  });

  let manualLiabilitiesValue = 0;
  let monthlyDebtPayments = 0;

  const topLiabilities = liabilities.map((liability) => {
    const currentBalance = toPositiveNumber(liability.currentBalance || liability.current_balance);
    manualLiabilitiesValue += currentBalance;
    monthlyDebtPayments += toPositiveNumber(liability.monthlyPayment || liability.monthly_payment);

    const categoryKey = liability.category || 'other';
    if (!liabilityBreakdownMap[categoryKey]) {
      liabilityBreakdownMap[categoryKey] = {
        key: categoryKey,
        label: formatLabel(categoryKey),
        amount: 0,
        count: 0,
        isConnected: false,
      };
    }

    liabilityBreakdownMap[categoryKey].amount += currentBalance;
    liabilityBreakdownMap[categoryKey].count += 1;

    return buildLiabilityHolding(liability);
  });

  const connectedAccountsValue = accounts.reduce((sum, account) => {
    const balance = Number(account.balance || 0);
    return balance > 0 ? sum + balance : sum;
  }, 0);

  const connectedAccountDebt = Math.abs(
    accounts.reduce((sum, account) => {
      const balance = Number(account.balance || 0);
      return balance < 0 ? sum + balance : sum;
    }, 0)
  );

  if (connectedAccountsValue > 0) {
    assetBreakdownMap.connected_accounts = {
      key: 'connected_accounts',
      label: 'Connected Accounts',
      amount: connectedAccountsValue,
      count: accounts.filter((account) => Number(account.balance || 0) > 0).length,
      isConnected: true,
    };
  }

  if (connectedAccountDebt > 0) {
    liabilityBreakdownMap.overdrawn_accounts = {
      key: 'overdrawn_accounts',
      label: 'Overdrawn Accounts',
      amount: connectedAccountDebt,
      count: accounts.filter((account) => Number(account.balance || 0) < 0).length,
      isConnected: true,
    };
  }

  const totalAssets = manualAssetsValue + connectedAccountsValue;
  const totalLiabilities = manualLiabilitiesValue + connectedAccountDebt;
  const netWorth = totalAssets - totalLiabilities;
  const debtToAssetRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
  const assetCoverageRatio = totalLiabilities > 0 ? totalAssets / totalLiabilities : null;

  const previousNetWorth = previousSnapshot ? toPositiveNumber(previousSnapshot.netWorth) : 0;
  const monthlyChange = previousSnapshot ? netWorth - previousNetWorth : 0;
  const monthlyChangePercentage =
    previousSnapshot && previousNetWorth !== 0
      ? (monthlyChange / Math.abs(previousNetWorth)) * 100
      : 0;

  return {
    netWorth,
    totalAssets,
    totalLiabilities,
    manualAssetsValue,
    manualLiabilitiesValue,
    connectedAccountsValue,
    connectedAccountDebt,
    liquidAssetsValue: liquidAssetsValue + connectedAccountsValue,
    appreciatingAssetsValue,
    monthlyDebtPayments,
    totalAssetGain,
    debtToAssetRatio,
    assetCoverageRatio,
    monthlyChange,
    monthlyChangePercentage,
    assetsBreakdown: buildBreakdown(assetBreakdownMap, totalAssets, ASSET_COLORS),
    liabilitiesBreakdown: buildBreakdown(liabilityBreakdownMap, totalLiabilities, LIABILITY_COLORS),
    topAssets: topAssets.sort((left, right) => right.amount - left.amount).slice(0, 5),
    topLiabilities: topLiabilities.sort((left, right) => right.amount - left.amount).slice(0, 5),
  };
}

module.exports = {
  calculateNetWorthSummary,
  getAssetCurrentValue,
};
