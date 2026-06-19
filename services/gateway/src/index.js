require('./config/env');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const proxy = require('express-http-proxy');
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const Redis = require('ioredis');
const winston = require('winston');

const env = require('./config/env');
const { jwtVerify } = require('./middleware/jwtVerify');
const swaggerUi = require('swagger-ui-express');

const app = express();
const useRedis = env.REDIS_URL && !/localhost|127\.0\.0\.1/.test(env.REDIS_URL);
const redis = useRedis ? new Redis(env.REDIS_URL) : null;

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  defaultMeta: { service: 'gateway' },
  transports: [new winston.transports.Console()],
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' },
  ...(useRedis ? { store: new RedisStore({ sendCommand: (...args) => redis.call(...args) }) } : {}),
});

app.use(helmet());
app.use(cors());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(limiter);
app.use(jwtVerify);

const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    urls: [
      { url: '/api/v1/auth/api-docs-json', name: 'Auth Service' },
      { url: '/api/v1/patients/api-docs-json', name: 'Patient Service' },
      { url: '/api/v1/records/api-docs-json', name: 'Records Service' },
      { url: '/api/v1/providers/api-docs-json', name: 'Provider Service' },
    ],
  },
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(null, swaggerOptions));

const proxyOptions = (target) => ({
  proxyReqPathResolver: (req) => req.originalUrl.replace(/^\/api\/v1\/[^/]+/, '') || '/',
  proxyErrorHandler: (err, res) => {
    logger.error('Proxy error', { target, err: err.message });
    res.status(502).json({ success: false, error: 'Service unavailable', code: 'SERVICE_UNAVAILABLE' });
  },
});

app.use('/api/v1/auth', proxy(env.AUTH_SERVICE_URL, {
  ...proxyOptions(env.AUTH_SERVICE_URL),
  proxyReqPathResolver: (req) => `/auth${req.path}`,
}));

app.use('/api/v1/patients', proxy(env.PATIENT_SERVICE_URL, {
  ...proxyOptions(env.PATIENT_SERVICE_URL),
  proxyReqPathResolver: (req) => `/patients${req.path}`,
}));

app.use('/api/v1/records', proxy(env.RECORDS_SERVICE_URL, {
  ...proxyOptions(env.RECORDS_SERVICE_URL),
  proxyReqPathResolver: (req) => `/records${req.path}`,
}));

app.use('/api/v1/providers', proxy(env.PROVIDER_SERVICE_URL, {
  ...proxyOptions(env.PROVIDER_SERVICE_URL),
  proxyReqPathResolver: (req) => `/providers${req.path}`,
}));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'gateway',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found', code: 'NOT_FOUND' });
});

app.listen(env.PORT, () => {
  logger.info(`Gateway running on port ${env.PORT}`);
});

module.exports = app;
