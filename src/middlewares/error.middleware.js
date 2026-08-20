// error.middleware.js
const { errorResponse } = require('../utils/response');
const config = require('../config/env');

const errorHandler = (err, req, res, next) => {
  console.error('Error stack:', err.stack);

  // Prisma errors
  if (err.code === 'P2002') {
    return errorResponse(res, 409, 'Duplicate entry', {
      field: err.meta?.target?.[0] || 'unknown',
      message: 'This value already exists',
    });
  }

  if (err.code === 'P2025') {
    return errorResponse(res, 404, 'Resource not found');
  }

  if (err.code === 'P2003') {
    return errorResponse(res, 400, 'Invalid reference', {
      message: 'The referenced record does not exist',
    });
  }

  if (err.code === 'P2010') {
    return errorResponse(res, 500, 'Database error');
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return errorResponse(res, 400, `File too large. Maximum size is ${(config.MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB`);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 401, 'Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 401, 'Token expired');
  }

  // Default error
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  
  // Only show stack in development
  if (config.NODE_ENV === 'development') {
    return errorResponse(res, status, message, { stack: err.stack });
  }

  errorResponse(res, status, message);
};

module.exports = { errorHandler };