require('dotenv').config();

const app = require('./app');
const config = require('./src/config/env');
const prisma = require('./src/config/prisma');

const PORT = config.PORT || 3000;

// ============================================================
// START SERVER
// ============================================================

const server = app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ==========================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`📦 Environment: ${config.NODE_ENV}`);
  console.log(`🗄️  Database: ${config.DATABASE_URL ? 'Connected ✅' : 'Not configured ❌'}`);
  console.log('🚀 ==========================================');
  console.log('');
  console.log('📋 Available Endpoints:');
  console.log(`   GET  /health`);
  console.log(`   POST /api/auth/register`);
  console.log(`   POST /api/auth/login`);
  console.log(`   GET  /api/auth/profile`);
  console.log(`   GET  /api/products`);
  console.log(`   GET  /api/categories`);
  console.log('');
  console.log('📝 Press Ctrl+C to stop');
  console.log('');
});

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

const shutdown = async (signal) => {
  console.log('');
  console.log(`⚠️  ${signal} signal received: shutting down gracefully...`);

  // Close HTTP server
  server.close(async () => {
    console.log('✅ HTTP server closed');

    // Disconnect database
    try {
      await prisma.$disconnect();
      console.log('✅ Database disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting database:', error);
    }

    console.log('👋 Server shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 10 seconds if not closed
  setTimeout(() => {
    console.error('❌ Force shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  shutdown('uncaughtException');
});

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled Rejection:', error);
  shutdown('unhandledRejection');
});

module.exports = server;