require('dotenv').config();
const { cleanEnv, str, port } = require('envalid');

module.exports = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
  PORT: port({ default: 3000 }),
  AUTH_SERVICE_URL: str({ default: 'http://localhost:3001' }),
  PATIENT_SERVICE_URL: str({ default: 'http://localhost:3002' }),
  RECORDS_SERVICE_URL: str({ default: 'http://localhost:3003' }),
  PROVIDER_SERVICE_URL: str({ default: 'http://localhost:3004' }),
  BLOCKCHAIN_SERVICE_URL: str({ default: 'http://localhost:3005' }),
  REDIS_URL: str({ default: 'redis://localhost:6379' }),
  JWT_SECRET: str(),
  LOG_LEVEL: str({ default: 'info' }),
});
