const prisma = require('../config/prisma');
const { getPagination } = require('../utils/pagination');

class PurchaseService {
  /**
   * Create a purchase request
   */
  static async createPurchaseRequest(data) {
    // Validate product exists and is available
    const product = await prisma.product.findFirst({
      where: {
        product_id: Number(data.productId),
        user_id: data.targetUserId,
        deleted_at: null,
        availability_status: 'AVAILABLE',
      },
      include: {
        user: true,
      },
    });

    if (!product) {
      throw new Error('PRODUCT_NOT_AVAILABLE');
    }

    if (data.initiatorUserId === data.targetUserId) {
      throw new Error('CANNOT_BUY_OWN_PRODUCT');
    }

    // Check if purchase request already exists
    const existingRequest = await prisma.purchaseRequest.findFirst({
      where: {
        initiator_user_id: data.initiatorUserId,
        product_id: Number(data.productId),
        request_status: 'PENDING',
        deleted_at: null,
      },
    });

    if (existingRequest) {
      throw new Error('PURCHASE_REQUEST_EXISTS');
    }

    const purchaseRequest = await prisma.purchaseRequest.create({
      data: {
        initiator_user_id: data.initiatorUserId,
        target_user_id: data.targetUserId,
        product_id: Number(data.productId),
        offered_price: Number(data.offeredPrice),
        buyer_message: data.message,
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
        product: {
          include: {
            images: {
              orderBy: { image_order: 'asc' },
              take: 1,
            },
          },
        },
      },
    });

    // Update product status to RESERVED
    await prisma.product.update({
      where: { product_id: Number(data.productId) },
      data: { availability_status: 'RESERVED' },
    });

    // Create transaction history
    await prisma.transactionHistory.create({
      data: {
        transaction_type: 'PURCHASE',
        entity_id: purchaseRequest.purchase_request_id,
        status_before: null,
        status_after: 'PENDING',
        changed_by: data.initiatorUserId,
        notes: 'Purchase request created',
      },
    });

    // Create notification for target user
    await prisma.notification.create({
      data: {
        user_id: data.targetUserId,
        notification_type: 'PURCHASE_REQUEST',
        related_entity_type: 'PURCHASE_REQUEST',
        related_entity_id: purchaseRequest.purchase_request_id,
        message: `${product.title} has a purchase offer of $${data.offeredPrice}`,
      },
    });

    return purchaseRequest;
  }

  /**
   * Get user's purchase requests
   */
  static async getUserPurchaseRequests(userId, filters = {}) {
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
      prisma.purchaseRequest.findMany({
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
        skip,
        take,
        orderBy: { requested_at: 'desc' },
      }),
      prisma.purchaseRequest.count({ where }),
    ]);

    return { requests, total, page, limit };
  }

  /**
   * Get purchase request by ID
   */
  static async getPurchaseRequestById(requestId, userId) {
    const request = await prisma.purchaseRequest.findFirst({
      where: {
        purchase_request_id: Number(requestId),
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
        product: {
          include: {
            images: {
              orderBy: { image_order: 'asc' },
            },
            category: true,
            city: true,
            user: {
              select: {
                user_id: true,
                full_name: true,
                phone_number: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      throw new Error('PURCHASE_REQUEST_NOT_FOUND');
    }

    return request;
  }

  /**
   * Accept purchase request
   */
  static async acceptPurchaseRequest(requestId, userId) {
    const request = await prisma.purchaseRequest.findFirst({
      where: {
        purchase_request_id: Number(requestId),
        target_user_id: userId,
        request_status: 'PENDING',
        deleted_at: null,
      },
    });

    if (!request) {
      throw new Error('PURCHASE_REQUEST_NOT_FOUND');
    }

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const updated = await tx.purchaseRequest.update({
        where: { purchase_request_id: Number(requestId) },
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
          product: true,
        },
      });

      await tx.transactionHistory.create({
        data: {
          transaction_type: 'PURCHASE',
          entity_id: requestId,
          status_before: 'PENDING',
          status_after: 'ACCEPTED',
          changed_by: userId,
          notes: 'Purchase request accepted',
        },
      });

      return updated;
    });

    // Create notification for initiator
    await prisma.notification.create({
      data: {
        user_id: request.initiator_user_id,
        notification_type: 'REQUEST_RESPONSE',
        related_entity_type: 'PURCHASE_REQUEST',
        related_entity_id: requestId,
        message: 'Your purchase request has been accepted',
      },
    });

    return updatedRequest;
  }

  /**
   * Reject purchase request
   */
  static async rejectPurchaseRequest(requestId, userId, reason) {
    const request = await prisma.purchaseRequest.findFirst({
      where: {
        purchase_request_id: Number(requestId),
        target_user_id: userId,
        request_status: 'PENDING',
        deleted_at: null,
      },
    });

    if (!request) {
      throw new Error('PURCHASE_REQUEST_NOT_FOUND');
    }

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const updated = await tx.purchaseRequest.update({
        where: { purchase_request_id: Number(requestId) },
        data: {
          request_status: 'REJECTED',
          responded_at: new Date(),
          rejected_at: new Date(),
          notes: reason,
        },
      });

      // Release product reservation
      await tx.product.update({
        where: { product_id: request.product_id },
        data: { availability_status: 'AVAILABLE' },
      });

      await tx.transactionHistory.create({
        data: {
          transaction_type: 'PURCHASE',
          entity_id: requestId,
          status_before: 'PENDING',
          status_after: 'REJECTED',
          changed_by: userId,
          notes: reason || 'Purchase request rejected',
        },
      });

      return updated;
    });

    // Create notification for initiator
    await prisma.notification.create({
      data: {
        user_id: request.initiator_user_id,
        notification_type: 'REQUEST_RESPONSE',
        related_entity_type: 'PURCHASE_REQUEST',
        related_entity_id: requestId,
        message: 'Your purchase request has been rejected',
      },
    });

    return updatedRequest;
  }

  /**
   * Complete purchase request
   */
  static async completePurchaseRequest(requestId, userId) {
    const request = await prisma.purchaseRequest.findFirst({
      where: {
        purchase_request_id: Number(requestId),
        request_status: 'ACCEPTED',
        deleted_at: null,
        OR: [
          { initiator_user_id: userId },
          { target_user_id: userId },
        ],
      },
    });

    if (!request) {
      throw new Error('PURCHASE_REQUEST_NOT_FOUND');
    }

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const updated = await tx.purchaseRequest.update({
        where: { purchase_request_id: Number(requestId) },
        data: {
          request_status: 'COMPLETED',
          completed_at: new Date(),
        },
      });

      // Update product status
      await tx.product.update({
        where: { product_id: request.product_id },
        data: { availability_status: 'SOLD' },
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
          transaction_type: 'PURCHASE',
          entity_id: requestId,
          status_before: 'ACCEPTED',
          status_after: 'COMPLETED',
          changed_by: userId,
          notes: 'Purchase completed',
        },
      });

      return updated;
    });

    return updatedRequest;
  }

  /**
   * Cancel purchase request
   */
  static async cancelPurchaseRequest(requestId, userId) {
    const request = await prisma.purchaseRequest.findFirst({
      where: {
        purchase_request_id: Number(requestId),
        request_status: { in: ['PENDING', 'ACCEPTED'] },
        deleted_at: null,
        OR: [
          { initiator_user_id: userId },
          { target_user_id: userId },
        ],
      },
    });

    if (!request) {
      throw new Error('PURCHASE_REQUEST_NOT_FOUND');
    }

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const updated = await tx.purchaseRequest.update({
        where: { purchase_request_id: Number(requestId) },
        data: {
          request_status: 'CANCELLED',
          cancelled_at: new Date(),
        },
      });

      // Release product reservation
      await tx.product.update({
        where: { product_id: request.product_id },
        data: { availability_status: 'AVAILABLE' },
      });

      await tx.transactionHistory.create({
        data: {
          transaction_type: 'PURCHASE',
          entity_id: requestId,
          status_before: request.request_status,
          status_after: 'CANCELLED',
          changed_by: userId,
          notes: 'Purchase cancelled',
        },
      });

      return updated;
    });

    return updatedRequest;
  }
}

module.exports = PurchaseService;