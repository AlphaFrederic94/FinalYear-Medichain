const { AppError } = require('./authenticate');

/**
 * Middleware factory: authorize(allowedRoles)
 * req.user must already be set by authenticate middleware.
 */
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
  if (!allowedRoles.includes(req.user.role)) {
    return next(new AppError('Forbidden: insufficient role', 403, 'FORBIDDEN'));
  }
  next();
};

module.exports = { authorize };
