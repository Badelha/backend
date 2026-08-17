const AuthService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/response');
const config = require('../config/env');

class AuthController {
  static async register(req, res) {
    try {
      const result = await AuthService.register(req.body);
      successResponse(res, 201, result, 'User registered successfully');
    } catch (error) {
      const errorMap = {
        'EMAIL_ALREADY_EXISTS': { status: 409, message: 'Email already exists' },
        'PHONE_ALREADY_EXISTS': { status: 409, message: 'Phone number already exists' },
      };
      const mapped = errorMap[error.message];
      if (mapped) {
        return errorResponse(res, mapped.status, mapped.message);
      }
      errorResponse(res, 400, error.message);
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/api/auth/refresh-token',
      });

      successResponse(res, 200, result, 'Login successful');
    } catch (error) {
      const errorMap = {
        'INVALID_CREDENTIALS': { status: 401, message: 'Invalid email or password' },
        'ACCOUNT_BANNED': { status: 403, message: 'Account is banned' },
        'ACCOUNT_SUSPENDED': { status: 403, message: 'Account is suspended' },
      };
      const mapped = errorMap[error.message];
      if (mapped) {
        return errorResponse(res, mapped.status, mapped.message);
      }
      errorResponse(res, 400, error.message);
    }
  }

  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.cookies;
      if (!refreshToken) {
        return errorResponse(res, 401, 'Refresh token required');
      }

      const tokens = await AuthService.refreshToken(refreshToken);
      successResponse(res, 200, tokens, 'Token refreshed successfully');
    } catch (error) {
      const errorMap = {
        'INVALID_TOKEN': { status: 401, message: 'Invalid or expired token' },
        'ACCOUNT_BANNED': { status: 403, message: 'Account is banned' },
      };
      const mapped = errorMap[error.message];
      if (mapped) {
        return errorResponse(res, mapped.status, mapped.message);
      }
      errorResponse(res, 401, error.message);
    }
  }

  static async logout(req, res) {
    try {
      await AuthService.logout(req.user.user_id);
      res.clearCookie('refreshToken', {
        path: '/api/auth/refresh-token',
      });
      successResponse(res, 200, null, 'Logout successful');
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  static async verifyEmail(req, res) {
    try {
      const { token } = req.query;
      if (!token) {
        return errorResponse(res, 400, 'Verification token required');
      }

      const result = await AuthService.verifyEmail(token);
      successResponse(res, 200, result, 'Email verified successfully');
    } catch (error) {
      const errorMap = {
        'INVALID_TOKEN': { status: 400, message: 'Invalid or expired token' },
      };
      const mapped = errorMap[error.message];
      if (mapped) {
        return errorResponse(res, mapped.status, mapped.message);
      }
      errorResponse(res, 400, error.message);
    }
  }

  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const result = await AuthService.forgotPassword(email);
      successResponse(res, 200, result, 'Password reset email sent');
    } catch (error) {
      const errorMap = {
        'USER_NOT_FOUND': { status: 404, message: 'User not found' },
      };
      const mapped = errorMap[error.message];
      if (mapped) {
        return errorResponse(res, mapped.status, mapped.message);
      }
      errorResponse(res, 400, error.message);
    }
  }

  static async resetPassword(req, res) {
    try {
      const { token, password } = req.body;
      const result = await AuthService.resetPassword(token, password);
      successResponse(res, 200, result, 'Password reset successfully');
    } catch (error) {
      const errorMap = {
        'INVALID_TOKEN': { status: 400, message: 'Invalid or expired token' },
      };
      const mapped = errorMap[error.message];
      if (mapped) {
        return errorResponse(res, mapped.status, mapped.message);
      }
      errorResponse(res, 400, error.message);
    }
  }

  static async getProfile(req, res) {
    try {
      const user = await AuthService.getProfile(req.user.user_id);
      successResponse(res, 200, user, 'Profile retrieved successfully');
    } catch (error) {
      const errorMap = {
        'USER_NOT_FOUND': { status: 404, message: 'User not found' },
      };
      const mapped = errorMap[error.message];
      if (mapped) {
        return errorResponse(res, mapped.status, mapped.message);
      }
      errorResponse(res, 500, error.message);
    }
  }
}

module.exports = AuthController;