const express = require('express');
const router = express.Router();

// Import routes
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');
const exchangeRoutes = require('./exchange.routes');
const purchaseRoutes = require('./purchase.routes');
const transactionRoutes = require('./transaction.routes');
const notificationRoutes = require('./notification.routes');

// ============================================================
// HEALTH CHECK
// ============================================================

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// API ROUTES
// ============================================================

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/exchanges', exchangeRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/transactions', transactionRoutes);
router.use('/notifications', notificationRoutes);

// ============================================================
// 404 HANDLER FOR API
// ============================================================

router.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `API route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
