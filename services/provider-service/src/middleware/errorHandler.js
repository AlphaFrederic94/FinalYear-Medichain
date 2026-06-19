const logger = require('../utils/logger');
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message); this.statusCode = statusCode; this.code = code; this.isOperational = true;
  }
}
const errorHandler = (err, req, res, next) => {
  if (!err.isOperational) logger.error('Unexpected error', { err: err.message, stack: err.stack });
  res.status(err.statusCode || 500).json({ success: false, error: err.message, code: err.code || 'INTERNAL_ERROR' });
};
module.exports = { errorHandler, AppError };
