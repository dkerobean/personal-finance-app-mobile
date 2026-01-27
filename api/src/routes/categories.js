const express = require('express');
const router = express.Router();
const { Category } = require('../models');

// Get all categories (system + user)
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    // Check if any categories exist for this user OR system
    let categories = await Category.find({
      $or: [{ userId: null }, { userId }]
    }).sort({ name: 1 });

    // SEEDING LOGIC: If very few categories found (e.g. < 2), seed defaults to ensure user has a base.
    // This fixes the issue where a single "Test" category prevents seeding.
    if (categories.length < 2) {
      console.log('Few/No categories found. Seeding default categories for user:', userId);
      const defaultCategories = [
        { name: 'Income', iconName: 'attach-money' },
        { name: 'Food & Dining', iconName: 'restaurant' },
        { name: 'Shopping', iconName: 'shopping-bag' },
        { name: 'Transportation', iconName: 'directions-bus' },
        { name: 'Entertainment', iconName: 'movie' },
        { name: 'Health & Fitness', iconName: 'fitness-center' },
        { name: 'Bills & Utilities', iconName: 'receipt' },
        { name: 'Others', iconName: 'more-horiz' },
      ];

      const existingNames = categories.map(c => c.name);
      
      const seedOps = defaultCategories
        .filter(cat => !existingNames.includes(cat.name)) // Prevent duplicates
        .map(cat => ({
          userId, 
          name: cat.name,
          iconName: cat.iconName
        }));

      if (seedOps.length > 0) {
        await Category.insertMany(seedOps);
        // Fetch again after seeding
        categories = await Category.find({ 
           $or: [{ userId: null }, { userId }]
        }).sort({ name: 1 });
      }
    }

    res.json({ data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create category
router.post('/', async (req, res) => {
  try {
    const { userId, name, iconName } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const category = await Category.create({
      userId,
      name,
      iconName: iconName || 'help-circle',
    });

    res.status(201).json({ data: category });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update category
router.patch('/:id', async (req, res) => {
  try {
    const { name, iconName } = req.body;
    const userId = req.query.userId;
    
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, userId },
      { name, iconName },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ data: category });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete category
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    const result = await Category.deleteOne({ _id: req.params.id, userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
