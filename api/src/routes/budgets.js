const express = require('express');
const router = express.Router();
const { Budget, Transaction } = require('../models');

// Get all budgets for user
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const budgets = await Budget.find({ userId })
      .populate('categoryId')
      .sort({ month: -1 });

    res.json({ data: budgets });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get budgets with spending for a month
router.get('/spending/:month', async (req, res) => {
  try {
    const userId = req.query.userId;
    const month = req.params.month;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const budgets = await Budget.find({ userId, month }).populate('categoryId');

    // Calculate spending for each budget
    const monthStart = new Date(month);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);
    monthEnd.setHours(23, 59, 59, 999);

    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const spending = await Transaction.aggregate([
          {
            $match: {
              userId,
              categoryId: budget.categoryId?._id,
              type: 'expense',
              transactionDate: { $gte: monthStart, $lte: monthEnd },
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]);

        const spent = spending[0]?.total || 0;
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

        return {
          ...budget.toObject(),
          spent,
          percentage: Math.round(percentage * 100) / 100,
          remaining: budget.amount - spent,
          status: percentage >= 100 ? 'over_budget' : percentage >= 90 ? 'warning' : 'on_track',
          transactionCount: spending[0]?.count || 0,
        };
      })
    );

    res.json({ data: budgetsWithSpending });
  } catch (error) {
    console.error('Error fetching budgets with spending:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create budget
router.post('/', async (req, res) => {
  try {
    const { userId, categoryId, amount, month } = req.body;

    if (!userId || !categoryId || !amount || !month) {
      return res.status(400).json({ error: 'userId, categoryId, amount, month are required' });
    }

    // Check for existing budget
    const existing = await Budget.findOne({ userId, categoryId, month });
    if (existing) {
      return res.status(400).json({ error: 'Budget already exists for this category/month' });
    }

    const budget = await Budget.create({ userId, categoryId, amount, month });
    const populated = await Budget.findById(budget._id).populate('categoryId');

    res.status(201).json({ data: populated });
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update budget
router.patch('/:id', async (req, res) => {
  try {
    const userId = req.query.userId;
    const { amount } = req.body;

    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, userId },
      { amount },
      { new: true }
    ).populate('categoryId');

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.json({ data: budget });
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete budget
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    const result = await Budget.deleteOne({ _id: req.params.id, userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
