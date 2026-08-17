const { body, param, query } = require('express-validator');

const createRatingValidator = [
  body('entityType')
    .notEmpty().withMessage('Entity type is required')
    .isIn(['EXCHANGE', 'PURCHASE']).withMessage('Entity type must be EXCHANGE or PURCHASE'),

  body('entityId')
    .notEmpty().withMessage('Entity ID is required')
    .isInt({ min: 1 }).withMessage('Entity ID must be a positive integer')
    .toInt(),

  body('ratedUserId')
    .notEmpty().withMessage('Rated user ID is required')
    .isInt({ min: 1 }).withMessage('Rated user ID must be a positive integer')
    .toInt(),

  body('score')
    .notEmpty().withMessage('Rating score is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating score must be between 1 and 5')
    .toInt(),

  body('review')
    .optional()
    .isLength({ max: 500 }).withMessage('Review cannot exceed 500 characters')
    .trim(),
];

const getUserRatingsValidator = [
  param('userId')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('User ID must be a positive integer')
    .toInt(),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
];

const getRatingByIdValidator = [
  param('id')
    .notEmpty().withMessage('Rating ID is required')
    .isInt({ min: 1 }).withMessage('Rating ID must be a positive integer')
    .toInt(),
];

const updateRatingValidator = [
  param('id')
    .notEmpty().withMessage('Rating ID is required')
    .isInt({ min: 1 }).withMessage('Rating ID must be a positive integer')
    .toInt(),

  body('score')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Rating score must be between 1 and 5')
    .toInt(),

  body('review')
    .optional()
    .isLength({ max: 500 }).withMessage('Review cannot exceed 500 characters')
    .trim(),
];

const deleteRatingValidator = [
  param('id')
    .notEmpty().withMessage('Rating ID is required')
    .isInt({ min: 1 }).withMessage('Rating ID must be a positive integer')
    .toInt(),
];

module.exports = {
  createRatingValidator,
  getUserRatingsValidator,
  getRatingByIdValidator,
  updateRatingValidator,
  deleteRatingValidator,
};