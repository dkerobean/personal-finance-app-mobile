const express = require('express');
const router = express.Router();
const { Liability } = require('../models');

// Get all liabilities for user
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const liabilities = await Liability.find({ userId, isActive: true }).sort({ createdAt: -1 });
    res.json({ data: liabilities });
  } catch (error) {
    console.error('Error fetching liabilities:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get liability totals by category
router.get('/totals', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const totals = await Liability.aggregate([
      { $match: { userId, isActive: true } },
      { $group: { _id: '$category', total: { $sum: '$currentBalance' }, count: { $sum: 1 } } },
      { $project: { _id: 0, category: '$_id', total: 1, count: 1 } },
      { $sort: { total: -1 } },
    ]);

    res.json({ data: totals });
  } catch (error) {
    console.error('Error fetching liability totals:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create liability
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      name,
      category,
      liabilityType,
      currentBalance,
      customCategory,
      customType,
      originalBalance,
      interestRate,
      monthlyPayment,
      dueDate,
      description,
    } = req.body;

    if (!userId || !name || !category || !liabilityType || currentBalance === undefined) {
      return res.status(400).json({ error: 'userId, name, category, liabilityType, currentBalance are required' });
    }

    const liability = await Liability.create({
      userId, name, category, liabilityType, currentBalance, originalBalance, interestRate, monthlyPayment,
      customCategory, customType,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      description, isActive: true,
    });

    res.status(201).json({ data: liability });
  } catch (error) {
    console.error('Error creating liability:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update liability
router.patch('/:id', async (req, res) => {
  try {
    const userId = req.query.userId;
    const updateData = { ...req.body };
    if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);

    const liability = await Liability.findOneAndUpdate(
      { _id: req.params.id, userId },
      updateData,
      { new: true }
    );

    if (!liability) {
      return res.status(404).json({ error: 'Liability not found' });
    }

    res.json({ data: liability });
  } catch (error) {
    console.error('Error updating liability:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete liability (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    const liability = await Liability.findOneAndUpdate(
      { _id: req.params.id, userId },
      { isActive: false }
    );

    if (!liability) {
      return res.status(404).json({ error: 'Liability not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting liability:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
