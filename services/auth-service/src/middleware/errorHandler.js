const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  logger.error({ message: err.message, code: err.code, path: req.path, stack: err.stack });

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'A record with this value already exists',
      code: 'DUPLICATE_ENTRY',
      details: { fields: err.meta?.target },
    });
  }

  return res.status(500).json({
    success: false,
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
  });
};

module.exports = { AppError, errorHandler };
