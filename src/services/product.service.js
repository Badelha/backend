const prisma = require('../config/prisma');
const { getPagination } = require('../utils/pagination');

class ProductService {
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
      throw new Error('Product not found');
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

  static async updateProduct(productId, userId, data) {
    const product = await prisma.product.findFirst({
      where: {
        product_id: Number(productId),
        deleted_at: null,
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.user_id !== userId) {
      throw new Error('You can only update your own products');
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

  static async deleteProduct(productId, userId) {
    const product = await prisma.product.findFirst({
      where: {
        product_id: Number(productId),
        deleted_at: null,
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.user_id !== userId) {
      throw new Error('You can only delete your own products');
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

  static async addProductImage(productId, userId, imageUrl) {
    const product = await prisma.product.findFirst({
      where: {
        product_id: Number(productId),
        deleted_at: null,
      },
      include: { images: true },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.user_id !== userId) {
      throw new Error('You can only add images to your own products');
    }

    if (product.images.length >= 5) {
      throw new Error('Maximum 5 images allowed per product');
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

  static async deleteProductImage(productId, imageId, userId) {
    const product = await prisma.product.findFirst({
      where: {
        product_id: Number(productId),
        deleted_at: null,
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.user_id !== userId) {
      throw new Error('You can only delete images from your own products');
    }

    const image = await prisma.image.findFirst({
      where: {
        image_id: Number(imageId),
        deleted_at: null,
      },
    });

    if (!image || image.product_id !== Number(productId)) {
      throw new Error('Image not found');
    }

    await prisma.image.update({
      where: { image_id: Number(imageId) },
      data: { deleted_at: new Date() },
    });

    return { message: 'Image deleted successfully' };
  }

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
}

module.exports = ProductService;