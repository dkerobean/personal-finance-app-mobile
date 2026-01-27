const express = require('express');
const router = express.Router();
const { Transaction, Category } = require('../models');

// Get all transactions for user
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const transactions = await Transaction.find({ userId })
      .populate('categoryId')
      .populate('accountId')
      .sort({ transactionDate: -1 });

    res.json({ data: transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single transaction
router.get('/:id', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    const transaction = await Transaction.findOne({ _id: req.params.id, userId })
      .populate('categoryId')
      .populate('accountId');

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ data: transaction });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create transaction
router.post('/', async (req, res) => {
  try {
    const { userId, amount, type, categoryId, transactionDate, description, accountId } = req.body;
    
    if (!userId || !amount || !type || !categoryId || !transactionDate) {
      return res.status(400).json({ error: 'userId, amount, type, categoryId, transactionDate are required' });
    }

    const transaction = await Transaction.create({
      userId,
      amount,
      type,
      categoryId,
      transactionDate: new Date(transactionDate),
      description,
      accountId,
      platformSource: 'manual',
    });

    const populated = await Transaction.findById(transaction._id)
      .populate('categoryId')
      .populate('accountId');

    res.status(201).json({ data: populated });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update transaction
router.patch('/:id', async (req, res) => {
  try {
    const userId = req.query.userId;
    const { amount, type, categoryId, transactionDate, description } = req.body;
    
    const updateData = {};
    if (amount !== undefined) updateData.amount = amount;
    if (type !== undefined) updateData.type = type;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (transactionDate !== undefined) updateData.transactionDate = new Date(transactionDate);
    if (description !== undefined) updateData.description = description;

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId },
      updateData,
      { new: true }
    ).populate('categoryId').populate('accountId');

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ data: transaction });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete transaction
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    const result = await Transaction.deleteOne({ _id: req.params.id, userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
