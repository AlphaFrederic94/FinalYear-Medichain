const { AppError } = require('./errorHandler');

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return next(new AppError(message, 400, 'VALIDATION_ERROR'));
  }
  req.body = result.data;
  next();
};

module.exports = { validate };
