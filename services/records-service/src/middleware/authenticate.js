const jwt = require('jsonwebtoken');
const env = require('../config/env');

class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message); this.statusCode = statusCode; this.code = code; this.isOperational = true;
  }
}

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(new AppError('No token', 401, 'UNAUTHORIZED'));
  try { req.user = jwt.verify(header.split(' ')[1], env.JWT_SECRET); next(); }
  catch { next(new AppError('Invalid or expired token', 401, 'INVALID_TOKEN')); }
};

module.exports = { authenticate, AppError };
