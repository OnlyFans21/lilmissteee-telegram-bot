/**
 * ============================================================
 * LILMISSTEEE TELEGRAM BOT - MAIN ENTRY POINT
 * Production-ready Telegram marketing bot backend
 * ============================================================
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { testConnection } = require('./config/supabase');
const { initBot } = require('./config/telegram');
const logger = require('./utils/logger');

// Command handlers
const registerStartCommand = require('./commands/start');
const registerHelpCommand = require('./commands/help');
const registerAdminCommands = require('./commands/admin');

// Routes
const webhookRoute = require('./routes/webhook');

// ==================== INITIALIZE BOT ====================
const bot = initBot();

logger.info('Lilmissteee Bot initialized');
logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

// ==================== REGISTER HANDLERS ====================
registerStartCommand(bot);
registerHelpCommand(bot);
registerAdminCommands(bot);

// ==================== EXPRESS SERVER ====================
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests' },
});
app.use(limiter);

// Webhook route
app.use('/webhook', webhookRoute(bot));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    bot: 'Lilmissteee Bot',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Express error:', err.message);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ==================== START SERVER ====================
const PORT = parseInt(process.env.WEBHOOK_PORT) || 3000;

async function startServer() {
  const dbConnected = await testConnection();
  if (!dbConnected) {
    logger.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server:', error.message);
  process.exit(1);
});

module.exports = { bot, app };
