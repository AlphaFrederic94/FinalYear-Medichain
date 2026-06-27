const env = require('./config/env');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./utils/logger');
const routes = require('./routes/blockchain.routes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '10mb' }));

// Register API Routes
app.use('/blockchain', routes);

// OpenAPI JSON Docs for API Gateway Swagger UI
app.get('/blockchain/api-docs-json', (req, res) => {
  res.json({
    openapi: "3.0.0",
    info: {
      title: "Blockchain Service",
      version: "1.0.0",
      description: "Cryptographic Ledger & Consent Service API"
    },
    paths: {}
  });
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'blockchain-service',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info(`Blockchain service listening on port ${env.PORT}`);
});

module.exports = app;
