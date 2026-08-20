const { body, param, query } = require('express-validator');

const getTransactionsValidator = [
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

  query('type')
    .optional()
    .isIn(['EXCHANGE', 'PURCHASE']).withMessage('Type must be EXCHANGE or PURCHASE'),
];

const getTransactionByIdValidator = [
  param('id')
    .notEmpty().withMessage('Transaction ID is required')
    .isInt({ min: 1 }).withMessage('Transaction ID must be a positive integer')
    .toInt(),
];

const getTransactionHistoryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('transactionType')
    .optional()
    .isIn(['EXCHANGE', 'PURCHASE']).withMessage('Transaction type must be EXCHANGE or PURCHASE'),
];

const getTransactionStatsValidator = [
  // No parameters needed, just authentication
];

module.exports = {
  getTransactionsValidator,
  getTransactionByIdValidator,
  getTransactionHistoryValidator,
  getTransactionStatsValidator,
};