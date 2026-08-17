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
// router.get('/profile', authenticate, AuthController.getProfile);

// Logout user
//router.post('/logout', authenticate, AuthController.logout);

module.exports = router;