const express = require('express');
const cors = require('cors');

// استيراد الـ Routes من مجلد routes (إذا كانت موجودة)
// يمكنك إلغاء التعليق عنها لاحقاً إذا كانت الملفات موجودة
// const authRoutes = require('./routes/auth.routes');
// const productRoutes = require('./routes/product.routes');
// const transactionRoutes = require('./routes/transaction.routes');

const app = express();

// ============================================================
// MIDDLEWARES
// ============================================================
app.use(cors()); // للسماح بالطلبات من أي مكان
app.use(express.json()); // لقراءة البيانات JSON من الـ Body
app.use(express.urlencoded({ extended: true }));

// ============================================================
// 1. HEALTH CHECK (للتأكد من عمل السيرفر)
// ============================================================
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// 2. AUTHENTICATION ROUTES (مسارات المصادقة)
// ============================================================
// ملاحظة: هذه مسارات وهمية. يجب ربطها بـ authController الموجود عندك
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  // هنا يتم استدعاء authService.register
  res.status(201).json({ message: 'User registered (mock)', email });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  // هنا يتم استدعاء authService.login
  // نرجع توكن وهمي للتجربة
  res.status(200).json({
    message: 'Login successful (mock)',
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock.token',
    refreshToken: 'mock_refresh_token',
  });
});

app.get('/api/auth/profile', (req, res) => {
  // هنا يتم التحقق من التوكن
  res.json({ id: 1, name: 'Test User', email: 'test@example.com' });
});

// ============================================================
// 3. PRODUCTS ROUTES (مسارات المنتجات)
// ============================================================
app.get('/api/products', (req, res) => {
  // هنا يتم استدعاء productService.getAllProducts
  res.json([
    { id: 1, name: 'Product A', price: 100 },
    { id: 2, name: 'Product B', price: 200 },
  ]);
});

app.post('/api/products', (req, res) => {
  const { name, price } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  // هنا يتم استدعاء productService.createProduct
  res.status(201).json({ id: 3, name, price });
});

app.get('/api/categories', (req, res) => {
  res.json([{ id: 1, name: 'Electronics' }, { id: 2, name: 'Clothing' }]);
});

// ============================================================
// 4. NOTIFICATIONS ROUTES (مسارات الإشعارات)
// ============================================================
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

// ============================================================
// 5. TRANSACTIONS ROUTES (مسارات المعاملات)
// ============================================================
app.get('/api/transactions', (req, res) => {
  res.json([{ id: 1, amount: 500, status: 'completed' }]);
});

app.get('/api/transactions/stats', (req, res) => {
  res.json({ total: 100, completed: 80, pending: 20 });
});

// ============================================================
// 6. EXCHANGES ROUTES (مسارات التبادلات)
// ============================================================
app.get('/api/exchanges', (req, res) => {
  res.json([{ id: 1, productA: 'Product A', productB: 'Product B' }]);
});

app.get('/api/exchanges/:id', (req, res) => {
  res.json({ id: req.params.id, productA: 'Product A', productB: 'Product B' });
});

// ============================================================
// 7. PURCHASES ROUTES (مسارات المشتريات)
// ============================================================
app.get('/api/purchases', (req, res) => {
  res.json([{ id: 1, productId: 1, buyerId: 2 }]);
});

app.get('/api/purchases/:id', (req, res) => {
  res.json({ id: req.params.id, productId: 1, buyerId: 2 });
});

// ============================================================
// 8. 404 HANDLER (للمسارات غير الموجودة)
// ============================================================
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// ============================================================
// 9. GLOBAL ERROR HANDLER (لمعالجة الأخطاء)
// ============================================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

module.exports = app;