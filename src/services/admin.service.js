const prisma = require('../config/prisma');

class AdminService {
  /**
   * Get system statistics
   */
  static async getSystemStats() {
    const [
      totalUsers,
      totalProducts,
      totalTransactions,
      totalReports,
      pendingReports,
      totalExchanges,
      totalPurchases,
      featuredProducts,
    ] = await Promise.all([
      prisma.user.count({
        where: { deleted_at: null },
      }),
      prisma.product.count({
        where: { deleted_at: null },
      }),
      prisma.$queryRaw`
        SELECT 
          (SELECT COUNT(*) FROM exchange_requests WHERE deleted_at IS NULL) +
          (SELECT COUNT(*) FROM purchase_requests WHERE deleted_at IS NULL) 
        as total
      `,
      prisma.report.count({
        where: { deleted_at: null },
      }),
      prisma.report.count({
        where: {
          report_status: { in: ['PENDING', 'REVIEWING'] },
          deleted_at: null,
        },
      }),
      prisma.exchangeRequest.count({
        where: { deleted_at: null },
      }),
      prisma.purchaseRequest.count({
        where: { deleted_at: null },
      }),
      prisma.product.count({
        where: {
          is_featured: true,
          featured_until: { gt: new Date() },
          deleted_at: null,
        },
      }),
    ]);

    // Get recent users
    const recentUsers = await prisma.user.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' },
      take: 10,
      select: {
        user_id: true,
        full_name: true,
        email: true,
        created_at: true,
        account_status: true,
      },
    });

    // Get recent transactions
    const recentExchanges = await prisma.exchangeRequest.findMany({
      where: { deleted_at: null },
      orderBy: { requested_at: 'desc' },
      take: 5,
      include: {
        initiator: {
          select: {
            full_name: true,
          },
        },
        target: {
          select: {
            full_name: true,
          },
        },
      },
    });

    const recentPurchases = await prisma.purchaseRequest.findMany({
      where: { deleted_at: null },
      orderBy: { requested_at: 'desc' },
      take: 5,
      include: {
        initiator: {
          select: {
            full_name: true,
          },
        },
        target: {
          select: {
            full_name: true,
          },
        },
        product: {
          select: {
            title: true,
          },
        },
      },
    });

    return {
      stats: {
        totalUsers,
        totalProducts,
        totalTransactions: Number(totalTransactions[0]?.total || 0),
        totalReports,
        pendingReports,
        totalExchanges,
        totalPurchases,
        featuredProducts,
      },
      recentUsers,
      recentTransactions: {
        exchanges: recentExchanges,
        purchases: recentPurchases,
      },
    };
  }

  /**
   * Get dashboard data (admin only)
   */
  static async getDashboardData() {
    // Get daily user registrations for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyRegistrations = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE created_at >= ${sevenDaysAgo}
        AND deleted_at IS NULL
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) DESC
    `;

    // Get product category distribution
    const categoryDistribution = await prisma.$queryRaw`
      SELECT 
        c.category_name,
        COUNT(p.product_id) as count
      FROM categories c
      LEFT JOIN products p ON c.category_id = p.category_id
        AND p.deleted_at IS NULL
      WHERE c.deleted_at IS NULL
      GROUP BY c.category_id, c.category_name
      ORDER BY count DESC
      LIMIT 10
    `;

    // Get transaction status distribution
    const exchangeStatus = await prisma.$queryRaw`
      SELECT 
        request_status,
        COUNT(*) as count
      FROM exchange_requests
      WHERE deleted_at IS NULL
      GROUP BY request_status
    `;

    const purchaseStatus = await prisma.$queryRaw`
      SELECT 
        request_status,
        COUNT(*) as count
      FROM purchase_requests
      WHERE deleted_at IS NULL
      GROUP BY request_status
    `;

    return {
      dailyRegistrations,
      categoryDistribution,
      transactionStatus: {
        exchange: exchangeStatus,
        purchase: purchaseStatus,
      },
    };
  }

  /**
   * Get platform activity log
   */
  static async getActivityLog(filters = {}) {
    const { page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const histories = await prisma.transactionHistory.findMany({
      where: {
        deleted_at: null,
      },
      include: {
        changer: {
          select: {
            user_id: true,
            full_name: true,
          },
        },
      },
      orderBy: { changed_at: 'desc' },
      skip,
      take: Number(limit),
    });

    const total = await prisma.transactionHistory.count({
      where: { deleted_at: null },
    });

    return { histories, total, page, limit };
  }

  /**
   * Get user management list (admin only)
   */
  static async getUsersList(filters = {}) {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

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

    if (filters.status) {
      where.account_status = filters.status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          city: true,
          user_roles: {
            where: { deleted_at: null },
            include: { role: true },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  /**
   * Get product management list (admin only)
   */
  static async getProductsList(filters = {}) {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      deleted_at: null,
    };

    if (filters.status) {
      where.availability_status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          user: {
            select: {
              user_id: true,
              full_name: true,
            },
          },
          category: true,
          city: true,
          images: {
            orderBy: { image_order: 'asc' },
            take: 1,
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total, page, limit };
  }
}

module.exports = AdminService;