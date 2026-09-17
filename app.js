require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');

const routes = require('./src/routes');

const { errorHandler } = require('./src/middlewares/error.middleware');

const app = express();

app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3001',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({
    status: 'OK'
  });
});

app.use('/api', routes);

app.use(errorHandler);
// Compatibility entry point.
// The complete application and all API routes live in src/app.js.
// Keeping this file allows older start commands and imports to use the real API.

require('dotenv').config();

module.exports = require('./src/app');