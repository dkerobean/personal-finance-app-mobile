/**
 * Seed script to initialize default categories
 * Run with: npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const { Category } = require('../models');

const defaultCategories = [
  // Expense Categories
  { name: 'Food & Dining', iconName: 'restaurant' },
  { name: 'Transportation', iconName: 'car' },
  { name: 'Utilities', iconName: 'flash' },
  { name: 'Shopping', iconName: 'cart' },
  { name: 'Entertainment', iconName: 'film' },
  { name: 'Healthcare', iconName: 'medkit' },
  { name: 'Education', iconName: 'school' },
  { name: 'Personal Care', iconName: 'person' },
  { name: 'Travel', iconName: 'airplane' },
  { name: 'Gifts & Donations', iconName: 'gift' },
  { name: 'Housing', iconName: 'home' },
  { name: 'Insurance', iconName: 'shield' },
  { name: 'Subscriptions', iconName: 'card' },
  { name: 'Communication', iconName: 'call' },
  // Income Categories
  { name: 'Salary', iconName: 'cash' },
  { name: 'Investments', iconName: 'trending-up' },
  { name: 'Freelance', iconName: 'briefcase' },
  { name: 'Business', iconName: 'business' },
  { name: 'Rental Income', iconName: 'home' },
  { name: 'Other Income', iconName: 'add-circle' },
  // Default
  { name: 'Uncategorized', iconName: 'help-circle' },
];

const seed = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    
    // Check if default categories already exist
    const existingCount = await Category.countDocuments({ userId: null });
    
    if (existingCount > 0) {
      console.log(`✓ Default categories already exist (${existingCount} found)`);
      console.log('Skipping seed. Delete existing categories first if you want to re-seed.');
    } else {
      console.log('Creating default categories...');
      
      const categories = defaultCategories.map(cat => ({
        userId: null, // System-wide categories
        name: cat.name,
        iconName: cat.iconName,
      }));
      
      await Category.insertMany(categories);
      console.log(`✓ Created ${categories.length} default categories`);
    }
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📁 MongoDB Collections:');
    collections.forEach(col => console.log(`   - ${col.name}`));
    
    // Count documents in each collection
    console.log('\n📊 Document counts:');
    const models = ['User', 'Category', 'Transaction', 'Account', 'Budget', 'Asset', 'Liability', 'AlertSettings'];
    for (const modelName of models) {
      try {
        const count = await mongoose.model(modelName).countDocuments();
        console.log(`   - ${modelName}: ${count}`);
      } catch (e) {
        console.log(`   - ${modelName}: 0 (collection not created yet)`);
      }
    }
    
    console.log('\n✅ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seed();
