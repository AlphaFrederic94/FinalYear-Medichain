const Redis = require('ioredis');
const env = require('../config/env');
const logger = require('../utils/logger');

let redis;
const useRedis = env.REDIS_URL && !/localhost|127\.0\.0\.1/.test(env.REDIS_URL);
const inMemoryStore = {
  refresh: new Map(),
  blacklist: new Map(),
};

const now = () => Date.now();
const isFresh = (entry) => entry && (!entry.expiresAt || entry.expiresAt > now());

const getClient = () => {
  if (!useRedis) {
    return null;
  }

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
    const client = getClient();
    if (!client) {
      inMemoryStore.refresh.set(tokenHash, {
        value: userId,
        expiresAt: now() + (REFRESH_TTL * 1000),
      });
      return;
    }

    await client.set(`refresh:${tokenHash}`, userId, 'EX', REFRESH_TTL);
  }

  async getRefreshToken(tokenHash) {
    const client = getClient();
    if (!client) {
      const entry = inMemoryStore.refresh.get(tokenHash);
      if (!isFresh(entry)) {
        inMemoryStore.refresh.delete(tokenHash);
        return null;
      }
      return entry.value;
    }

    return client.get(`refresh:${tokenHash}`);
  }

  async deleteRefreshToken(tokenHash) {
    const client = getClient();
    if (!client) {
      inMemoryStore.refresh.delete(tokenHash);
      return;
    }

    return client.del(`refresh:${tokenHash}`);
  }

  async blacklistAccessToken(tokenHash, ttlSeconds) {
    const client = getClient();
    if (!client) {
      inMemoryStore.blacklist.set(tokenHash, {
        value: '1',
        expiresAt: now() + (ttlSeconds * 1000),
      });
      return;
    }

    await client.set(`blacklist:${tokenHash}`, '1', 'EX', ttlSeconds);
  }

  async isBlacklisted(tokenHash) {
    const client = getClient();
    if (!client) {
      const entry = inMemoryStore.blacklist.get(tokenHash);
      if (!isFresh(entry)) {
        inMemoryStore.blacklist.delete(tokenHash);
        return false;
      }
      return true;
    }

    const result = await client.exists(`blacklist:${tokenHash}`);
    return result === 1;
  }
}

module.exports = new TokenRepository();
