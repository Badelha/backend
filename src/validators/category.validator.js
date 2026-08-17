const { body, param, query } = require('express-validator');

const createCategoryValidator = [
  body('name')
    .notEmpty().withMessage('Category name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Category name must be between 2 and 50 characters')
    .trim()
    .matches(/^[a-zA-Z\u0600-\u06FF0-9\s-]+$/).withMessage('Category name contains invalid characters'),

  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
    .trim(),

  body('icon')
    .optional()
    .isLength({ max: 50 }).withMessage('Icon must be less than 50 characters')
    .trim(),

  body('parentId')
    .optional()
    .isInt({ min: 1 }).withMessage('Parent category ID must be a positive integer')
    .toInt(),

  body('displayOrder')
    .optional()
    .isInt({ min: 0 }).withMessage('Display order must be a positive integer')
    .toInt(),
];

const updateCategoryValidator = [
  param('id')
    .notEmpty().withMessage('Category ID is required')
    .isInt({ min: 1 }).withMessage('Category ID must be a positive integer')
    .toInt(),

  body('name')
    .optional()
    .isLength({ min: 2, max: 50 }).withMessage('Category name must be between 2 and 50 characters')
    .trim()
    .matches(/^[a-zA-Z\u0600-\u06FF0-9\s-]+$/).withMessage('Category name contains invalid characters'),

  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
    .trim(),

  body('icon')
    .optional()
    .isLength({ max: 50 }).withMessage('Icon must be less than 50 characters')
    .trim(),

  body('displayOrder')
    .optional()
    .isInt({ min: 0 }).withMessage('Display order must be a positive integer')
    .toInt(),
];

const getCategoryByIdValidator = [
  param('id')
    .notEmpty().withMessage('Category ID is required')
    .isInt({ min: 1 }).withMessage('Category ID must be a positive integer')
    .toInt(),
];

const deleteCategoryValidator = [
  param('id')
    .notEmpty().withMessage('Category ID is required')
    .isInt({ min: 1 }).withMessage('Category ID must be a positive integer')
    .toInt(),
];

module.exports = {
  createCategoryValidator,
  updateCategoryValidator,
  getCategoryByIdValidator,
  deleteCategoryValidator,
};