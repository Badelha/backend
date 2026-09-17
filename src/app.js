require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');

// استيراد المسارات الحقيقية
const authRoutes = require('./routes/auth.routes'); // لاحظ المسار: ./routes وليس ./src/routes

// استيراد معالج الأخطاء
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

// ============================================================
// MIDDLEWARES
// ============================================================
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3001',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// ============================================================
// 1. HEALTH CHECK
// ============================================================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// 2. REAL AUTH ROUTES (مسارات زميلتك الحقيقية)
// ============================================================
app.use('/api/auth', authRoutes);

// ============================================================
// 3. MOCK ROUTES (مسارات وهمية للاختبار)
// ============================================================

// --- Products ---
app.get('/api/products', (req, res) => {
  res.json([
    { id: 1, name: 'Product A', price: 100 },
    { id: 2, name: 'Product B', price: 200 },
  ]);
});

app.post('/api/products', (req, res) => {
  const { name, price } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  res.status(201).json({ id: 3, name, price });
});

app.get('/api/categories', (req, res) => {
  res.json([{ id: 1, name: 'Electronics' }, { id: 2, name: 'Clothing' }]);
});

// --- Notifications ---
app.get('/api/notifications', (req, res) => {
  res.json([{ id: 1, message: 'Welcome!', read: false }]);
});

app.get('/api/notifications/unread', (req, res) => {
  res.json([{ id: 1, message: 'Welcome!', read: false }]);
});

app.put('/api/notifications/:id/read', (req, res) => {
  res.json({ message: `Notification ${req.params.id} marked as read` });
});

app.put('/api/notifications/read-all', (req, res) => {
  res.json({ message: 'All notifications marked as read' });
});

app.delete('/api/notifications/:id', (req, res) => {
  res.json({ message: `Notification ${req.params.id} deleted` });
});

// --- Transactions ---
app.get('/api/transactions', (req, res) => {
  res.json([{ id: 1, amount: 500, status: 'completed' }]);
});

app.get('/api/transactions/stats', (req, res) => {
  res.json({ total: 100, completed: 80, pending: 20 });
});

// --- Exchanges ---
app.get('/api/exchanges', (req, res) => {
  res.json([{ id: 1, productA: 'Product A', productB: 'Product B' }]);
});

app.get('/api/exchanges/:id', (req, res) => {
  res.json({ id: req.params.id, productA: 'Product A', productB: 'Product B' });
});

// --- Purchases ---
app.get('/api/purchases', (req, res) => {
  res.json([{ id: 1, productId: 1, buyerId: 2 }]);
});

app.get('/api/purchases/:id', (req, res) => {
  res.json({ id: req.params.id, productId: 1, buyerId: 2 });
});

// ============================================================
// 4. 404 HANDLER (للمسارات غير الموجودة)
// ============================================================
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// ============================================================
// 5. GLOBAL ERROR HANDLER (لمعالجة الأخطاء)
// ============================================================
app.use(errorHandler);

module.exports = app;