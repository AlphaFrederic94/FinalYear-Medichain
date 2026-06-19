const winston = require('winston');
const env = require('../config/env');
module.exports = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  defaultMeta: { service: env.SERVICE_NAME },
  transports: [new winston.transports.Console()],
});
