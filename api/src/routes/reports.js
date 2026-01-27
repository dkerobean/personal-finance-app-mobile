const express = require('express');
const router = express.Router();
const { Transaction, Category } = require('../models');

// Get monthly report
router.get('/', async (req, res) => {
  try {
    const { userId, month } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!month) {
      return res.status(400).json({ error: 'month is required (format: YYYY-MM)' });
    }

    // Parse month to get date range
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    // Fetch transactions for the month
    const transactions = await Transaction.find({
      userId,
      transactionDate: { $gte: startDate, $lte: endDate }
    }).populate('categoryId');

    // Calculate totals
    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryBreakdown = {};

    transactions.forEach(t => {
      const amount = t.amount;
      const categoryName = t.categoryId?.name || 'Uncategorized';
      const categoryIcon = t.categoryId?.iconName || 'apps-outline';

      if (t.type === 'income') {
        totalIncome += amount;
      } else {
        totalExpenses += amount;
        
        // Build category breakdown for expenses
        if (!categoryBreakdown[categoryName]) {
          categoryBreakdown[categoryName] = {
            name: categoryName,
            icon: categoryIcon,
            amount: 0,
            count: 0
          };
        }
        categoryBreakdown[categoryName].amount += amount;
        categoryBreakdown[categoryName].count += 1;
      }
    });

    // Convert breakdown to sorted array matching frontend expected format
    const topCategories = Object.values(categoryBreakdown)
      .sort((a, b) => b.amount - a.amount)
      .map(cat => ({
        categoryName: cat.name,
        categoryIcon: cat.icon,
        totalAmount: cat.amount,
        transactionCount: cat.count
      }));

    // Calculate savings rate
    const savingsRate = totalIncome > 0 
      ? ((totalIncome - totalExpenses) / totalIncome) * 100 
      : 0;

    const report = {
      month,
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      transactionCount: transactions.length,
      topCategories,
      savingsRate: Math.round(savingsRate * 10) / 10,
      avgTransactionAmount: transactions.length > 0 
        ? Math.round((totalIncome + totalExpenses) / transactions.length * 100) / 100
        : 0
    };

    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get report comparison between two months
router.get('/comparison', async (req, res) => {
  try {
    const { userId, current_month, previous_month } = req.query;
    
    if (!userId || !current_month || !previous_month) {
      return res.status(400).json({ 
        error: 'userId, current_month, and previous_month are required' 
      });
    }

    // Helper to get month data
    const getMonthData = async (month) => {
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

      const transactions = await Transaction.find({
        userId,
        transactionDate: { $gte: startDate, $lte: endDate }
      });

      let income = 0;
      let expenses = 0;

      transactions.forEach(t => {
        if (t.type === 'income') {
          income += t.amount;
        } else {
          expenses += t.amount;
        }
      });

      return { income, expenses, count: transactions.length };
    };

    const current = await getMonthData(current_month);
    const previous = await getMonthData(previous_month);

    const incomeChange = previous.income > 0 
      ? ((current.income - previous.income) / previous.income) * 100 
      : 0;
    
    const expenseChange = previous.expenses > 0 
      ? ((current.expenses - previous.expenses) / previous.expenses) * 100 
      : 0;

    const comparison = {
      currentMonth: current_month,
      previousMonth: previous_month,
      current: {
        totalIncome: current.income,
        totalExpenses: current.expenses,
        netIncome: current.income - current.expenses,
        transactionCount: current.count
      },
      previous: {
        totalIncome: previous.income,
        totalExpenses: previous.expenses,
        netIncome: previous.income - previous.expenses,
        transactionCount: previous.count
      },
      changes: {
        incomePercent: Math.round(incomeChange * 10) / 10,
        expensePercent: Math.round(expenseChange * 10) / 10,
        netIncomeChange: (current.income - current.expenses) - (previous.income - previous.expenses)
      }
    };

    res.json({ success: true, data: comparison });
  } catch (error) {
    console.error('Error generating report comparison:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
