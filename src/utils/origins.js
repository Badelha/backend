const config = require('../config/env');

const allowedOrigins = new Set([
  ...config.CORS_ORIGINS,
  'http://localhost:3001',
].map((origin) => origin.replace(/\/$/, '')));

const isAllowedOrigin = (origin) =>
  typeof origin === 'string' && allowedOrigins.has(origin.replace(/\/$/, ''));

module.exports = { isAllowedOrigin };
