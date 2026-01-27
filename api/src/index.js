require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./config/database');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(morgan('dev'));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/users', routes.users);
app.use('/api/categories', routes.categories);
app.use('/api/transactions', routes.transactions);
app.use('/api/budgets', routes.budgets);
app.use('/api/accounts', routes.accounts);
app.use('/api/assets', routes.assets);
app.use('/api/liabilities', routes.liabilities);
app.use('/api/mono', routes.mono);
app.use('/api/reports', routes.reports);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Kippo API running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📁 API endpoints: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
