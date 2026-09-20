require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');

// استيراد المسارات الحقيقية
const routes = require('./routes');

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
app.use('/api', routes);

// ============================================================
// 3. 404 HANDLER (للمسارات غير الموجودة)
// ============================================================
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// ============================================================
// 5. GLOBAL ERROR HANDLER (لمعالجة الأخطاء)
// ============================================================
app.use(errorHandler);

module.exports = app;