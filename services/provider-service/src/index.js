require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const morgan  = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi    = require('swagger-ui-express');
const { PrismaClient } = require('@prisma/client');

const env            = require('./config/env');
const logger         = require('./utils/logger');
const providerRoutes = require('./routes/provider.routes');
const { errorHandler } = require('./middleware/errorHandler');

const app    = express();
const prisma = new PrismaClient();

app.use(helmet()); app.use(cors()); app.use(express.json());
app.use(morgan('combined', { stream: { write: (m) => logger.info(m.trim()) } }));

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'AfriHealth Chain — Provider Service', version: '1.0.0' },
    servers: [{ url: `http://localhost:${env.PORT}` }],
    components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
  },
  apis: ['./src/routes/*.js'],
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/providers/api-docs-json', (req, res) => res.json(swaggerSpec));

app.get('/health', async (req, res) => {
  let dbConnected = false;
  try { await prisma.$queryRaw`SELECT 1`; dbConnected = true; } catch {}
  res.status(dbConnected ? 200 : 503).json({ status: dbConnected ? 'ok' : 'degraded', service: env.SERVICE_NAME, uptime: process.uptime(), dbConnected, timestamp: new Date().toISOString() });
});

app.use('/providers', providerRoutes);
app.use((req, res) => res.status(404).json({ success: false, error: 'Route not found', code: 'NOT_FOUND' }));
app.use(errorHandler);

const start = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected');
    app.listen(env.PORT, () => {
      logger.info(`Provider service running on port ${env.PORT}`);
    });
  } catch (err) { logger.error('Failed to start', { err }); process.exit(1); }
};
process.on('SIGTERM', async () => { await prisma.$disconnect(); process.exit(0); });
start();
module.exports = app;
