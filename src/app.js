require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// استيراد المسارات الحقيقية
const routes = require('./routes');

// استيراد معالج الأخطاء
const { errorHandler } = require('./middlewares/error.middleware');
const { errorResponse } = require('./utils/response');
const { isAllowedOrigin } = require('./utils/origins');

const app = express();

// ============================================================
// MIDDLEWARES
// ============================================================
app.use(helmet());
app.use((req, res, next) => {
  const origin = req.get('Origin');
  if (origin && !isAllowedOrigin(origin)) {
    return errorResponse(res, 403, 'Request origin is not allowed');
  }
  next();
});
app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || isAllowedOrigin(origin));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use('/uploads/products', express.static(path.resolve(__dirname, '../uploads/products'), {
  dotfiles: 'deny',
  index: false,
}));

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
app.use('/api', routes);

// ============================================================
// 3. 404 HANDLER (للمسارات غير الموجودة)
// ============================================================
app.use((req, res) => {
  errorResponse(res, 404, 'Route not found');
});

// ============================================================
// 5. GLOBAL ERROR HANDLER (لمعالجة الأخطاء)
// ============================================================
app.use(errorHandler);

module.exports = app;