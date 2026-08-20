const { body, param, query } = require('express-validator');

const updateProfileValidator = [
  body('fullName')
    .optional()
    .isLength({ min: 3, max: 100 }).withMessage('Full name must be between 3 and 100 characters')
    .trim()
    .matches(/^[a-zA-Z\u0600-\u06FF\s]+$/).withMessage('Full name can only contain letters and spaces'),

  body('phoneNumber')
    .optional()
    .matches(/^05[0-9]{8}$/).withMessage('Invalid Palestinian phone number format (e.g., 0599123456)')
    .isLength({ min: 10, max: 10 }).withMessage('Phone number must be exactly 10 characters'),

  body('address')
    .optional()
    .isLength({ min: 5, max: 255 }).withMessage('Address must be between 5 and 255 characters')
    .trim(),

  body('cityId')
    .optional()
    .isInt({ min: 1 }).withMessage('City ID must be a positive integer')
    .toInt(),
];

const updateUserStatusValidator = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('User ID must be a positive integer')
    .toInt(),

  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['ACTIVE', 'SUSPENDED', 'BANNED']).withMessage('Status must be ACTIVE, SUSPENDED, or BANNED'),
];

const getUsersValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('search')
    .optional()
    .isLength({ max: 100 }).withMessage('Search term must be less than 100 characters')
    .trim(),

  query('accountStatus')
    .optional()
    .isIn(['ACTIVE', 'SUSPENDED', 'BANNED', 'PENDING_VERIFICATION'])
    .withMessage('Invalid account status'),
];

const getUserByIdValidator = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('User ID must be a positive integer')
    .toInt(),
];

module.exports = {
  updateProfileValidator,
  updateUserStatusValidator,
  getUsersValidator,
  getUserByIdValidator,
};