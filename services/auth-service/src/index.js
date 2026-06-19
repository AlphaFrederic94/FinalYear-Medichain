require('./config/env');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { PrismaClient } = require('@prisma/client');

const env = require('./config/env');
const logger = require('./utils/logger');
const authRoutes = require('./routes/auth.routes');
const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');

const app = express();
const prisma = new PrismaClient();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(rateLimiter);

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AfriHealth Chain — Auth Service',
      version: '1.0.0',
      description: 'Authentication & Identity API',
    },
    servers: [{ url: `http://localhost:${env.PORT}` }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/auth/api-docs-json', (req, res) => res.json(swaggerSpec));

app.get('/health', async (req, res) => {
  let dbConnected = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
  } catch {}

  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'ok' : 'degraded',
    service: env.SERVICE_NAME,
    uptime: process.uptime(),
    dbConnected,
    timestamp: new Date().toISOString(),
  });
});

app.use('/auth', authRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found', code: 'NOT_FOUND' });
});

app.use(errorHandler);

const start = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    app.listen(env.PORT, () => {
      logger.info(`Auth service running on port ${env.PORT}`);
      logger.info(`Swagger UI: http://localhost:${env.PORT}/api-docs`);
    });
  } catch (err) {
    logger.error('Failed to start auth service', { err });
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

start();

module.exports = app;
