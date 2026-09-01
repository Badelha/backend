const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/category.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  createCategoryValidator,
  updateCategoryValidator,
  getCategoryByIdValidator,
  deleteCategoryValidator,
} = require('../validators/category.validator');

// ============= Public Routes =============
router.get('/', CategoryController.getAllCategories);
router.get('/:id', getCategoryByIdValidator, validate, CategoryController.getCategoryById);

// ============= Admin Only Routes =============
router.post(
  '/',
  authenticate,
  isAdmin,
  createCategoryValidator,
  validate,
  CategoryController.createCategory
);

router.put(
  '/:id',
  authenticate,
  isAdmin,
  updateCategoryValidator,
  validate,
  CategoryController.updateCategory
);

router.delete(
  '/:id',
  authenticate,
  isAdmin,
  deleteCategoryValidator,
  validate,
  CategoryController.deleteCategory
);

module.exports = router;