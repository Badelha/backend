// transaction.service.js
const prisma = require('../config/prisma');
const { getPagination } = require('../utils/pagination');

class TransactionService {
  /**
   * Get all user transactions
   */
  static async getUserTransactions(userId, filters = {}) {
    const { page = 1, limit = 20 } = filters;
    const { skip, take } = getPagination(page, limit);

    // Get exchange requests
    const exchangeWhere = {
      deleted_at: null,
      OR: [
        { initiator_user_id: userId },
        { target_user_id: userId },
      ],
    };

    if (filters.status) {
      exchangeWhere.request_status = filters.status;
    }

    const [exchanges, exchangeTotal] = await Promise.all([
      prisma.exchangeRequest.findMany({
        where: exchangeWhere,
        include: {
          initiator: {
            select: {
              user_id: true,
              full_name: true,
            },
          },
          target: {
            select: {
              user_id: true,
              full_name: true,
            },
          },
          offered: {
            select: {
              product_id: true,
              title: true,
            },
          },
          requested: {
            select: {
              product_id: true,
              title: true,
            },
          },
        },
        orderBy: { requested_at: 'desc' },
      }),
      prisma.exchangeRequest.count({ where: exchangeWhere }),
    ]);

    // Get purchase requests
    const purchaseWhere = {
      deleted_at: null,
      OR: [
        { initiator_user_id: userId },
        { target_user_id: userId },
      ],
    };

    if (filters.status) {
      purchaseWhere.request_status = filters.status;
    }

    const [purchases, purchaseTotal] = await Promise.all([
      prisma.purchaseRequest.findMany({
        where: purchaseWhere,
        include: {
          initiator: {
            select: {
              user_id: true,
              full_name: true,
            },
          },
          target: {
            select: {
              user_id: true,
              full_name: true,
            },
          },
          product: {
            select: {
              product_id: true,
              title: true,
            },
          },
        },
        orderBy: { requested_at: 'desc' },
      }),
      prisma.purchaseRequest.count({ where: purchaseWhere }),
    ]);

    // Combine and sort all transactions
    const allTransactions = [
      ...exchanges.map(e => ({
        ...e,
        type: 'EXCHANGE',
        created_at: e.requested_at,
        status: e.request_status,
      })),
      ...purchases.map(p => ({
        ...p,
        type: 'PURCHASE',
        created_at: p.requested_at,
        status: p.request_status,
      })),
    ];

    // Sort by created_at descending
    allTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Apply pagination
    const paginated = allTransactions.slice(skip, skip + take);

    return {
      transactions: paginated,
      total: allTransactions.length,
      page,
      limit,
    };
  }

  /**
   * Get transaction history
   */
  static async getTransactionHistory(userId, filters = {}) {
    const { page = 1, limit = 20 } = filters;
    const { skip, take } = getPagination(page, limit);

    const where = {
      deleted_at: null,
      changer_id: userId,
    };

    if (filters.transactionType) {
      where.transaction_type = filters.transactionType;
    }

    const [histories, total] = await Promise.all([
      prisma.transactionHistory.findMany({
        where,
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
        take,
      }),
      prisma.transactionHistory.count({ where }),
    ]);

    return { histories, total, page, limit };
  }

  /**
   * Get transaction by entity ID
   */
  static async getTransactionByEntity(entityType, entityId) {
    let transaction = null;

    if (entityType === 'EXCHANGE') {
      transaction = await prisma.exchangeRequest.findFirst({
        where: {
          exchange_request_id: Number(entityId),
          deleted_at: null,
        },
        include: {
          initiator: {
            select: {
              user_id: true,
              full_name: true,
              phone_number: true,
            },
          },
          target: {
            select: {
              user_id: true,
              full_name: true,
              phone_number: true,
            },
          },
          offered: {
            include: {
              images: {
                orderBy: { image_order: 'asc' },
                take: 1,
              },
            },
          },
          requested: {
            include: {
              images: {
                orderBy: { image_order: 'asc' },
                take: 1,
              },
            },
          },
        },
      });
    } else {
      transaction = await prisma.purchaseRequest.findFirst({
        where: {
          purchase_request_id: Number(entityId),
          deleted_at: null,
        },
        include: {
          initiator: {
            select: {
              user_id: true,
              full_name: true,
              phone_number: true,
            },
          },
          target: {
            select: {
              user_id: true,
              full_name: true,
              phone_number: true,
            },
          },
          product: {
            include: {
              images: {
                orderBy: { image_order: 'asc' },
                take: 1,
              },
              category: true,
              city: true,
            },
          },
        },
      });
    }

    if (!transaction) {
      throw new Error('TRANSACTION_NOT_FOUND');
    }

    return transaction;
  }

  /**
   * Get transaction status counts for a user
   */
  static async getTransactionStats(userId) {
    const [exchangeCounts, purchaseCounts] = await Promise.all([
      prisma.exchangeRequest.groupBy({
        by: ['request_status'],
        where: {
          OR: [
            { initiator_user_id: userId },
            { target_user_id: userId },
          ],
          deleted_at: null,
        },
        _count: {
          request_status: true,
        },
      }),
      prisma.purchaseRequest.groupBy({
        by: ['request_status'],
        where: {
          OR: [
            { initiator_user_id: userId },
            { target_user_id: userId },
          ],
          deleted_at: null,
        },
        _count: {
          request_status: true,
        },
      }),
    ]);

    // Total counts
    const totalExchanges = exchangeCounts.reduce((sum, item) => sum + item._count.request_status, 0);
    const totalPurchases = purchaseCounts.reduce((sum, item) => sum + item._count.request_status, 0);

    return {
      exchange: {
        total: totalExchanges,
        byStatus: exchangeCounts.reduce((acc, item) => {
          acc[item.request_status] = item._count.request_status;
          return acc;
        }, {}),
      },
      purchase: {
        total: totalPurchases,
        byStatus: purchaseCounts.reduce((acc, item) => {
          acc[item.request_status] = item._count.request_status;
          return acc;
        }, {}),
      },
    };
  }
}

module.exports = TransactionService;