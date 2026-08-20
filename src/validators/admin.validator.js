const { body, param, query } = require('express-validator');

const getDashboardValidator = [
  // No parameters needed, just authentication
];

const getSystemStatsValidator = [
  // No parameters needed, just authentication
];

const getActivityLogValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
];

const getUsersListValidator = [
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

  query('status')
    .optional()
    .isIn(['ACTIVE', 'SUSPENDED', 'BANNED', 'PENDING_VERIFICATION'])
    .withMessage('Invalid account status'),
];

const getProductsListValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('status')
    .optional()
    .isIn(['AVAILABLE', 'RESERVED', 'EXCHANGED', 'SOLD', 'REMOVED'])
    .withMessage('Invalid product status'),

  query('search')
    .optional()
    .isLength({ max: 100 }).withMessage('Search term must be less than 100 characters')
    .trim(),
];

const featureProductValidator = [
  param('id')
    .notEmpty().withMessage('Product ID is required')
    .isInt({ min: 1 }).withMessage('Product ID must be a positive integer')
    .toInt(),

  body('durationDays')
    .optional()
    .isInt({ min: 1, max: 30 }).withMessage('Duration must be between 1 and 30 days')
    .toInt(),
];

module.exports = {
  getDashboardValidator,
  getSystemStatsValidator,
  getActivityLogValidator,
  getUsersListValidator,
  getProductsListValidator,
  featureProductValidator,
};