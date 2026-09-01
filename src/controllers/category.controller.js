const CategoryService = require('../services/category.service');
const { successResponse, errorResponse } = require('../utils/response');

class CategoryController {
  static async getAllCategories(req, res) {
    try {
      const categories = await CategoryService.getAllCategories();
      successResponse(res, 200, categories, 'Categories retrieved successfully');
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  static async getCategoryById(req, res) {
    try {
      const category = await CategoryService.getCategoryById(req.params.id);
      successResponse(res, 200, category, 'Category retrieved successfully');
    } catch (error) {
      const errorMap = {
        'CATEGORY_NOT_FOUND': { status: 404, message: 'Category not found' },
      };
      const mapped = errorMap[error.message];
      if (mapped) {
        return errorResponse(res, mapped.status, mapped.message);
      }
      errorResponse(res, 500, error.message);
    }
  }

  static async createCategory(req, res) {
    try {
      const category = await CategoryService.createCategory(req.body);
      successResponse(res, 201, category, 'Category created successfully');
    } catch (error) {
      const errorMap = {
        'CATEGORY_EXISTS': { status: 409, message: 'Category already exists' },
      };
      const mapped = errorMap[error.message];
      if (mapped) {
        return errorResponse(res, mapped.status, mapped.message);
      }
      errorResponse(res, 400, error.message);
    }
  }

  static async updateCategory(req, res) {
    try {
      const category = await CategoryService.updateCategory(req.params.id, req.body);
      successResponse(res, 200, category, 'Category updated successfully');
    } catch (error) {
      const errorMap = {
        'CATEGORY_NOT_FOUND': { status: 404, message: 'Category not found' },
      };
      const mapped = errorMap[error.message];
      if (mapped) {
        return errorResponse(res, mapped.status, mapped.message);
      }
      errorResponse(res, 400, error.message);
    }
  }

  static async deleteCategory(req, res) {
    try {
      const result = await CategoryService.deleteCategory(req.params.id);
      successResponse(res, 200, result, 'Category deleted successfully');
    } catch (error) {
      const errorMap = {
        'CATEGORY_NOT_FOUND': { status: 404, message: 'Category not found' },
        'CATEGORY_HAS_PRODUCTS': { status: 400, message: 'Category has products and cannot be deleted' },
        'CATEGORY_HAS_CHILDREN': { status: 400, message: 'Category has subcategories and cannot be deleted' },
      };
      const mapped = errorMap[error.message];
      if (mapped) {
        return errorResponse(res, mapped.status, mapped.message);
      }
      errorResponse(res, 500, error.message);
    }
  }
}

module.exports = CategoryController;