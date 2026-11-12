const ApiError = require('../utils/apiError');
const STATUS_CODES = require('../constants/statusCodes');

/**
 * Role-Based Access Control (RBAC) Guard
 * Restricts access to specific designated roles.
 * @param  {...string} allowedRoles
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(STATUS_CODES.UNAUTHORIZED, 'User not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          STATUS_CODES.FORBIDDEN,
          `Access forbidden. Role '${req.user.role}' is not authorized to access this resource.`
        )
      );
    }

    next();
  };
};

/**
 * Fine-Grained Permission Guard
 * Checks whether user has the specific required permission.
 * @param  {...string} requiredPermissions
 */
const requirePermissions = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(STATUS_CODES.UNAUTHORIZED, 'User not authenticated'));
    }

    const hasAllPermissions = requiredPermissions.every((perm) => req.user.hasPermission(perm));

    if (!hasAllPermissions) {
      return next(
        new ApiError(
          STATUS_CODES.FORBIDDEN,
          `Forbidden: Insufficient privileges. Required: [${requiredPermissions.join(', ')}]`
        )
      );
    }

    next();
  };
};

module.exports = {
  authorizeRoles,
  requirePermissions
};

