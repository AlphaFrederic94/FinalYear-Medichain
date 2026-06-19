const { verifyAccessToken } = require('../utils/jwt');
const { AppError } = require('./errorHandler');

const authenticate = (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401, 'UNAUTHORIZED');
    }
    const token = header.split(' ')[1];
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired token', 401, 'INVALID_TOKEN'));
    }
    next(err);
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
  }
  next();
};

module.exports = { authenticate, authorize };
