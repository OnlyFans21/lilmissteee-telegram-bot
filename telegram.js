/**
 * ============================================================
 * TELEGRAM BOT CONFIGURATION
 * Bot initialization and settings
 * ============================================================
 */

const TelegramBot = require('node-telegram-bot-api');
const logger = require('../utils/logger');

const token = process.env.TELEGRAM_BOT_TOKEN;
const username = process.env.BOT_USERNAME || 'LilmissteeeXbot';
const env = process.env.NODE_ENV || 'development';

if (!token) {
  logger.error('TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

/**
 * Initialize Telegram Bot
 */
function initBot() {
  const bot = new TelegramBot(token, {
    polling: env === 'development',
    webHook: env === 'production' ? {
      port: parseInt(process.env.WEBHOOK_PORT) || 3000,
    } : false,
  });

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

  // Unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', reason);
  });

  // Uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error.message);
    logger.error(error.stack);
    setTimeout(() => process.exit(1), 1000);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down...');
    bot.stopPolling();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down...');
    bot.stopPolling();
    process.exit(0);
  });

  return bot;
}

module.exports = { initBot, token, username };
