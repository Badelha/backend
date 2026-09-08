const { body, param } = require('express-validator');

// ============================================================
// CREATE CATEGORY
// ============================================================

const createCategoryValidator = [
  body('name')
    .notEmpty().withMessage('Category name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Category name must be between 2 and 100 characters')
    .trim(),

  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
    .trim(),

  body('icon')
    .optional()
    .isString().withMessage('Icon must be a string')
    .trim(),

  body('parentId')
    .optional({ values: 'null' })
    .isInt({ min: 1 }).withMessage('Parent category ID must be a positive integer')
    .toInt(),

  body('displayOrder')
    .optional()
    .isInt({ min: 0 }).withMessage('Display order must be a non-negative integer')
    .toInt(),
];

// ============================================================
// UPDATE CATEGORY
// ============================================================

const updateCategoryValidator = [
  param('id')
    .notEmpty().withMessage('Category ID is required')
    .isInt({ min: 1 }).withMessage('Category ID must be a positive integer')
    .toInt(),

  body('name')
    .optional()
    .isLength({ min: 2, max: 100 }).withMessage('Category name must be between 2 and 100 characters')
    .trim(),

  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
    .trim(),

  body('icon')
    .optional()
    .isString().withMessage('Icon must be a string')
    .trim(),

  body('displayOrder')
    .optional()
    .isInt({ min: 0 }).withMessage('Display order must be a non-negative integer')
    .toInt(),
];

// ============================================================
// GET CATEGORY BY ID
// ============================================================

const getCategoryByIdValidator = [
  param('id')
    .notEmpty().withMessage('Category ID is required')
    .isInt({ min: 1 }).withMessage('Category ID must be a positive integer')
    .toInt(),
];

// ============================================================
// DELETE CATEGORY
// ============================================================

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