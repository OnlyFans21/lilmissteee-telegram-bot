/**
 * ============================================================
 * WEBHOOK ROUTE
 * Express route for Telegram webhook updates
 * ============================================================
 */

const express = require('express');
const logger = require('../utils/logger');

function webhookRoute(bot) {
  const router = express.Router();

  // Telegram webhook endpoint
  router.post('/', (req, res) => {
    try {
      bot.processUpdate(req.body);
      res.sendStatus(200);
    } catch (error) {
      logger.error('Webhook processing error:', error.message);
      res.sendStatus(200);
    }
  });

  // Set webhook endpoint (for manual setup)
  router.get('/set', async (req, res) => {
    try {
      const webhookUrl = process.env.WEBHOOK_URL;
      if (!webhookUrl) {
        return res.status(400).json({ success: false, error: 'WEBHOOK_URL not set' });
      }

      await bot.setWebHook(`${webhookUrl}/webhook`);
      logger.info(`Webhook set to: ${webhookUrl}/webhook`);
      res.json({ success: true, message: 'Webhook set successfully' });
    } catch (error) {
      logger.error('Error setting webhook:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Delete webhook endpoint
  router.get('/delete', async (req, res) => {
    try {
      await bot.deleteWebHook();
      logger.info('Webhook deleted');
      res.json({ success: true, message: 'Webhook deleted successfully' });
    } catch (error) {
      logger.error('Error deleting webhook:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get webhook info
  router.get('/info', async (req, res) => {
    try {
      const info = await bot.getWebHookInfo();
      res.json({ success: true, data: info });
    } catch (error) {
      logger.error('Error getting webhook info:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}

module.exports = webhookRoute;
