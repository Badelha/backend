const prisma = require('../config/prisma');
const { getPagination } = require('../utils/pagination');

class NotificationService {
  /**
   * Get user notifications
   */
  static async getUserNotifications(userId, filters = {}) {
    const { page = 1, limit = 20 } = filters;
    const { skip, take } = getPagination(page, limit);

    const where = {
      user_id: userId,
      deleted_at: null,
    };

    if (filters.isRead !== undefined) {
      where.is_read = filters.isRead === 'true';
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, total, page, limit };
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId) {
    const count = await prisma.notification.count({
      where: {
        user_id: userId,
        is_read: false,
        deleted_at: null,
      },
    });

    return { unread_count: count };
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId, userId) {
    const notification = await prisma.notification.findFirst({
      where: {
        notification_id: Number(notificationId),
        user_id: userId,
        deleted_at: null,
      },
    });

    if (!notification) {
      throw new Error('NOTIFICATION_NOT_FOUND');
    }

    const updated = await prisma.notification.update({
      where: { notification_id: Number(notificationId) },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });

    return updated;
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId) {
    await prisma.notification.updateMany({
      where: {
        user_id: userId,
        is_read: false,
        deleted_at: null,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });

    return { message: 'All notifications marked as read' };
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId, userId) {
    const notification = await prisma.notification.findFirst({
      where: {
        notification_id: Number(notificationId),
        user_id: userId,
        deleted_at: null,
      },
    });

    if (!notification) {
      throw new Error('NOTIFICATION_NOT_FOUND');
    }

    await prisma.notification.update({
      where: { notification_id: Number(notificationId) },
      data: { deleted_at: new Date() },
    });

    return { message: 'Notification deleted successfully' };
  }

  /**
   * Create notification (internal use)
   */
  static async createNotification(data) {
    const notification = await prisma.notification.create({
      data: {
        user_id: data.userId,
        notification_type: data.type,
        related_entity_type: data.entityType || null,
        related_entity_id: data.entityId || null,
        message: data.message,
      },
    });

    return notification;
  }

  /**
   * Create multiple notifications (internal use)
   */
  static async createMultipleNotifications(dataArray) {
    const notifications = await prisma.notification.createMany({
      data: dataArray.map(data => ({
        user_id: data.userId,
        notification_type: data.type,
        related_entity_type: data.entityType || null,
        related_entity_id: data.entityId || null,
        message: data.message,
      })),
    });

    return notifications;
  }
}

module.exports = NotificationService;