module.exports = {
  AUTH: {
    REGISTER_SUCCESS: 'User registered successfully',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    EMAIL_VERIFIED: 'Email verified successfully',
    PASSWORD_RESET: 'Password reset successfully',
    PASSWORD_RESET_EMAIL_SENT: 'Password reset email sent',
    INVALID_CREDENTIALS: 'Invalid email or password',
    EMAIL_ALREADY_EXISTS: 'Email already exists',
    PHONE_ALREADY_EXISTS: 'Phone number already exists',
    ACCOUNT_BANNED: 'Account is banned',
    ACCOUNT_SUSPENDED: 'Account is suspended',
    ACCOUNT_NOT_VERIFIED: 'Account is not verified',
    INVALID_TOKEN: 'Invalid or expired token',
    REFRESH_TOKEN_REQUIRED: 'Refresh token required',
    UNAUTHORIZED: 'Authentication required',
  },
  
  USER: {
    PROFILE_RETRIEVED: 'Profile retrieved successfully',
    PROFILE_UPDATED: 'Profile updated successfully',
    USER_NOT_FOUND: 'User not found',
    USER_DELETED: 'User deleted successfully',
  },

  PRODUCT: {
    CREATED: 'Product created successfully',
    UPDATED: 'Product updated successfully',
    DELETED: 'Product deleted successfully',
    NOT_FOUND: 'Product not found',
    FETCHED: 'Products retrieved successfully',
    FEATURED_FETCHED: 'Featured products retrieved successfully',
    IMAGE_ADDED: 'Image added successfully',
    IMAGE_DELETED: 'Image deleted successfully',
    MAX_IMAGES: 'Maximum 5 images allowed per product',
    NOT_OWNER: 'You can only modify your own products',
  },

  EXCHANGE: {
    CREATED: 'Exchange request created successfully',
    ACCEPTED: 'Exchange request accepted successfully',
    REJECTED: 'Exchange request rejected successfully',
    COMPLETED: 'Exchange request completed successfully',
    CANCELLED: 'Exchange request cancelled successfully',
    NOT_FOUND: 'Exchange request not found',
    NOT_AUTHORIZED: 'You are not authorized to perform this action',
    ALREADY_PROCESSED: 'This request has already been processed',
    FETCHED: 'Exchange requests retrieved successfully',
  },

  PURCHASE: {
    CREATED: 'Purchase request created successfully',
    ACCEPTED: 'Purchase request accepted successfully',
    REJECTED: 'Purchase request rejected successfully',
    COMPLETED: 'Purchase request completed successfully',
    CANCELLED: 'Purchase request cancelled successfully',
    NOT_FOUND: 'Purchase request not found',
    NOT_AUTHORIZED: 'You are not authorized to perform this action',
    ALREADY_PROCESSED: 'This request has already been processed',
    FETCHED: 'Purchase requests retrieved successfully',
  },

  RATING: {
    CREATED: 'Rating created successfully',
    UPDATED: 'Rating updated successfully',
    DELETED: 'Rating deleted successfully',
    NOT_FOUND: 'Rating not found',
    ALREADY_RATED: 'You have already rated this transaction',
    CANNOT_RATE_SELF: 'You cannot rate yourself',
    FETCHED: 'Ratings retrieved successfully',
  },

  REPORT: {
    CREATED: 'Report submitted successfully',
    UPDATED: 'Report updated successfully',
    RESOLVED: 'Report resolved successfully',
    NOT_FOUND: 'Report not found',
    FETCHED: 'Reports retrieved successfully',
    ALREADY_REPORTED: 'You have already reported this user/product',
  },

  NOTIFICATION: {
    FETCHED: 'Notifications retrieved successfully',
    MARKED_READ: 'Notification marked as read',
    ALL_MARKED_READ: 'All notifications marked as read',
    DELETED: 'Notification deleted successfully',
    UNREAD_COUNT: 'Unread count retrieved successfully',
  },

  ADMIN: {
    STATS_FETCHED: 'Statistics retrieved successfully',
    DASHBOARD_FETCHED: 'Dashboard data retrieved successfully',
    USER_MANAGED: 'User managed successfully',
  },

  VALIDATION: {
    ERROR: 'Validation error',
  },

  ERROR: {
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Forbidden access',
    NOT_FOUND: 'Resource not found',
    VALIDATION_ERROR: 'Validation error',
    INTERNAL_ERROR: 'Internal server error',
    DUPLICATE_ENTRY: 'Duplicate entry',
    INVALID_REFERENCE: 'Invalid reference',
  },

  SUCCESS: {
    OK: 'Operation successful',
    CREATED: 'Resource created successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',
  },
};
