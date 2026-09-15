// Compatibility entry point.
// The complete application and all API routes live in src/app.js.
// Keeping this file allows older start commands and imports to use the real API.

require('dotenv').config();

module.exports = require('./src/app');