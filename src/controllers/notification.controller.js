const NotificationService = require('../services/notification.service');
const { successResponse, errorResponse } = require('../utils/response');

function handleError(error, res, next) {
  if (error.message === 'NOTIFICATION_NOT_FOUND') {
    return errorResponse(res, 404, 'Notification not found');
  }
  return next(error);
}

class NotificationController {
  static async list(req, res, next) {
    try {
      const result = await NotificationService.getUserNotifications(req.user.user_id, req.query);
      return successResponse(res, 200, result, 'Notifications retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }

  static async unreadCount(req, res, next) {
    try {
      const result = await NotificationService.getUnreadCount(req.user.user_id);
      return successResponse(res, 200, result, 'Unread notification count retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }

  static async markRead(req, res, next) {
    try {
      const result = await NotificationService.markAsRead(req.params.id, req.user.user_id);
      return successResponse(res, 200, result, 'Notification marked as read');
    } catch (error) {
      return handleError(error, res, next);
    }
  }

  static async markAllRead(req, res, next) {
    try {
      const result = await NotificationService.markAllAsRead(req.user.user_id);
      return successResponse(res, 200, result, 'All notifications marked as read');
    } catch (error) {
      return next(error);
    }
  }

  static async remove(req, res, next) {
    try {
      const result = await NotificationService.deleteNotification(req.params.id, req.user.user_id);
      return successResponse(res, 200, result, 'Notification deleted successfully');
    } catch (error) {
      return handleError(error, res, next);
    }
  }
}

module.exports = NotificationController;
