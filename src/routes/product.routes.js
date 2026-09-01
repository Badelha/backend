const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/product.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { upload, handleUploadError } = require('../middlewares/upload.middleware');
const {
  createProductValidator,
  updateProductValidator,
  getProductsValidator,
  getProductByIdValidator,
  addProductImageValidator,
  deleteProductImageValidator,
} = require('../validators/product.validator');

// ============================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================

/**
 * @route   GET /api/products
 * @desc    Get all products with filters
 * @access  Public
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 20)
 * @query   {number} categoryId - Filter by category ID
 * @query   {number} cityId - Filter by city ID
 * @query   {string} condition - Filter by condition (NEW, LIKE_NEW, GOOD, FAIR, POOR)
 * @query   {number} minPrice - Minimum price filter
 * @query   {number} maxPrice - Maximum price filter
 * @query   {string} search - Search by title or description
 * @query   {string} sort - Sort by (newest, price, price_desc, rating)
 * @query   {number} tagId - Filter by tag ID
 */
router.get('/', getProductsValidator, validate, ProductController.getAllProducts);

/**
 * @route   GET /api/products/search
 * @desc    Search products by keyword
 * @access  Public
 * @query   {string} q - Search term (minimum 2 characters)
 * @query   {number} categoryId - Filter by category ID
 * @query   {number} cityId - Filter by city ID
 * @query   {string} condition - Filter by condition
 * @query   {number} minPrice - Minimum price filter
 * @query   {number} maxPrice - Maximum price filter
 */
router.get('/search', getProductsValidator, validate, ProductController.searchProducts);

/**
 * @route   GET /api/products/featured
 * @desc    Get featured products
 * @access  Public
 * @query   {number} limit - Number of products to return (default: 10)
 */
router.get('/featured', ProductController.getFeaturedProducts);

/**
 * @route   GET /api/products/category/:categoryId
 * @desc    Get products by category ID
 * @access  Public
 * @param   {number} categoryId - Category ID
 */
router.get(
  '/category/:categoryId',
  getProductsValidator,
  validate,
  ProductController.getProductsByCategory
);

/**
 * @route   GET /api/products/city/:cityId
 * @desc    Get products by city ID
 * @access  Public
 * @param   {number} cityId - City ID
 */
router.get(
  '/city/:cityId',
  getProductsValidator,
  validate,
  ProductController.getProductsByCity
);

/**
 * @route   GET /api/products/tag/:tagId
 * @desc    Get products by tag ID
 * @access  Public
 * @param   {number} tagId - Tag ID
 */
router.get(
  '/tag/:tagId',
  getProductsValidator,
  validate,
  ProductController.getProductsByTag
);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 * @param   {number} id - Product ID
 */
router.get('/:id', getProductByIdValidator, validate, ProductController.getProductById);

// ============================================================
// PROTECTED ROUTES (Authentication required)
// ============================================================

/**
 * @route   GET /api/products/my/listings
 * @desc    Get current user's product listings
 * @access  Private
 * @note    This route must be BEFORE /:id route
 */
router.get('/my/listings', authenticate, ProductController.getMyProducts);

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Private
 * @body    {string} title - Product title
 * @body    {string} description - Product description
 * @body    {number} categoryId - Category ID
 * @body    {number} cityId - City ID
 * @body    {string} condition - Product condition (NEW, LIKE_NEW, GOOD, FAIR, POOR)
 * @body    {number} price - Product price (optional)
 * @body    {string} exchangePreference - EXCHANGE_ONLY, PURCHASE_ONLY, or BOTH
 * @body    {array} tags - Array of tag IDs
 * @body    {string} additionalInfo - Additional information (optional)
 * @body    {files} images - Product images (max 5)
 */
router.post(
  '/',
  authenticate,
  upload.array('images', 5),
  createProductValidator,
  validate,
  ProductController.createProduct
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product
 * @access  Private (Owner only)
 * @param   {number} id - Product ID
 * @body    {string} title - Product title
 * @body    {string} description - Product description
 * @body    {number} categoryId - Category ID
 * @body    {number} cityId - City ID
 * @body    {string} condition - Product condition
 * @body    {number} price - Product price
 * @body    {string} exchangePreference - Exchange preference
 * @body    {string} additionalInfo - Additional information
 */
router.put(
  '/:id',
  authenticate,
  updateProductValidator,
  validate,
  ProductController.updateProduct
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product (soft delete)
 * @access  Private (Owner only)
 * @param   {number} id - Product ID
 */
router.delete('/:id', authenticate, ProductController.deleteProduct);

// ============================================================
// PRODUCT IMAGE MANAGEMENT
// ============================================================

/**
 * @route   POST /api/products/:id/images
 * @desc    Add an image to a product
 * @access  Private (Owner only)
 * @param   {number} id - Product ID
 * @body    {file} image - Image file (multipart/form-data)
 */
router.post(
  '/:id/images',
  authenticate,
  upload.single('image'),
  handleUploadError,
  addProductImageValidator,
  validate,
  ProductController.addProductImage
);

/**
 * @route   DELETE /api/products/:id/images/:imageId
 * @desc    Delete an image from a product
 * @access  Private (Owner only)
 * @param   {number} id - Product ID
 * @param   {number} imageId - Image ID
 */
router.delete(
  '/:id/images/:imageId',
  authenticate,
  deleteProductImageValidator,
  validate,
  ProductController.deleteProductImage
);

// ============================================================
// ADMIN ONLY ROUTES
// ============================================================

/**
 * @route   GET /api/products/stats
 * @desc    Get product statistics
 * @access  Private (Admin only)
 */
router.get('/stats', authenticate, isAdmin, ProductController.getProductStats);

/**
 * @route   PATCH /api/products/:id/feature
 * @desc    Feature a product
 * @access  Private (Admin only)
 * @param   {number} id - Product ID
 * @body    {number} durationDays - Number of days to feature (default: 7)
 */
router.patch(
  '/:id/feature',
  authenticate,
  isAdmin,
  ProductController.featureProduct
);

/**
 * @route   PATCH /api/products/:id/unfeature
 * @desc    Unfeature a product
 * @access  Private (Admin only)
 * @param   {number} id - Product ID
 */
router.patch(
  '/:id/unfeature',
  authenticate,
  isAdmin,
  ProductController.unfeatureProduct
);

module.exports = router;