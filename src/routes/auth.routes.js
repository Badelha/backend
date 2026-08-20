const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
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
      if (!email) return res.status(400).json({ error: 'email query param required' });
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(404).json({ error: 'User not found' });
      const record = await prisma.emailVerification.findFirst({
        where: { user_id: user.user_id, is_used: false },
        orderBy: { created_at: 'desc' },
      });
      if (!record) return res.status(404).json({ error: 'No unused verification token found' });
      res.json({ token: record.token });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get latest password reset token for a user (for Postman automated tests)
  router.get('/dev/password-reset-token', async (req, res) => {
    try {
      const { email } = req.query;
      if (!email) return res.status(400).json({ error: 'email query param required' });
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(404).json({ error: 'User not found' });
      const record = await prisma.passwordReset.findFirst({
        where: { user_id: user.user_id, is_used: false },
        orderBy: { created_at: 'desc' },
      });
      if (!record) return res.status(404).json({ error: 'No unused reset token found' });
      res.json({ token: record.token });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

// ============= Public Routes =============

// Register new user
router.post('/register', registerValidator, validate, AuthController.register);

// Login user
router.post('/login', loginValidator, validate, AuthController.login);

// Refresh access token
router.post('/refresh-token', AuthController.refreshToken);

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