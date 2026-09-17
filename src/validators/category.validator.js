const { body, param } = require('express-validator');

const id = param('id').isInt({ min: 1 }).withMessage('Category ID must be a positive integer').toInt();
const name = body('categoryName').trim().notEmpty().withMessage('Category name is required').isLength({ max: 50 }).withMessage('Category name cannot exceed 50 characters');

const createCategoryValidator = [name, body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters')];
const updateCategoryValidator = [id, body('categoryName').optional().trim().notEmpty().isLength({ max: 50 }), body('description').optional().trim().isLength({ max: 1000 })];
const getCategoryByIdValidator = [id];
const deleteCategoryValidator = [id];

module.exports = { createCategoryValidator, updateCategoryValidator, getCategoryByIdValidator, deleteCategoryValidator };
