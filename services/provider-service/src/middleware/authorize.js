const { AppError } = require('./authenticate');
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
  if (!roles.includes(req.user.role)) return next(new AppError('Forbidden', 403, 'FORBIDDEN'));
  next();
};
module.exports = { authorize };
