const { errorResponse } = require('../utils/apiResponse');

/**
 * Role-based authorization middleware
 * @param  {...string} allowedRoles - E.g. 'ORGANIZER', 'VOLUNTEER', 'ADMIN', 'USER'
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Unauthenticated', 401);
    }

    // ADMIN has bypass access to all routes
    if (req.user.role === 'ADMIN' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return errorResponse(
      res,
      `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}]`,
      403
    );
  };
};

module.exports = {
  authorize,
};
