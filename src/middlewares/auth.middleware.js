// auth.middleware.js

const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const config = require('../config/env');
const { errorResponse } = require('../utils/response');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return errorResponse(res, 401, 'Authentication required');
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Use findFirst to support filtering by deleted_at
    const user = await prisma.user.findFirst({
      where: {
        user_id: decoded.userId,
        deleted_at: null,
      },
      select: {
        user_id: true,
        full_name: true,
        phone_number: true,
        address: true,
        email: true,
        account_status: true,
        is_verified: true,
        created_at: true,
        last_login: true,
        total_transactions: true,
        city_id: true,
        city: true,
        user_roles: {
          where: { deleted_at: null },
          select: {
            role_id: true,
            user_id: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      return errorResponse(res, 401, 'User not found');
    }

    if (user.account_status === 'BANNED') {
      return errorResponse(res, 403, 'Account is banned');
    }

    if (user.account_status === 'SUSPENDED') {
      return errorResponse(res, 403, 'Account is suspended');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 401, 'Invalid token');
    }
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Token expired');
    }
    console.error('Auth middleware error:', error.stack);
    return errorResponse(res, 500, 'Authentication error');
  }
};
module.exports = {
  authenticate,
};