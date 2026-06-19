require('dotenv').config();
const { cleanEnv, str, port, num } = require('envalid');

module.exports = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
  PORT: port({ default: 3001 }),
  DATABASE_URL: str(),
  REDIS_URL: str({ default: 'redis://localhost:6379' }),
  JWT_SECRET: str(),
  JWT_ACCESS_EXPIRES_IN: str({ default: '15m' }),
  JWT_REFRESH_EXPIRES_DAYS: num({ default: 30 }),
  LOG_LEVEL: str({ default: 'debug' }),
  SERVICE_NAME: str({ default: 'auth-service' }),
  INTERNAL_SERVICE_SECRET: str({ default: 'change-me' }),
});
