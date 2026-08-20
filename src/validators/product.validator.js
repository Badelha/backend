const { body, param, query } = require('express-validator');

const createProductValidator = [
  body('categoryId')
    .notEmpty().withMessage('Category is required')
    .isInt({ min: 1 }).withMessage('Category ID must be a positive integer')
    .toInt(),

  body('cityId')
    .notEmpty().withMessage('City is required')
    .isInt({ min: 1 }).withMessage('City ID must be a positive integer')
    .toInt(),

  body('title')
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters')
    .trim(),

  body('description')
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10 }).withMessage('Description must be at least 10 characters')
    .trim(),

  body('condition')
    .notEmpty().withMessage('Condition is required')
    .isIn(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'])
    .withMessage('Condition must be NEW, LIKE_NEW, GOOD, FAIR, or POOR'),

  body('price')
    .optional({ values: 'null' })
    .isFloat({ min: 0 }).withMessage('Price must be a positive number')
    .toFloat(),

  body('exchangePreference')
    .optional()
    .isIn(['EXCHANGE_ONLY', 'PURCHASE_ONLY', 'BOTH'])
    .withMessage('Exchange preference must be EXCHANGE_ONLY, PURCHASE_ONLY, or BOTH'),

  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array')
    .custom((value) => {
      if (value && value.length > 0) {
        return value.every((id) => Number.isInteger(id) && id > 0);
      }
      return true;
    }).withMessage('Each tag ID must be a positive integer'),

  body('additionalInfo')
    .optional()
    .isLength({ max: 500 }).withMessage('Additional info must be less than 500 characters')
    .trim(),
];

const updateProductValidator = [
  param('id')
    .notEmpty().withMessage('Product ID is required')
    .isInt({ min: 1 }).withMessage('Product ID must be a positive integer')
    .toInt(),

  body('categoryId')
    .optional()
    .isInt({ min: 1 }).withMessage('Category ID must be a positive integer')
    .toInt(),

  body('cityId')
    .optional()
    .isInt({ min: 1 }).withMessage('City ID must be a positive integer')
    .toInt(),

  body('title')
    .optional()
    .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters')
    .trim(),

  body('description')
    .optional()
    .isLength({ min: 10 }).withMessage('Description must be at least 10 characters')
    .trim(),

  body('condition')
    .optional()
    .isIn(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'])
    .withMessage('Condition must be NEW, LIKE_NEW, GOOD, FAIR, or POOR'),

  body('price')
    .optional({ values: 'null' })
    .isFloat({ min: 0 }).withMessage('Price must be a positive number')
    .toFloat(),

  body('exchangePreference')
    .optional()
    .isIn(['EXCHANGE_ONLY', 'PURCHASE_ONLY', 'BOTH'])
    .withMessage('Exchange preference must be EXCHANGE_ONLY, PURCHASE_ONLY, or BOTH'),

  body('additionalInfo')
    .optional()
    .isLength({ max: 500 }).withMessage('Additional info must be less than 500 characters')
    .trim(),
];

const getProductsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('categoryId')
    .optional()
    .isInt({ min: 1 }).withMessage('Category ID must be a positive integer')
    .toInt(),

  query('cityId')
    .optional()
    .isInt({ min: 1 }).withMessage('City ID must be a positive integer')
    .toInt(),

  query('condition')
    .optional()
    .isIn(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'])
    .withMessage('Invalid condition value'),

  query('minPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Minimum price must be a positive number')
    .toFloat(),

  query('maxPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Maximum price must be a positive number')
    .toFloat(),

  query('search')
    .optional()
    .isLength({ max: 100 }).withMessage('Search term must be less than 100 characters')
    .trim(),

  query('sort')
    .optional()
    .isIn(['newest', 'price', 'price_desc', 'rating'])
    .withMessage('Invalid sort value'),
];

const getProductByIdValidator = [
  param('id')
    .notEmpty().withMessage('Product ID is required')
    .isInt({ min: 1 }).withMessage('Product ID must be a positive integer')
    .toInt(),
];

const addProductImageValidator = [
  param('id')
    .notEmpty().withMessage('Product ID is required')
    .isInt({ min: 1 }).withMessage('Product ID must be a positive integer')
    .toInt(),
];

const deleteProductImageValidator = [
  param('id')
    .notEmpty().withMessage('Product ID is required')
    .isInt({ min: 1 }).withMessage('Product ID must be a positive integer')
    .toInt(),

  param('imageId')
    .notEmpty().withMessage('Image ID is required')
    .isInt({ min: 1 }).withMessage('Image ID must be a positive integer')
    .toInt(),
];

module.exports = {
  createProductValidator,
  updateProductValidator,
  getProductsValidator,
  getProductByIdValidator,
  addProductImageValidator,
  deleteProductImageValidator,
};