const express = require('express');
const router = express.Router();
const { Account, Transaction, Category } = require('../models');

const MONO_API_BASE_URL = 'https://api.withmono.com';
const GHANA_COUNTRY_CODES = new Set(['GH', 'GHA']);
const GHANA_CURRENCIES = new Set(['GHS']);

const buildMonoHeaders = (secretKey) => ({
  'Content-Type': 'application/json',
  'mono-sec-key': secretKey,
});

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const normalizeAmount = (amount) => {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  // Mono transaction amounts are returned in minor units (pesewas/kobo).
  if (Number.isInteger(numeric)) {
    return Math.abs(numeric) / 100;
  }

  return Math.abs(numeric);
};

const normalizeDate = (dateValue) => {
  const parsed = new Date(dateValue || Date.now());
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const inferTransactionType = (transaction) => {
  const rawType = String(
    transaction.type || transaction.direction || transaction.flow || transaction.category || ''
  ).toLowerCase();

  const incomeSignals = ['credit', 'incoming', 'deposit', 'receive', 'received'];
  if (incomeSignals.some((signal) => rawType.includes(signal))) {
    return 'income';
  }

  const expenseSignals = ['debit', 'outgoing', 'withdrawal', 'transfer', 'charge', 'payment'];
  if (expenseSignals.some((signal) => rawType.includes(signal))) {
    return 'expense';
  }

  const numericAmount = Number(transaction.amount ?? transaction.value);
  if (Number.isFinite(numericAmount) && numericAmount < 0) {
    return 'expense';
  }

  return 'expense';
};

const inferTransactionId = (transaction) => {
  const explicitId =
    transaction.id ||
    transaction._id ||
    transaction.transactionId ||
    transaction.reference ||
    transaction.external_id;

  if (explicitId) {
    return String(explicitId);
  }

  const fingerprint = [
    transaction.date || transaction.created_at || transaction.valueDate || '',
    transaction.amount ?? transaction.value ?? '',
    transaction.narration || transaction.description || transaction.paymentReference || '',
  ]
    .map((part) => String(part).trim())
    .join('|');

  return fingerprint || null;
};

const inferInstitutionType = (accountInfo) => {
  const institutionType = String(accountInfo?.institution?.type || '').toUpperCase();
  if (institutionType) {
    return institutionType;
  }

  const accountType = String(accountInfo?.account?.type || accountInfo?.type || '').toLowerCase();
  if (accountType.includes('momo') || accountType.includes('mobile') || accountType.includes('telecom')) {
    return 'MOMO';
  }

  return 'BANK';
};

const inferAccountType = (accountInfo) => {
  const institutionType = inferInstitutionType(accountInfo);
  return institutionType === 'MOMO' ? 'mobile_money' : 'bank';
};

const isGhanaAccount = (accountInfo) => {
  const countryCandidates = [
    accountInfo?.country,
    accountInfo?.account?.country,
    accountInfo?.institution?.country,
    accountInfo?.institution?.countryCode,
  ]
    .filter(Boolean)
    .map((value) => String(value).toUpperCase());

  if (countryCandidates.some((code) => GHANA_COUNTRY_CODES.has(code))) {
    return true;
  }

  const currencyCandidates = [accountInfo?.account?.currency, accountInfo?.currency]
    .filter(Boolean)
    .map((value) => String(value).toUpperCase());

  if (currencyCandidates.some((currency) => GHANA_CURRENCIES.has(currency))) {
    return true;
  }

  const institutionName = String(accountInfo?.institution?.name || '').toLowerCase();
  return institutionName.includes('ghana');
};

const extractTransactions = (payload) => {
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.transactions)) {
    return payload.transactions;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
};

const fetchMonoJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const text = await response.text();
  const json = safeJsonParse(text);

  return {
    ok: response.ok,
    status: response.status,
    body: json,
    raw: text,
  };
};

const fetchMonoAccountDetails = async (accountId, secretKey) => {
  const headers = buildMonoHeaders(secretKey);
  const endpoints = [`${MONO_API_BASE_URL}/v2/accounts/${accountId}`, `${MONO_API_BASE_URL}/v1/accounts/${accountId}`];
  let lastError;

  for (const endpoint of endpoints) {
    const result = await fetchMonoJson(endpoint, { method: 'GET', headers });

    if (result.ok && result.body) {
      return result.body;
    }

    lastError = result;
  }

  const details = lastError?.body || lastError?.raw;
  throw new Error(`Failed to fetch Mono account details: ${JSON.stringify(details)}`);
};

const fetchMonoTransactions = async (monoAccountId, secretKey, startDate, endDate) => {
  const headers = buildMonoHeaders(secretKey);
  const paramsWithRange = `start=${startDate}&end=${endDate}&paginate=false`;
  const endpoints = [
    `${MONO_API_BASE_URL}/v2/accounts/${monoAccountId}/transactions?${paramsWithRange}`,
    `${MONO_API_BASE_URL}/v2/accounts/${monoAccountId}/transactions?paginate=false`,
    `${MONO_API_BASE_URL}/v1/accounts/${monoAccountId}/transactions?${paramsWithRange}`,
    `${MONO_API_BASE_URL}/v1/accounts/${monoAccountId}/transactions?paginate=false`,
  ];

  const failures = [];

  for (const endpoint of endpoints) {
    const result = await fetchMonoJson(endpoint, { method: 'GET', headers });

    if (result.ok) {
      return extractTransactions(result.body);
    }

    failures.push({ status: result.status, body: result.body || result.raw, endpoint });
  }

  throw new Error(`Failed to fetch transactions from Mono: ${JSON.stringify(failures)}`);
};

const resolveDefaultCategory = async (userId, type, categoryCache) => {
  if (categoryCache[type]) {
    return categoryCache[type];
  }

  const candidates =
    type === 'income'
      ? [{ name: 'Income', iconName: 'attach-money' }]
      : [
          { name: 'Others', iconName: 'more-horiz' },
          { name: 'Food & Dining', iconName: 'restaurant' },
        ];

  for (const candidate of candidates) {
    const userCategory = await Category.findOne({ userId, name: candidate.name });
    if (userCategory) {
      categoryCache[type] = userCategory._id;
      return userCategory._id;
    }

    const systemCategory = await Category.findOne({ userId: null, name: candidate.name });
    if (systemCategory) {
      categoryCache[type] = systemCategory._id;
      return systemCategory._id;
    }
  }

  const fallback = candidates[0];
  const createdCategory = await Category.create({
    userId,
    name: fallback.name,
    iconName: fallback.iconName,
  });

  categoryCache[type] = createdCategory._id;
  return createdCategory._id;
};

// Exchange Mono code for Account ID
router.post('/exchange-token', async (req, res) => {
  try {
    const { code, userId, expectedAccountType, expectedCountry } = req.body;

    if (!code || !userId) {
      return res.status(400).json({ error: 'Code and userId are required' });
    }

    const secretKey = process.env.MONO_SECRET_KEY;
    if (!secretKey) {
      console.error('MONO_SECRET_KEY is not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const validExpectedAccountType =
      expectedAccountType === 'bank' || expectedAccountType === 'mobile_money'
        ? expectedAccountType
        : null;
    const normalizedExpectedCountry = expectedCountry ? String(expectedCountry).toUpperCase() : null;

    const exchangeResponse = await fetchMonoJson(`${MONO_API_BASE_URL}/v2/accounts/auth`, {
      method: 'POST',
      headers: buildMonoHeaders(secretKey),
      body: JSON.stringify({ code }),
      redirect: 'error',
    });

    if (!exchangeResponse.ok) {
      console.error('Mono API error:', exchangeResponse.body || exchangeResponse.raw);
      return res.status(exchangeResponse.status).json({
        error: exchangeResponse.body?.message || 'Failed to exchange token with Mono',
        details: exchangeResponse.body || exchangeResponse.raw,
      });
    }

    const monoAccountId = exchangeResponse.body?.id;
    if (!monoAccountId) {
      return res.status(502).json({ error: 'Mono did not return an account ID' });
    }

    const infoData = await fetchMonoAccountDetails(monoAccountId, secretKey);
    const institutionName =
      infoData?.institution?.name || infoData?.account?.name || infoData?.name || 'Mono Linked Account';
    const accountType = inferAccountType(infoData);

    if (validExpectedAccountType && accountType !== validExpectedAccountType) {
      return res.status(422).json({
        error: `Linked account is ${accountType}, but ${validExpectedAccountType} was requested.`,
      });
    }

    if (normalizedExpectedCountry === 'GH' && !isGhanaAccount(infoData)) {
      return res.status(422).json({
        error: 'This linked account is not recognized as a Ghana account. Please link a Ghana MoMo account.',
      });
    }

    const existingAccount = await Account.findOne({ monoAccountId: monoAccountId, userId });
    if (existingAccount) {
      return res.status(200).json({ success: true, message: 'Account already linked', data: existingAccount });
    }

    const newAccount = new Account({
      userId,
      accountName: infoData?.account?.name || institutionName,
      accountType,
      balance: normalizeAmount(infoData?.account?.balance ?? infoData?.balance ?? 0),
      institutionName,
      monoAccountId,
      lastSyncedAt: new Date(),
      isActive: true,
    });

    await newAccount.save();

    return res.status(200).json({ success: true, data: newAccount });
  } catch (error) {
    console.error('Error handling Mono exchange:', error);
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Unknown internal server error' });
  }
});

// Sync transactions from Mono account
router.post('/sync-transactions', async (req, res) => {
  try {
    const { userId, accountId } = req.body;

    if (!userId || !accountId) {
      return res.status(400).json({ error: 'userId and accountId are required' });
    }

    const secretKey = process.env.MONO_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const account = await Account.findOne({ _id: accountId, userId });
    if (!account || !account.monoAccountId) {
      return res.status(404).json({ error: 'Linked Mono account not found' });
    }

    console.log('[Mono Sync] Fetching transactions for:', account.monoAccountId);

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const monoTransactions = await fetchMonoTransactions(account.monoAccountId, secretKey, startDate, endDate);

    console.log(`[Mono Sync] Received ${monoTransactions.length} transactions from Mono`);

    let imported = 0;
    let skipped = 0;
    const categoryCache = {};

    for (const tx of monoTransactions) {
      const monoTransactionId = inferTransactionId(tx);
      if (!monoTransactionId) {
        skipped++;
        continue;
      }

      const exists = await Transaction.findOne({ monoTransactionId });
      if (exists) {
        skipped++;
        continue;
      }

      const type = inferTransactionType(tx);
      const amount = normalizeAmount(tx.amount ?? tx.value ?? tx.total);
      if (!amount) {
        skipped++;
        continue;
      }

      const categoryId = await resolveDefaultCategory(userId, type, categoryCache);

      const newTx = new Transaction({
        userId,
        accountId: account._id,
        type,
        amount,
        categoryId,
        description: tx.narration || tx.description || tx.paymentReference || tx.reference || 'Mono Transaction',
        transactionDate: normalizeDate(tx.date || tx.created_at || tx.valueDate || tx.timestamp),
        monoTransactionId,
        platformSource: 'mono',
        isSynced: true,
        merchantName: tx.counterparty?.name || tx.merchant || tx.narration || tx.description,
        institutionName: account.institutionName,
      });

      await newTx.save();
      imported++;
    }

    account.lastSyncedAt = new Date();
    await account.save();

    console.log(`[Mono Sync] Imported: ${imported}, Skipped: ${skipped}`);

    return res.json({
      success: true,
      data: {
        imported,
        skipped,
        total: monoTransactions.length,
      },
    });
  } catch (error) {
    console.error('Error syncing Mono transactions:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown sync error' });
  }
});

// Get linked Mono accounts for user
router.get('/accounts', async (req, res) => {
  try {
    const { userId, accountType } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const query = {
      userId,
      monoAccountId: { $exists: true, $ne: null },
    };

    if (accountType === 'bank' || accountType === 'mobile_money') {
      query.accountType = accountType;
    }

    const accounts = await Account.find(query);

    return res.json({ data: accounts });
  } catch (error) {
    console.error('Error fetching Mono accounts:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown server error' });
  }
});

module.exports = router;
