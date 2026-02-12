const express = require('express');
const router = express.Router();
const { Asset } = require('../models');

// Get all assets for user
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const assets = await Asset.find({ userId, isActive: true }).sort({ createdAt: -1 });
    res.json({ data: assets });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get assets totals by category
router.get('/totals', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const totals = await Asset.aggregate([
      { $match: { userId, isActive: true } },
      { $group: { _id: '$category', total: { $sum: '$currentValue' }, count: { $sum: 1 } } },
      { $project: { _id: 0, category: '$_id', total: 1, count: 1 } },
      { $sort: { total: -1 } },
    ]);

    res.json({ data: totals });
  } catch (error) {
    console.error('Error fetching asset totals:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create asset
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      name,
      category,
      assetType,
      currentValue,
      customCategory,
      customType,
      originalValue,
      purchaseDate,
      description,
    } = req.body;

    if (!userId || !name || !category || !assetType || currentValue === undefined) {
      return res.status(400).json({ error: 'userId, name, category, assetType, currentValue are required' });
    }

    const asset = await Asset.create({
      userId, name, category, assetType, currentValue, originalValue,
      customCategory, customType,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      description, isActive: true,
    });

    res.status(201).json({ data: asset });
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update asset
router.patch('/:id', async (req, res) => {
  try {
    const userId = req.query.userId;
    const updateData = { ...req.body };
    if (updateData.purchaseDate) updateData.purchaseDate = new Date(updateData.purchaseDate);

    const asset = await Asset.findOneAndUpdate(
      { _id: req.params.id, userId },
      updateData,
      { new: true }
    );

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json({ data: asset });
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete asset (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    const asset = await Asset.findOneAndUpdate(
      { _id: req.params.id, userId },
      { isActive: false }
    );

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
