const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { successResponse, errorResponse } = require('../utils/response');
const { isAllowedOrigin } = require('../utils/origins');
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../validators/auth.validator');

// ============= Dev/Test Only Routes =============
// These routes are only available in development mode for automated testing
if (process.env.NODE_ENV === 'development') {
  const prisma = require('../config/prisma');

  // Get latest email verification token for a user (for Postman automated tests)
  router.get('/dev/email-verification-token', async (req, res) => {
    try {
      const { email } = req.query;
      if (!email) return errorResponse(res, 400, 'email query param required');
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return errorResponse(res, 404, 'User not found');
      const record = await prisma.emailVerification.findFirst({
        where: { user_id: user.user_id, is_used: false },
        orderBy: { created_at: 'desc' },
      });
      if (!record) return errorResponse(res, 404, 'No unused verification token found');
      successResponse(res, 200, { token: record.token }, 'Email verification token retrieved');
    } catch (err) {
      errorResponse(res, 500, err.message);
    }
  });

  // Get latest password reset token for a user (for Postman automated tests)
  router.get('/dev/password-reset-token', async (req, res) => {
    try {
      const { email } = req.query;
      if (!email) return errorResponse(res, 400, 'email query param required');
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return errorResponse(res, 404, 'User not found');
      const record = await prisma.passwordReset.findFirst({
        where: { user_id: user.user_id, is_used: false },
        orderBy: { created_at: 'desc' },
      });
      if (!record) return errorResponse(res, 404, 'No unused reset token found');
      successResponse(res, 200, { token: record.token }, 'Password reset token retrieved');
    } catch (err) {
      errorResponse(res, 500, err.message);
    }
  });
}

// ============= Public Routes =============

/**
 * @route   POST /api/auth/register
 * @body    {string} city - Optional Gaza region from dropdown, e.g. "Gaza"
 * @body    {string} address - Optional detailed address, e.g. "Al Remal Street"
 */
router.post('/register', registerValidator, validate, AuthController.register);

// Login user
router.post('/login', loginValidator, validate, AuthController.login);

// Refresh access token
router.post('/refresh-token', (req, res, next) => {
  if (!isAllowedOrigin(req.get('Origin'))) {
    return errorResponse(res, 403, 'Refresh requests require an allowed browser origin');
  }
  next();
}, AuthController.refreshToken);

// Verify email
router.get('/verify-email', AuthController.verifyEmail);

// Forgot password - send reset email
router.post('/forgot-password', forgotPasswordValidator, validate, AuthController.forgotPassword);

// Reset password with token
router.post('/reset-password', resetPasswordValidator, validate, AuthController.resetPassword);

// ============= Protected Routes =============

// Get user profile
router.get('/profile', authenticate, AuthController.getProfile);

// Logout user
router.post('/logout', authenticate, AuthController.logout);

module.exports = router;