const prisma = require('../config/prisma');
const { getPagination } = require('../utils/pagination');

class ProductService {
  /**
   * Create a new product
   */
  static async createProduct(data) {
    // Ensure price is properly typed for Decimal
    const productData = {
      user_id: data.userId,
      category_id: data.categoryId,
      city_id: data.cityId,
      title: data.title,
      description: data.description,
      condition: data.condition,
      price: data.price ? Number(data.price) : null,
      exchange_preference: data.exchangePreference || 'BOTH',
      availability_status: 'AVAILABLE',
      additional_info: data.additionalInfo,
    };

    const product = await prisma.product.create({
      data: productData,
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            phone_number: true,
          },
        },
        category: true,
        city: true,
        images: true,
      },
    });

    // Handle tags if provided
    if (data.tags && data.tags.length > 0) {
      const tagConnections = data.tags.map((tagId) => ({
        product_id: product.product_id,
        tag_id: tagId,
      }));

      await prisma.productTag.createMany({
        data: tagConnections,
      });

      // Fetch product with tags
      return prisma.product.findUnique({
        where: { product_id: product.product_id },
        include: {
          user: {
            select: {
              user_id: true,
              full_name: true,
              phone_number: true,
            },
          },
          category: true,
          city: true,
          images: true,
          product_tags: {
            include: { tag: true },
          },
        },
      });
    }

    return product;
  }

  /**
   * Get all products with filters
   */
  static async getAllProducts(filters = {}) {
    const { page = 1, limit = 20 } = filters;
    const { skip, take } = getPagination(page, limit);

    const where = {
      deleted_at: null,
      availability_status: 'AVAILABLE',
    };

    if (filters.categoryId) {
      where.category_id = Number(filters.categoryId);
    }

    if (filters.cityId) {
      where.city_id = Number(filters.cityId);
    }

    if (filters.condition) {
      where.condition = filters.condition;
    }

    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = Number(filters.minPrice);
      if (filters.maxPrice) where.price.lte = Number(filters.maxPrice);
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.userId) {
      where.user_id = Number(filters.userId);
    }

    if (filters.tagId) {
      where.product_tags = {
        some: { tag_id: Number(filters.tagId) },
      };
    }

    if (filters.status) {
      where.availability_status = filters.status;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          user: {
            select: {
              user_id: true,
              full_name: true,
              phone_number: true,
            },
          },
          category: true,
          city: true,
          images: {
            orderBy: { image_order: 'asc' },
          },
          product_tags: {
            include: { tag: true },
          },
        },
        skip,
        take,
        orderBy: filters.sort === 'price' 
          ? { price: 'asc' }
          : filters.sort === 'price_desc'
          ? { price: 'desc' }
          : { created_at: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    // Get all user ratings in one query to avoid N+1
    const userIds = [...new Set(products.map(p => p.user_id))];
    let userRatings = {};
    
    if (userIds.length > 0) {
      const ratings = await prisma.rating.groupBy({
        by: ['rated_user_id'],
        where: {
          rated_user_id: { in: userIds },
          deleted_at: null,
        },
        _avg: {
          rating_score: true,
        },
      });
      
      userRatings = ratings.reduce((acc, r) => {
        acc[r.rated_user_id] = r._avg.rating_score || 0;
        return acc;
      }, {});
    }

    // Map ratings to products
    const productsWithRatings = products.map((product) => ({
      ...product,
      owner_rating: userRatings[product.user_id] || 0,
    }));

    return { products: productsWithRatings, total, page, limit };
  }

  /**
   * Get product by ID
   */
  static async getProductById(productId) {
    const product = await prisma.product.findFirst({
      where: {
        product_id: Number(productId),
        deleted_at: null,
      },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            phone_number: true,
            city: true,
            created_at: true,
          },
        },
        category: true,
        city: true,
        images: {
          orderBy: { image_order: 'asc' },
        },
        product_tags: {
          include: { tag: true },
        },
      },
    });

    if (!product) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    // Increment view count
    await prisma.product.update({
      where: { product_id: Number(productId) },
      data: { views_count: { increment: 1 } },
    });

    // Get owner rating
    const avgRating = await prisma.rating.aggregate({
      where: {
        rated_user_id: product.user_id,
        deleted_at: null,
      },
      _avg: {
        rating_score: true,
      },
    });

    return {
      ...product,
      owner_rating: avgRating._avg.rating_score || 0,
    };
  }

  /**
   * Update product
   */
  static async updateProduct(productId, userId, data) {
    const product = await prisma.product.findFirst({
      where: {
        product_id: Number(productId),
        deleted_at: null,
      },
    });

    if (!product) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    if (product.user_id !== userId) {
      throw new Error('NOT_OWNER');
    }

    const updateData = {};
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.categoryId) updateData.category_id = Number(data.categoryId);
    if (data.cityId) updateData.city_id = Number(data.cityId);
    if (data.condition) updateData.condition = data.condition;
    if (data.price !== undefined) updateData.price = data.price ? Number(data.price) : null;
    if (data.exchangePreference) updateData.exchange_preference = data.exchangePreference;
    if (data.additionalInfo !== undefined) updateData.additional_info = data.additionalInfo;

    const updatedProduct = await prisma.product.update({
      where: { product_id: Number(productId) },
      data: updateData,
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            phone_number: true,
          },
        },
        category: true,
        city: true,
        images: true,
        product_tags: {
          include: { tag: true },
        },
      },
    });

    return updatedProduct;
  }

  /**
   * Delete product (soft delete)
   */
  static async deleteProduct(productId, userId) {
    const product = await prisma.product.findFirst({
      where: {
        product_id: Number(productId),
        deleted_at: null,
      },
    });

    if (!product) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    if (product.user_id !== userId) {
      throw new Error('NOT_OWNER');
    }

    await prisma.product.update({
      where: { product_id: Number(productId) },
      data: {
        deleted_at: new Date(),
        availability_status: 'REMOVED',
      },
    });

    return { message: 'Product deleted successfully' };
  }

  /**
   * Add image to product
   */
  static async addProductImage(productId, userId, imageUrl) {
    const product = await prisma.product.findFirst({
      where: {
        product_id: Number(productId),
        deleted_at: null,
      },
      include: { images: true },
    });

    if (!product) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    if (product.user_id !== userId) {
      throw new Error('NOT_OWNER');
    }

    if (product.images.length >= 5) {
      throw new Error('MAX_IMAGES');
    }

    const image = await prisma.image.create({
      data: {
        product_id: Number(productId),
        image_url: imageUrl,
        image_order: product.images.length + 1,
      },
    });

    return image;
  }

  /**
   * Delete image from product
   */
  static async deleteProductImage(productId, imageId, userId) {
    const product = await prisma.product.findFirst({
      where: {
        product_id: Number(productId),
        deleted_at: null,
      },
    });

    if (!product) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    if (product.user_id !== userId) {
      throw new Error('NOT_OWNER');
    }

    const image = await prisma.image.findFirst({
      where: {
        image_id: Number(imageId),
        deleted_at: null,
      },
    });

    if (!image || image.product_id !== Number(productId)) {
      throw new Error('IMAGE_NOT_FOUND');
    }

    await prisma.image.update({
      where: { image_id: Number(imageId) },
      data: { deleted_at: new Date() },
    });

    return { message: 'Image deleted successfully' };
  }

  /**
   * Get featured products
   */
  static async getFeaturedProducts(limit = 10) {
    const products = await prisma.product.findMany({
      where: {
        is_featured: true,
        featured_until: { gt: new Date() },
        deleted_at: null,
        availability_status: 'AVAILABLE',
      },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            phone_number: true,
          },
        },
        category: true,
        city: true,
        images: {
          orderBy: { image_order: 'asc' },
          take: 1,
        },
      },
      take: Number(limit),
      orderBy: { created_at: 'desc' },
    });

    return products;
  }

  /**
   * Feature a product (admin only)
   */
  static async featureProduct(productId, durationDays = 7) {
    const product = await prisma.product.findFirst({
      where: {
        product_id: Number(productId),
        deleted_at: null,
      },
    });

    if (!product) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + durationDays);

    const updatedProduct = await prisma.product.update({
      where: { product_id: Number(productId) },
      data: {
        is_featured: true,
        featured_until: featuredUntil,
      },
    });

    return updatedProduct;
  }

  /**
   * Unfeature a product (admin only)
   */
  static async unfeatureProduct(productId) {
    const product = await prisma.product.findFirst({
      where: {
        product_id: Number(productId),
        deleted_at: null,
      },
    });

    if (!product) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    const updatedProduct = await prisma.product.update({
      where: { product_id: Number(productId) },
      data: {
        is_featured: false,
        featured_until: null,
      },
    });

    return updatedProduct;
  }

  /**
   * Get product statistics (admin only)
   */
  static async getProductStats() {
    const [
      totalProducts,
      availableProducts,
      reservedProducts,
      exchangedProducts,
      soldProducts,
      removedProducts,
      featuredProductsCount,
      totalViews,
      avgPrice,
    ] = await Promise.all([
      prisma.product.count({ where: { deleted_at: null } }),
      prisma.product.count({ where: { deleted_at: null, availability_status: 'AVAILABLE' } }),
      prisma.product.count({ where: { deleted_at: null, availability_status: 'RESERVED' } }),
      prisma.product.count({ where: { deleted_at: null, availability_status: 'EXCHANGED' } }),
      prisma.product.count({ where: { deleted_at: null, availability_status: 'SOLD' } }),
      prisma.product.count({ where: { deleted_at: null, availability_status: 'REMOVED' } }),
      prisma.product.count({
        where: {
          deleted_at: null,
          is_featured: true,
          featured_until: { gt: new Date() },
        },
      }),
      prisma.product.aggregate({
        where: { deleted_at: null },
        _sum: { views_count: true },
      }),
      prisma.product.aggregate({
        where: { deleted_at: null, price: { not: null } },
        _avg: { price: true },
      }),
    ]);

    // Get top categories
    const topCategories = await prisma.$queryRaw`
      SELECT 
        c.category_name,
        COUNT(p.product_id) as count
      FROM categories c
      LEFT JOIN products p ON c.category_id = p.category_id
        AND p.deleted_at IS NULL
      WHERE c.deleted_at IS NULL
      GROUP BY c.category_id, c.category_name
      ORDER BY count DESC
      LIMIT 5
    `;

    // Get top cities
    const topCities = await prisma.$queryRaw`
      SELECT 
        c.city_name,
        COUNT(p.product_id) as count
      FROM cities c
      LEFT JOIN products p ON c.city_id = p.city_id
        AND p.deleted_at IS NULL
      WHERE p.deleted_at IS NULL
      GROUP BY c.city_id, c.city_name
      ORDER BY count DESC
      LIMIT 5
    `;

    return {
      total: {
        products: totalProducts,
        available: availableProducts,
        reserved: reservedProducts,
        exchanged: exchangedProducts,
        sold: soldProducts,
        removed: removedProducts,
      },
      featured: featuredProductsCount,
      views: totalViews._sum.views_count || 0,
      averagePrice: avgPrice._avg.price || 0,
      topCategories,
      topCities,
    };
  }
}

module.exports = ProductService;