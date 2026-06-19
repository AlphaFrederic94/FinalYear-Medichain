const Redis = require('ioredis');
const env = require('../config/env');
const logger = require('../utils/logger');

let redis;

const getClient = () => {
  if (!redis) {
    redis = new Redis(env.REDIS_URL);
    redis.on('error', (err) => logger.error('Redis error', { err }));
    redis.on('connect', () => logger.info('Redis connected'));
  }
  return redis;
};

const REFRESH_TTL = env.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60;

class TokenRepository {
  async storeRefreshToken(userId, tokenHash) {
    await getClient().set(`refresh:${tokenHash}`, userId, 'EX', REFRESH_TTL);
  }

  async getRefreshToken(tokenHash) {
    return getClient().get(`refresh:${tokenHash}`);
  }

  async deleteRefreshToken(tokenHash) {
    return getClient().del(`refresh:${tokenHash}`);
  }

  async blacklistAccessToken(tokenHash, ttlSeconds) {
    await getClient().set(`blacklist:${tokenHash}`, '1', 'EX', ttlSeconds);
  }

  async isBlacklisted(tokenHash) {
    const result = await getClient().exists(`blacklist:${tokenHash}`);
    return result === 1;
  }
}

module.exports = new TokenRepository();
