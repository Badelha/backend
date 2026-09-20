const prisma = require('../config/prisma');
const { getPagination } = require('../utils/pagination');
const CityService = require('./city.service');
const { USER_PUBLIC_SELECT, serializeUser, serializeUsers } = require('../utils/userProfile');

class UserService {
  /**
   * Get all users (admin only)
   */
  static async getAllUsers(filters = {}) {
    const { page = 1, limit = 20 } = filters;
    const { skip, take } = getPagination(page, limit);

    const where = {
      deleted_at: null,
    };

    if (filters.search) {
      where.OR = [
        { full_name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone_number: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.accountStatus) {
      where.account_status = filters.accountStatus;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: USER_PUBLIC_SELECT,
        skip,
        take,
        orderBy: { created_at: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users: serializeUsers(users), total, page, limit };
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId) {
    const user = await prisma.user.findFirst({
      where: {
        user_id: userId,
        deleted_at: null,
      },
      select: USER_PUBLIC_SELECT,
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const avgRating = await prisma.rating.aggregate({
      where: {
        rated_user_id: userId,
        deleted_at: null,
      },
      _avg: {
        rating_score: true,
      },
    });

    return {
      ...serializeUser(user),
      average_rating: avgRating._avg.rating_score || 0,
    };
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId, data) {
    const user = await prisma.user.findFirst({
      where: { user_id: userId, deleted_at: null },
      select: { user_id: true },
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const updateData = {};
    if (data.fullName) updateData.full_name = data.fullName;
    if (data.phoneNumber) updateData.phone_number = data.phoneNumber;
    if (data.address !== undefined) {
      const trimmed = data.address == null ? null : String(data.address).trim();
      updateData.address = trimmed === '' ? null : trimmed;
    }

    const cityId = await CityService.resolveCityId({
      city: data.city,
      cityId: data.cityId,
    });
    if (cityId !== undefined) {
      updateData.city_id = cityId;
    }

    const updatedUser = await prisma.user.update({
      where: { user_id: userId },
      data: updateData,
      select: USER_PUBLIC_SELECT,
    });

    return serializeUser(updatedUser);
  }

  /**
   * Update user status (admin only)
   */
  static async updateUserStatus(userId, status) {
    const user = await prisma.user.findFirst({
      where: { user_id: userId, deleted_at: null },
      select: { user_id: true },
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const validStatuses = ['ACTIVE', 'SUSPENDED', 'BANNED'];
    if (!validStatuses.includes(status)) {
      throw new Error('INVALID_STATUS');
    }

    const updatedUser = await prisma.user.update({
      where: { user_id: userId },
      data: { account_status: status },
      select: USER_PUBLIC_SELECT,
    });

    return serializeUser(updatedUser);
  }

  /**
   * Delete user (soft delete)
   */
  static async deleteUser(userId) {
    const user = await prisma.user.findFirst({
      where: { user_id: userId, deleted_at: null },
      select: { user_id: true },
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    await prisma.user.update({
      where: { user_id: userId },
      data: { deleted_at: new Date() },
    });

    return { message: 'User deleted successfully' };
  }

  /**
   * Get user products
   */
  static async getUserProducts(userId, filters = {}) {
    const { page = 1, limit = 20 } = filters;
    const { skip, take } = getPagination(page, limit);

    const where = {
      user_id: userId,
      deleted_at: null,
    };

    if (filters.status) {
      where.availability_status = filters.status;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
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
        orderBy: { created_at: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total, page, limit };
  }

  /**
   * Get user ratings received
   */
  static async getUserRatings(userId, filters = {}) {
    const { page = 1, limit = 20 } = filters;
    const { skip, take } = getPagination(page, limit);

    const where = {
      rated_user_id: userId,
      deleted_at: null,
    };

    const [ratings, total] = await Promise.all([
      prisma.rating.findMany({
        where,
        include: {
          rater: {
            select: {
              user_id: true,
              full_name: true,
              phone_number: true,
            },
          },
        },
        skip,
        take,
        orderBy: { created_at: 'desc' },
      }),
      prisma.rating.count({ where }),
    ]);

    return { ratings, total, page, limit };
  }
}

module.exports = UserService;
