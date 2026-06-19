const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const Redis = require('ioredis');
const env = require('../config/env');

const redis = new Redis(env.REDIS_URL);

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
});

const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
});

module.exports = { rateLimiter, strictRateLimiter };
