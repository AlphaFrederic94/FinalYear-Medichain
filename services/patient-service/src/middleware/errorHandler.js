const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  if (!err.isOperational) {
    logger.error('Unexpected error', { err: err.message, stack: err.stack });
  }

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    code,
  });
};

module.exports = { errorHandler, AppError };
