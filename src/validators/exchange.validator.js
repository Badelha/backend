const { body, param, query } = require('express-validator');

const createExchangeValidator = [
  body('targetUserId')
    .notEmpty().withMessage('Target user is required')
    .isInt({ min: 1 }).withMessage('Target user ID must be a positive integer')
    .toInt(),

  body('initiatorProductId')
    .notEmpty().withMessage('Your product is required')
    .isInt({ min: 1 }).withMessage('Product ID must be a positive integer')
    .toInt(),

  body('targetProductId')
    .notEmpty().withMessage('Target product is required')
    .isInt({ min: 1 }).withMessage('Product ID must be a positive integer')
    .toInt(),

  body('message')
    .optional()
    .isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters')
    .trim(),
];

const getExchangeRequestsValidator = [
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
    .isIn(['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED'])
    .withMessage('Invalid status value'),
];

const getExchangeRequestByIdValidator = [
  param('id')
    .notEmpty().withMessage('Exchange request ID is required')
    .isInt({ min: 1 }).withMessage('Exchange request ID must be a positive integer')
    .toInt(),
];

const acceptExchangeValidator = [
  param('id')
    .notEmpty().withMessage('Exchange request ID is required')
    .isInt({ min: 1 }).withMessage('Exchange request ID must be a positive integer')
    .toInt(),
];

const rejectExchangeValidator = [
  param('id')
    .notEmpty().withMessage('Exchange request ID is required')
    .isInt({ min: 1 }).withMessage('Exchange request ID must be a positive integer')
    .toInt(),

  body('reason')
    .optional()
    .isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
    .trim(),
];

const completeExchangeValidator = [
  param('id')
    .notEmpty().withMessage('Exchange request ID is required')
    .isInt({ min: 1 }).withMessage('Exchange request ID must be a positive integer')
    .toInt(),
];

const cancelExchangeValidator = [
  param('id')
    .notEmpty().withMessage('Exchange request ID is required')
    .isInt({ min: 1 }).withMessage('Exchange request ID must be a positive integer')
    .toInt(),
];

module.exports = {
  createExchangeValidator,
  getExchangeRequestsValidator,
  getExchangeRequestByIdValidator,
  acceptExchangeValidator,
  rejectExchangeValidator,
  completeExchangeValidator,
  cancelExchangeValidator,
};