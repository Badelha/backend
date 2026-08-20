// role.middleware.js
const { errorResponse } = require('../utils/response');

const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    const userRoles = req.user.user_roles.map((ur) => ur.role.role_name);
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return errorResponse(res, 403, 'Insufficient permissions');
    }

    next();
  };
};

const isAdmin = checkRole('ADMIN');
const isModerator = checkRole('MODERATOR', 'ADMIN');
const isUserOrAdmin = checkRole('USER', 'ADMIN', 'MODERATOR');

module.exports = { checkRole, isAdmin, isModerator, isUserOrAdmin };