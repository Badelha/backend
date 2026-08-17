// server.js
const app = require('./app');
const config = require('./src/config/env');

const PORT = config.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log('🚀 Server running on port', PORT);
  console.log('📍 http://localhost:' + PORT);
  console.log('📦 Environment:', config.NODE_ENV);
  console.log('📦 Database:', config.DATABASE_URL ? 'Connected' : 'Not configured');
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log('\n' + signal + ' signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = server;