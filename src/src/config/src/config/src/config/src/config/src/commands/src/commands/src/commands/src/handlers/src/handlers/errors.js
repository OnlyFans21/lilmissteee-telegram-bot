/**
 * ============================================================
 * ERROR HANDLERS
 * Global error handling for the bot
 * ============================================================
 */

const logger = require('../utils/logger');

/**
 * Register error handlers for the bot
 * @param {Object} bot - Telegram bot instance
 */
function registerErrorHandlers(bot) {
  // Handle polling errors
  bot.on('polling_error', (error) => {
    logger.error('Polling error:', error.message);
  });

  // Handle webhook errors
  bot.on('webhook_error', (error) => {
    logger.error('Webhook error:', error.message);
  });

  // Handle general errors
  bot.on('error', (error) => {
    logger.error('Bot error:', error.message);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error.message);
    logger.error(error.stack);
    // Graceful shutdown
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Handle SIGTERM (graceful shutdown)
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    bot.stopPolling();
    process.exit(0);
  });

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    bot.stopPolling();
    process.exit(0);
  });
}

module.exports = registerErrorHandlers;
