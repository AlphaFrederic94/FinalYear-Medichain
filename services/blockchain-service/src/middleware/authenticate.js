const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { AppError } = require('./errorHandler');

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401, 'UNAUTHORIZED'));
  }
  try {
    req.user = jwt.verify(header.split(' ')[1], env.JWT_SECRET);
    next();
  } catch (err) {
    next(new AppError('Invalid or expired token', 401, 'INVALID_TOKEN'));
  }
};

module.exports = { authenticate };
