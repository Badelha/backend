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
const CityController = require('../controllers/city.controller');

// ============================================================
// PUBLIC ROUTES
// ============================================================

/**
 * @route   GET /api/users/cities
 * @desc    List Gaza regions for the city dropdown
 * @access  Public
 */
router.get('/cities', CityController.listCities);

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
const v = require('../validators/user.validator');

router.get('/', authenticate, isAdmin, v.getUsersValidator, validate, UserController.getAllUsers);
router.get('/:id', authenticate, v.getUserByIdValidator, validate, UserController.getUserById);
router.put('/profile', authenticate, v.updateProfileValidator, validate, UserController.updateProfile);
router.patch('/:id/status', authenticate, isAdmin, v.updateUserStatusValidator, validate, UserController.updateUserStatus);
router.delete('/:id', authenticate, isAdmin, v.getUserByIdValidator, validate, UserController.deleteUser);

module.exports = router;
