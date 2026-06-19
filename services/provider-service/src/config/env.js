const { cleanEnv, str, port } = require('envalid');
module.exports = cleanEnv(process.env, {
  NODE_ENV:                str({ choices: ['development', 'test', 'production'], default: 'development' }),
  PORT:                    port({ default: 3004 }),
  SERVICE_NAME:            str({ default: 'provider-service' }),
  DATABASE_URL:            str(),
  JWT_SECRET:              str(),
  INTERNAL_SERVICE_SECRET: str(),
  LOG_LEVEL:               str({ default: 'info' }),
});
