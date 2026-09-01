const ProductService = require('../services/product.service');
const { successResponse, errorResponse } = require('../utils/response');

class ProductController {
  /**
   * Create a new product
   * POST /api/products
   */
  static async createProduct(req, res) {
    try {
      const productData = {
        ...req.body,
        userId: req.user.user_id,
      };
      const product = await ProductService.createProduct(productData);
      successResponse(res, 201, product, 'Product created successfully');
    } catch (error) {
      const errorMap = {
        'CATEGORY_NOT_FOUND': { status: 404, message: 'Category not found' },
        'CITY_NOT_FOUND': { status: 404, message: 'City not found' },
      };
      const mapped = errorMap[error.message];
      if (mapped) {
        return errorResponse(res, mapped.status, mapped.message);
      }
      errorResponse(res, 400, error.message);
    }
  }

  /**
   * Get all products with filters
   * GET /api/products
   */
  static async getAllProducts(req, res) {
    try {
      const { products, total, page, limit } = await ProductService.getAllProducts(req.query);
      successResponse(res, 200, {
        products,
        pagination: {
          page: parseInt(page || 1),
          limit: parseInt(limit || 20),
          totalItems: total,
          totalPages: Math.ceil(total / (limit || 20)),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      }, 'Products retrieved successfully');
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  /**
   * Get product by ID
   * GET /api/products/:id
   */
  static async getProductById(req, res) {
    try {
      const product = await ProductService.getProductById(req.params.id);
      successResponse(res, 200, product, 'Product retrieved successfully');
    } catch (error) {
      const errorMap = {
        'PRODUCT_NOT_FOUND': { status: 404, message: 'Product not found' },
      };
      const mapped = errorMap[error.message];
      if (mapped) {
        return errorResponse(res, mapped.status, mapped.message);
      }
      errorResponse(res, 500, error.message);
    }
  }

  /**
   * Update product
   * PUT /api/products/:id
   */
  static async updateProduct(req, res) {
    try {
      const product = await ProductService.updateProduct(
        req.params.id,
        req.user.user_id,
        req.body
      );
      successResponse(res, 200, product, 'Product updated successfully');
    } catch (error) {
      const errorMap = {
        'PRODUCT_NOT_FOUND': { status: 404, message: 'Product not found' },
        'NOT_OWNER': { status: 403, message: 'You can only update your own products' },
        'CATEGORY_NOT_FOUND': { status: 404, message: 'Category not found' },
        'CITY_NOT_FOUND': { status: 404, message: 'City not found' },
      };
      const mapped = errorMap[error.message];
      if (mapped) {
        return errorResponse(res, mapped.status, mapped.message);
      }
      errorResponse(res, 400, error.message);
    }
  }

  /**
   * Delete product (soft delete)
   * DELETE /api/products/:id
   */
  static async deleteProduct(req, res) {
    try {
      const result = await ProductService.deleteProduct(
        req.params.id,
        req.user.user_id
      );
      successResponse(res, 200, result, 'Product deleted successfully');
    } catch (error) {
      const errorMap = {
        'PRODUCT_NOT_FOUND': { status: 404, message: 'Product not found' },
        'NOT_OWNER': { status: 403, message: 'You can only delete your own products' },
      };
      const mapped = errorMap[error.message];
      if (mapped) {
        return errorResponse(res, mapped.status, mapped.message);
      }
      errorResponse(res, 400, error.message);
    }
  }

  /**
   * Get user's own products
   * GET /api/products/my/listings
   */
  static async getMyProducts(req, res) {
    try {
      const { products, total, page, limit } = await ProductService.getAllProducts({
        ...req.query,
        userId: req.user.user_id,
      });
      successResponse(res, 200, {
        products,
        pagination: {
          page: parseInt(page || 1),
          limit: parseInt(limit || 20),
          totalItems: total,
          totalPages: Math.ceil(total / (limit || 20)),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      }, 'My products retrieved successfully');
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  /**
   * Get featured products
   * GET /api/products/featured
   */
  static async getFeaturedProducts(req, res) {
    try {
      const limit = req.query.limit || 10;
      const products = await ProductService.getFeaturedProducts(limit);
      successResponse(res, 200, products, 'Featured products retrieved successfully');
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  /**
   * Add image to product
   * POST /api/products/:id/images
   */
  static async addProductImage(req, res) {
    try {
      const productId = req.params.id;
      const userId = req.user.user_id;
      
      // Check if file was uploaded
      if (!req.file) {
        return errorResponse(res, 400, 'Image file is required');
      }

      // Get the image URL from multer/cloudinary
      const imageUrl = req.file.path || req.file.filename || req.file.url;

      const image = await ProductService.addProductImage(productId, userId, imageUrl);
      successResponse(res, 201, image, 'Image added successfully');
    } catch (error) {
      const errorMap = {
        'PRODUCT_NOT_FOUND': { status: 404, message: 'Product not found' },
        'NOT_OWNER': { status: 403, message: 'You can only add images to your own products' },
        'MAX_IMAGES': { status: 400, message: 'Maximum 5 images allowed per product' },
      };
      const mapped = errorMap[error.message];
      if (mapped) {
        return errorResponse(res, mapped.status, mapped.message);
      }
      errorResponse(res, 400, error.message);
    }
  }

  /**
   * Delete image from product
   * DELETE /api/products/:id/images/:imageId
   */
  static async deleteProductImage(req, res) {
    try {
      const productId = req.params.id;
      const imageId = req.params.imageId;
      const userId = req.user.user_id;

      const result = await ProductService.deleteProductImage(productId, imageId, userId);
      successResponse(res, 200, result, 'Image deleted successfully');
    } catch (error) {
      const errorMap = {
        'PRODUCT_NOT_FOUND': { status: 404, message: 'Product not found' },
        'NOT_OWNER': { status: 403, message: 'You can only delete images from your own products' },
        'IMAGE_NOT_FOUND': { status: 404, message: 'Image not found' },
      };
      const mapped = errorMap[error.message];
      if (mapped) {
        return errorResponse(res, mapped.status, mapped.message);
      }
      errorResponse(res, 400, error.message);
    }
  }

  /**
   * Feature/unfeature product (admin only)
   * PATCH /api/products/:id/feature
   */
  static async featureProduct(req, res) {
    try {
      const productId = req.params.id;
      const durationDays = req.body.durationDays || 7;

      const product = await ProductService.featureProduct(productId, durationDays);
      successResponse(res, 200, product, 'Product featured successfully');
    } catch (error) {
      const errorMap = {
        'PRODUCT_NOT_FOUND': { status: 404, message: 'Product not found' },
      };
      const mapped = errorMap[error.message];
      if (mapped) {
        return errorResponse(res, mapped.status, mapped.message);
      }
      errorResponse(res, 400, error.message);
    }
  }

  /**
   * Unfeature product (admin only)
   * PATCH /api/products/:id/unfeature
   */
  static async unfeatureProduct(req, res) {
    try {
      const productId = req.params.id;

      const product = await ProductService.unfeatureProduct(productId);
      successResponse(res, 200, product, 'Product unfeatured successfully');
    } catch (error) {
      const errorMap = {
        'PRODUCT_NOT_FOUND': { status: 404, message: 'Product not found' },
      };
      const mapped = errorMap[error.message];
      if (mapped) {
        return errorResponse(res, mapped.status, mapped.message);
      }
      errorResponse(res, 400, error.message);
    }
  }

  /**
   * Get products by category
   * GET /api/products/category/:categoryId
   */
  static async getProductsByCategory(req, res) {
    try {
      const categoryId = req.params.categoryId;
      const { products, total, page, limit } = await ProductService.getAllProducts({
        ...req.query,
        categoryId,
      });
      successResponse(res, 200, {
        products,
        pagination: {
          page: parseInt(page || 1),
          limit: parseInt(limit || 20),
          totalItems: total,
          totalPages: Math.ceil(total / (limit || 20)),
        },
      }, 'Products by category retrieved successfully');
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  /**
   * Get products by city
   * GET /api/products/city/:cityId
   */
  static async getProductsByCity(req, res) {
    try {
      const cityId = req.params.cityId;
      const { products, total, page, limit } = await ProductService.getAllProducts({
        ...req.query,
        cityId,
      });
      successResponse(res, 200, {
        products,
        pagination: {
          page: parseInt(page || 1),
          limit: parseInt(limit || 20),
          totalItems: total,
          totalPages: Math.ceil(total / (limit || 20)),
        },
      }, 'Products by city retrieved successfully');
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  /**
   * Get products by tags
   * GET /api/products/tag/:tagId
   */
  static async getProductsByTag(req, res) {
    try {
      const tagId = req.params.tagId;
      const { products, total, page, limit } = await ProductService.getAllProducts({
        ...req.query,
        tagId,
      });
      successResponse(res, 200, {
        products,
        pagination: {
          page: parseInt(page || 1),
          limit: parseInt(limit || 20),
          totalItems: total,
          totalPages: Math.ceil(total / (limit || 20)),
        },
      }, 'Products by tag retrieved successfully');
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  /**
   * Search products by keyword
   * GET /api/products/search?q=keyword
   */
  static async searchProducts(req, res) {
    try {
      const { q, ...filters } = req.query;
      if (!q || q.trim().length < 2) {
        return errorResponse(res, 400, 'Search term must be at least 2 characters');
      }

      const { products, total, page, limit } = await ProductService.getAllProducts({
        ...filters,
        search: q.trim(),
      });

      successResponse(res, 200, {
        products,
        pagination: {
          page: parseInt(page || 1),
          limit: parseInt(limit || 20),
          totalItems: total,
          totalPages: Math.ceil(total / (limit || 20)),
        },
        searchTerm: q.trim(),
      }, 'Search results retrieved successfully');
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  /**
   * Get product statistics (admin only)
   * GET /api/products/stats
   */
  static async getProductStats(req, res) {
    try {
      const stats = await ProductService.getProductStats();
      successResponse(res, 200, stats, 'Product statistics retrieved successfully');
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }
}

module.exports = ProductController;