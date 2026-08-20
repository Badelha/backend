const { body, param, query } = require('express-validator');

const createPurchaseValidator = [
  body('targetUserId')
    .notEmpty().withMessage('Target user is required')
    .isInt({ min: 1 }).withMessage('Target user ID must be a positive integer')
    .toInt(),

  body('productId')
    .notEmpty().withMessage('Product is required')
    .isInt({ min: 1 }).withMessage('Product ID must be a positive integer')
    .toInt(),

  body('offeredPrice')
    .notEmpty().withMessage('Offered price is required')
    .isFloat({ min: 0.01 }).withMessage('Price must be greater than 0')
    .toFloat(),

  body('message')
    .optional()
    .isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters')
    .trim(),
];

const getPurchaseRequestsValidator = [
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

const getPurchaseRequestByIdValidator = [
  param('id')
    .notEmpty().withMessage('Purchase request ID is required')
    .isInt({ min: 1 }).withMessage('Purchase request ID must be a positive integer')
    .toInt(),
];

const acceptPurchaseValidator = [
  param('id')
    .notEmpty().withMessage('Purchase request ID is required')
    .isInt({ min: 1 }).withMessage('Purchase request ID must be a positive integer')
    .toInt(),
];

const rejectPurchaseValidator = [
  param('id')
    .notEmpty().withMessage('Purchase request ID is required')
    .isInt({ min: 1 }).withMessage('Purchase request ID must be a positive integer')
    .toInt(),

  body('reason')
    .optional()
    .isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
    .trim(),
];

const completePurchaseValidator = [
  param('id')
    .notEmpty().withMessage('Purchase request ID is required')
    .isInt({ min: 1 }).withMessage('Purchase request ID must be a positive integer')
    .toInt(),
];

const cancelPurchaseValidator = [
  param('id')
    .notEmpty().withMessage('Purchase request ID is required')
    .isInt({ min: 1 }).withMessage('Purchase request ID must be a positive integer')
    .toInt(),
];

module.exports = {
  createPurchaseValidator,
  getPurchaseRequestsValidator,
  getPurchaseRequestByIdValidator,
  acceptPurchaseValidator,
  rejectPurchaseValidator,
  completePurchaseValidator,
  cancelPurchaseValidator,
};