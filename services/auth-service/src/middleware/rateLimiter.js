const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const Redis = require('ioredis');
const env = require('../config/env');

const useRedis = env.REDIS_URL && !/localhost|127\.0\.0\.1/.test(env.REDIS_URL);
const redis = useRedis ? new Redis(env.REDIS_URL) : null;

const redisStore = useRedis
  ? new RedisStore({
      sendCommand: (...args) => redis.call(...args),
    })
  : null;

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
  ...(redisStore ? { store: redisStore } : {}),
});

const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  ...(redisStore ? { store: redisStore } : {}),
});

module.exports = { rateLimiter, strictRateLimiter };
