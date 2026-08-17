require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./src/routes/auth.routes');

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

app.use('/api/auth', authRoutes);

app.use(errorHandler);

module.exports = app;