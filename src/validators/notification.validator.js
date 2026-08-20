const { body, param, query } = require('express-validator');

const getNotificationsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('isRead')
    .optional()
    .isBoolean().withMessage('isRead must be true or false')
    .toBoolean(),
];

const markNotificationAsReadValidator = [
  param('id')
    .notEmpty().withMessage('Notification ID is required')
    .isInt({ min: 1 }).withMessage('Notification ID must be a positive integer')
    .toInt(),
];

const deleteNotificationValidator = [
  param('id')
    .notEmpty().withMessage('Notification ID is required')
    .isInt({ min: 1 }).withMessage('Notification ID must be a positive integer')
    .toInt(),
];

const getUnreadCountValidator = [
  // No parameters needed, just authentication
];

module.exports = {
  getNotificationsValidator,
  markNotificationAsReadValidator,
  deleteNotificationValidator,
  getUnreadCountValidator,
};