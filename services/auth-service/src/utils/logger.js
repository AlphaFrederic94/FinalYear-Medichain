const winston = require('winston');
const env = require('../config/env');

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: env.SERVICE_NAME },
  transports: [
    new winston.transports.Console({
      format:
        env.NODE_ENV === 'development'
          ? winston.format.combine(winston.format.colorize(), winston.format.simple())
          : winston.format.json(),
    }),
  ],
});

module.exports = logger;
