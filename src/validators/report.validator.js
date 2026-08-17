const { body, param, query } = require('express-validator');

const createReportValidator = [
  body('reportedUserId')
    .notEmpty().withMessage('Reported user ID is required')
    .isInt({ min: 1 }).withMessage('Reported user ID must be a positive integer')
    .toInt(),

  body('productId')
    .optional()
    .isInt({ min: 1 }).withMessage('Product ID must be a positive integer')
    .toInt(),

  body('reportType')
    .notEmpty().withMessage('Report type is required')
    .isIn(['FRAUD', 'SPAM', 'FAKE_PRODUCT', 'INAPPROPRIATE_CONTENT', 'INCORRECT_REQUEST', 'OTHER'])
    .withMessage('Invalid report type'),

  body('description')
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters')
    .trim(),
];

const getReportsValidator = [
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
    .isIn(['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED'])
    .withMessage('Invalid status value'),

  query('reportType')
    .optional()
    .isIn(['FRAUD', 'SPAM', 'FAKE_PRODUCT', 'INAPPROPRIATE_CONTENT', 'INCORRECT_REQUEST', 'OTHER'])
    .withMessage('Invalid report type'),
];

const getReportByIdValidator = [
  param('id')
    .notEmpty().withMessage('Report ID is required')
    .isInt({ min: 1 }).withMessage('Report ID must be a positive integer')
    .toInt(),
];

const updateReportStatusValidator = [
  param('id')
    .notEmpty().withMessage('Report ID is required')
    .isInt({ min: 1 }).withMessage('Report ID must be a positive integer')
    .toInt(),

  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED'])
    .withMessage('Status must be PENDING, REVIEWING, RESOLVED, or DISMISSED'),

  body('response')
    .optional()
    .isLength({ max: 500 }).withMessage('Response cannot exceed 500 characters')
    .trim(),
];

const deleteReportValidator = [
  param('id')
    .notEmpty().withMessage('Report ID is required')
    .isInt({ min: 1 }).withMessage('Report ID must be a positive integer')
    .toInt(),
];

module.exports = {
  createReportValidator,
  getReportsValidator,
  getReportByIdValidator,
  updateReportStatusValidator,
  deleteReportValidator,
};