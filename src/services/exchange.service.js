const prisma = require('../config/prisma');
const { getPagination } = require('../utils/pagination');

class ExchangeService {
  /**
   * Create an exchange request
   */
  static async createExchangeRequest(data) {
    // Validate products exist and are available
    const initiatorProduct = await prisma.product.findFirst({
      where: {
        product_id: Number(data.initiatorProductId),
        user_id: data.initiatorUserId,
        deleted_at: null,
        availability_status: 'AVAILABLE',
      },
    });

    if (!initiatorProduct) {
      throw new Error('INITIATOR_PRODUCT_NOT_AVAILABLE');
    }

    const targetProduct = await prisma.product.findFirst({
      where: {
        product_id: Number(data.targetProductId),
        user_id: data.targetUserId,
        deleted_at: null,
        availability_status: 'AVAILABLE',
      },
    });

    if (!targetProduct) {
      throw new Error('TARGET_PRODUCT_NOT_AVAILABLE');
    }

    // Check if user is trying to exchange with themselves
    if (data.initiatorUserId === data.targetUserId) {
      throw new Error('CANNOT_EXCHANGE_WITH_SELF');
    }

    // Check if exchange request already exists
    const existingRequest = await prisma.exchangeRequest.findFirst({
      where: {
        initiator_user_id: data.initiatorUserId,
        target_user_id: data.targetUserId,
        initiator_product_id: Number(data.initiatorProductId),
        target_product_id: Number(data.targetProductId),
        request_status: 'PENDING',
        deleted_at: null,
      },
    });

    if (existingRequest) {
      throw new Error('EXCHANGE_REQUEST_EXISTS');
    }

    const exchangeRequest = await prisma.exchangeRequest.create({
      data: {
        initiator_user_id: data.initiatorUserId,
        target_user_id: data.targetUserId,
        initiator_product_id: Number(data.initiatorProductId),
        target_product_id: Number(data.targetProductId),
        initiator_message: data.message,
        request_status: 'PENDING',
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
            },
          },
        },
        requested: {
          include: {
            images: {
              orderBy: { image_order: 'asc' },
            },
          },
        },
      },
    });

    // Update product status to RESERVED
    await prisma.product.update({
      where: { product_id: Number(data.initiatorProductId) },
      data: { availability_status: 'RESERVED' },
    });

    await prisma.product.update({
      where: { product_id: Number(data.targetProductId) },
      data: { availability_status: 'RESERVED' },
    });

    // Create transaction history
    await prisma.transactionHistory.create({
      data: {
        transaction_type: 'EXCHANGE',
        entity_id: exchangeRequest.exchange_request_id,
        status_before: null,
        status_after: 'PENDING',
        changed_by: data.initiatorUserId,
        notes: 'Exchange request created',
      },
    });

    // Create notification for target user
    await prisma.notification.create({
      data: {
        user_id: data.targetUserId,
        notification_type: 'EXCHANGE_REQUEST',
        related_entity_type: 'EXCHANGE_REQUEST',
        related_entity_id: exchangeRequest.exchange_request_id,
        message: `${initiatorProduct.title} wants to exchange with ${targetProduct.title}`,
      },
    });

    return exchangeRequest;
  }

  /**
   * Get user's exchange requests
   */
  static async getUserExchangeRequests(userId, filters = {}) {
    const { page = 1, limit = 20 } = filters;
    const { skip, take } = getPagination(page, limit);

    const where = {
      deleted_at: null,
      OR: [
        { initiator_user_id: userId },
        { target_user_id: userId },
      ],
    };

    if (filters.status) {
      where.request_status = filters.status;
    }

    const [requests, total] = await Promise.all([
      prisma.exchangeRequest.findMany({
        where,
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
        skip,
        take,
        orderBy: { requested_at: 'desc' },
      }),
      prisma.exchangeRequest.count({ where }),
    ]);

    return { requests, total, page, limit };
  }

  /**
   * Get exchange request by ID
   */
  static async getExchangeRequestById(requestId, userId) {
    const request = await prisma.exchangeRequest.findFirst({
      where: {
        exchange_request_id: Number(requestId),
        deleted_at: null,
        OR: [
          { initiator_user_id: userId },
          { target_user_id: userId },
        ],
      },
      include: {
        initiator: {
          select: {
            user_id: true,
            full_name: true,
            phone_number: true,
            city: true,
          },
        },
        target: {
          select: {
            user_id: true,
            full_name: true,
            phone_number: true,
            city: true,
          },
        },
        offered: {
          include: {
            images: {
              orderBy: { image_order: 'asc' },
            },
            category: true,
            city: true,
          },
        },
        requested: {
          include: {
            images: {
              orderBy: { image_order: 'asc' },
            },
            category: true,
            city: true,
          },
        },
      },
    });

    if (!request) {
      throw new Error('EXCHANGE_REQUEST_NOT_FOUND');
    }

    return request;
  }

  /**
   * Accept exchange request
   */
  static async acceptExchangeRequest(requestId, userId) {
    const request = await prisma.exchangeRequest.findFirst({
      where: {
        exchange_request_id: Number(requestId),
        target_user_id: userId,
        request_status: 'PENDING',
        deleted_at: null,
      },
    });

    if (!request) {
      throw new Error('EXCHANGE_REQUEST_NOT_FOUND');
    }

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const updated = await tx.exchangeRequest.update({
        where: { exchange_request_id: Number(requestId) },
        data: {
          request_status: 'ACCEPTED',
          responded_at: new Date(),
          accepted_at: new Date(),
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
          offered: true,
          requested: true,
        },
      });

      await tx.transactionHistory.create({
        data: {
          transaction_type: 'EXCHANGE',
          entity_id: requestId,
          status_before: 'PENDING',
          status_after: 'ACCEPTED',
          changed_by: userId,
          notes: 'Exchange request accepted',
        },
      });

      return updated;
    });

    // Create notification for initiator
    await prisma.notification.create({
      data: {
        user_id: request.initiator_user_id,
        notification_type: 'REQUEST_RESPONSE',
        related_entity_type: 'EXCHANGE_REQUEST',
        related_entity_id: requestId,
        message: 'Your exchange request has been accepted',
      },
    });

    return updatedRequest;
  }

  /**
   * Reject exchange request
   */
  static async rejectExchangeRequest(requestId, userId, reason) {
    const request = await prisma.exchangeRequest.findFirst({
      where: {
        exchange_request_id: Number(requestId),
        target_user_id: userId,
        request_status: 'PENDING',
        deleted_at: null,
      },
    });

    if (!request) {
      throw new Error('EXCHANGE_REQUEST_NOT_FOUND');
    }

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const updated = await tx.exchangeRequest.update({
        where: { exchange_request_id: Number(requestId) },
        data: {
          request_status: 'REJECTED',
          responded_at: new Date(),
          rejected_at: new Date(),
          notes: reason,
        },
      });

      // Release product reservations
      await tx.product.update({
        where: { product_id: request.initiator_product_id },
        data: { availability_status: 'AVAILABLE' },
      });

      await tx.product.update({
        where: { product_id: request.target_product_id },
        data: { availability_status: 'AVAILABLE' },
      });

      await tx.transactionHistory.create({
        data: {
          transaction_type: 'EXCHANGE',
          entity_id: requestId,
          status_before: 'PENDING',
          status_after: 'REJECTED',
          changed_by: userId,
          notes: reason || 'Exchange request rejected',
        },
      });

      return updated;
    });

    // Create notification for initiator
    await prisma.notification.create({
      data: {
        user_id: request.initiator_user_id,
        notification_type: 'REQUEST_RESPONSE',
        related_entity_type: 'EXCHANGE_REQUEST',
        related_entity_id: requestId,
        message: 'Your exchange request has been rejected',
      },
    });

    return updatedRequest;
  }

  /**
   * Complete exchange request
   */
  static async completeExchangeRequest(requestId, userId) {
    const request = await prisma.exchangeRequest.findFirst({
      where: {
        exchange_request_id: Number(requestId),
        request_status: 'ACCEPTED',
        deleted_at: null,
        OR: [
          { initiator_user_id: userId },
          { target_user_id: userId },
        ],
      },
    });

    if (!request) {
      throw new Error('EXCHANGE_REQUEST_NOT_FOUND');
    }

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const updated = await tx.exchangeRequest.update({
        where: { exchange_request_id: Number(requestId) },
        data: {
          request_status: 'COMPLETED',
          completed_at: new Date(),
        },
      });

      // Update product statuses
      await tx.product.update({
        where: { product_id: request.initiator_product_id },
        data: { availability_status: 'EXCHANGED' },
      });

      await tx.product.update({
        where: { product_id: request.target_product_id },
        data: { availability_status: 'EXCHANGED' },
      });

      // Update user transaction counts
      await tx.user.update({
        where: { user_id: request.initiator_user_id },
        data: { total_transactions: { increment: 1 } },
      });

      await tx.user.update({
        where: { user_id: request.target_user_id },
        data: { total_transactions: { increment: 1 } },
      });

      await tx.transactionHistory.create({
        data: {
          transaction_type: 'EXCHANGE',
          entity_id: requestId,
          status_before: 'ACCEPTED',
          status_after: 'COMPLETED',
          changed_by: userId,
          notes: 'Exchange completed',
        },
      });

      return updated;
    });

    return updatedRequest;
  }

  /**
   * Cancel exchange request
   */
  static async cancelExchangeRequest(requestId, userId) {
    const request = await prisma.exchangeRequest.findFirst({
      where: {
        exchange_request_id: Number(requestId),
        request_status: { in: ['PENDING', 'ACCEPTED'] },
        deleted_at: null,
        OR: [
          { initiator_user_id: userId },
          { target_user_id: userId },
        ],
      },
    });

    if (!request) {
      throw new Error('EXCHANGE_REQUEST_NOT_FOUND');
    }

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const updated = await tx.exchangeRequest.update({
        where: { exchange_request_id: Number(requestId) },
        data: {
          request_status: 'CANCELLED',
          cancelled_at: new Date(),
        },
      });

      // Release product reservations
      await tx.product.update({
        where: { product_id: request.initiator_product_id },
        data: { availability_status: 'AVAILABLE' },
      });

      await tx.product.update({
        where: { product_id: request.target_product_id },
        data: { availability_status: 'AVAILABLE' },
      });

      await tx.transactionHistory.create({
        data: {
          transaction_type: 'EXCHANGE',
          entity_id: requestId,
          status_before: request.request_status,
          status_after: 'CANCELLED',
          changed_by: userId,
          notes: 'Exchange cancelled',
        },
      });

      return updated;
    });

    return updatedRequest;
  }
}

module.exports = ExchangeService;