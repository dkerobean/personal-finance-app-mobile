const users = require('./users');
const categories = require('./categories');
const transactions = require('./transactions');
const budgets = require('./budgets');
const accounts = require('./accounts');
const assets = require('./assets');
const liabilities = require('./liabilities');
const mono = require('./mono');
const reports = require('./reports');
const notifications = require('./notifications');

module.exports = {
  users,
  categories,
  transactions,
  budgets,
  accounts,
  assets,
  liabilities,
  mono,
  reports,
  networth: require('./networth'),
  notifications,
};

