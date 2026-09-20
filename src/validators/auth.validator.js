const { body, param, query } = require('express-validator');
const { GAZA_CITIES, isAllowedGazaCity } = require('../constants/gazaRegions');

const cityFieldValidator = (field = 'city') =>
  body(field)
    .optional({ values: 'falsy' })
    .isString().withMessage('City must be a string')
    .trim()
    .custom((value) => {
      if (!isAllowedGazaCity(value)) {
        throw new Error(`City must be one of: ${GAZA_CITIES.join(', ')}`);
      }
      return true;
    });

const addressFieldValidator = [
  body('address')
    .optional({ values: 'null' })
    .isString().withMessage('Address must be a string')
    .trim()
    .isLength({ max: 500 }).withMessage('Address must be at most 500 characters'),
];

const registerValidator = [
  body('fullName')
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Full name must be between 3 and 100 characters')
    .trim(),

  body('phoneNumber')
    .notEmpty().withMessage('Phone number is required')
    .matches(/^05[0-9]{8}$/).withMessage('Invalid Palestinian phone number format (e.g., 0599123456)')
    .isLength({ min: 10, max: 10 }).withMessage('Phone number must be exactly 10 characters'),

  ...addressFieldValidator,
  cityFieldValidator('city'),

  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),

  body('cityId')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 }).withMessage('City ID must be a positive integer')
    .toInt(),
];

const loginValidator = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

const forgotPasswordValidator = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
];

const resetPasswordValidator = [
  body('token')
    .notEmpty().withMessage('Token is required')
    .isLength({ min: 32 }).withMessage('Invalid token format'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/).withMessage('Password must contain at least one number'),
];

const refreshTokenValidator = [
  body('refreshToken')
    .optional(),
];

const updateProfileValidator = [
  body('fullName')
    .optional()
    .isLength({ min: 3, max: 100 }).withMessage('Full name must be between 3 and 100 characters')
    .trim(),

  body('phoneNumber')
    .optional()
    .matches(/^05[0-9]{8}$/).withMessage('Invalid Palestinian phone number format'),

  ...addressFieldValidator,
  cityFieldValidator('city'),

  body('cityId')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 }).withMessage('City ID must be a positive integer')
    .toInt(),
];

module.exports = {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  refreshTokenValidator,
  updateProfileValidator,
  cityFieldValidator,
  addressFieldValidator,
};
