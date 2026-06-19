const { AppError } = require('./errorHandler');
const validate = (schema) => (req, res, next) => {
  const r = schema.safeParse(req.body);
  if (!r.success) return next(new AppError(r.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '), 400, 'VALIDATION_ERROR'));
  req.body = r.data; next();
};
module.exports = { validate };
