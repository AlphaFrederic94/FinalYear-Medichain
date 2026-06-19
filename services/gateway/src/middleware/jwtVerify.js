const jwt = require('jsonwebtoken');
const env = require('../config/env');

const PUBLIC_ROUTES = [
  { path: '/api/v1/auth/register', method: 'POST' },
  { path: '/api/v1/auth/login', method: 'POST' },
  { path: '/api/v1/auth/token/refresh', method: 'POST' },
  { path: '/api/v1/auth/logout', method: 'POST' },
  { path: '/api-docs', method: 'ANY' },
  { path: '/health', method: 'GET' },
  { path: '/api-docs-json', method: 'GET' },
];

const isPublic = (req) => {
  const url = req.originalUrl.toLowerCase();
  const method = req.method;

  // Broad bypass for documentation and health checks
  if (url.includes('api-docs') || url.includes('health')) {
    return true;
  }

  return PUBLIC_ROUTES.some(
    (r) => url.startsWith(r.path.toLowerCase()) && (r.method === 'ANY' || r.method === method)
  );
};

const jwtVerify = (req, res, next) => {
  if (isPublic(req)) return next();

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    console.log(`[Gateway] Blocked unauthorized request to: ${req.method} ${req.path}`);
    return res.status(401).json({ success: false, error: 'No token provided', code: 'UNAUTHORIZED' });
  }

  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.headers['x-user-id'] = payload.sub;
    req.headers['x-user-did'] = payload.did;
    req.headers['x-user-role'] = payload.role;
    req.headers['x-user-email'] = payload.email;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
  }
};

module.exports = { jwtVerify };
