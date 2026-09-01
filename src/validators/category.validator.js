require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Import Routes
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const productRoutes = require('./src/routes/product.routes');
const categoryRoutes = require('./src/routes/category.routes');

// Import Middleware
const { errorHandler } = require('./src/middlewares/error.middleware');

const app = express();

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// ============================================================
// CORS CONFIGURATION
// ============================================================

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
}));

// ============================================================
// BODY PARSERS
// ============================================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ============================================================
// LOGGING
// ============================================================

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ============================================================
// STATIC FILES
// ============================================================

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============================================================
// API ROUTES
// ============================================================

// Version 1 API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

// ============================================================
// ROOT ROUTE
// ============================================================

app.get('/', (req, res) => {
  res.status(200).json({
    name: 'بدلها - Exchange It Platform',
    version: '1.0.0',
    description: 'Crisis Response Barter System',
    endpoints: {
      health: '/health',
      api: {
        auth: '/api/auth',
        users: '/api/users',
        products: '/api/products',
        categories: '/api/categories',
      },
    },
    documentation: 'https://github.com/your-repo/badlah-exchange',
    status: 'online',
  });
});

// ============================================================
// 404 HANDLER
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// ERROR HANDLER
// ============================================================

app.use(errorHandler);

module.exports = app;