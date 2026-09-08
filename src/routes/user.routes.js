const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  updateProfileValidator,
  updateUserStatusValidator,
  getUsersValidator,
  getUserByIdValidator,
} = require('../validators/user.validator');

// ============================================================
// PUBLIC ROUTES
// ============================================================

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Public
 */
router.get('/:id', getUserByIdValidator, validate, UserController.getUserById);

// ============================================================
// PROTECTED ROUTES (Authentication required)
// ============================================================

/**
 * @route   PUT /api/users/me
 * @desc    Update current user's profile
 * @access  Private
 */
router.put('/me', authenticate, updateProfileValidator, validate, UserController.updateProfile);

// ============================================================
// ADMIN ONLY ROUTES
// ============================================================

/**
 * @route   GET /api/users
 * @desc    Get all users with filters
 * @access  Private (Admin only)
 */
router.get('/', authenticate, isAdmin, getUsersValidator, validate, UserController.getAllUsers);

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Update user account status
 * @access  Private (Admin only)
 */
router.patch(
  '/:id/status',
  authenticate,
  isAdmin,
  updateUserStatusValidator,
  validate,
  UserController.updateUserStatus
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, isAdmin, UserController.deleteUser);

module.exports = router;
