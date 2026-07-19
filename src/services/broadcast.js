/**
 * ============================================================
 * BROADCAST SERVICE
 * Handles message broadcasting to all users
 * ============================================================
 */

const userService = require('./userService');
const logger = require('../utils/logger');
const { sleep } = require('../utils/helpers');

class BroadcastService {
  constructor(bot) {
    this.bot = bot;
  }

  /**
   * Broadcast a message to all active users
   * @param {string} message - Message to broadcast
   * @param {string} adminId - Admin Telegram ID who initiated broadcast
   * @param {Object} options - Optional: parse_mode, disable_web_page_preview, etc.
   */
  async broadcast(message, adminId, options = {}) {
    const users = await userService.getAllUsers();
    const results = {
      total: users.length,
      sent: 0,
      failed: 0,
      errors: [],
    };

    logger.info(`Broadcast started by admin ${adminId}. Target: ${users.length} users`);

    // Send status to admin
    const statusMsg = await this.bot.sendMessage(
      adminId,
      `📢 Broadcast Started\n\nTarget: ${users.length} users\nStatus: Sending...`,
      { parse_mode: 'Markdown' }
    );

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      try {
        await this.bot.sendMessage(user.telegram_id, message, {
          parse_mode: options.parse_mode || 'HTML',
          disable_web_page_preview: options.disable_web_page_preview || false,
          ...options,
        });
        results.sent++;

        // Rate limiting: 30 messages per second max
        if (i % 30 === 0 && i > 0) {
          await sleep(1000);
        } else {
          await sleep(35); // ~28 messages per second
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ userId: user.telegram_id, error: error.message });
        logger.error(`Failed to send to ${user.telegram_id}:`, error.message);

        // If user blocked the bot, mark as inactive
        if (error.response?.body?.error_code === 403) {
          await this.markUserInactive(user.telegram_id);
        }
      }

      // Update status every 100 messages
      if (i % 100 === 0 && i > 0) {
        await this.bot.editMessageText(
          `📢 Broadcast in Progress\n\nTarget: ${users.length}\nSent: ${results.sent}\nFailed: ${results.failed}\nProgress: ${Math.round((i / users.length) * 100)}%`,
          {
            chat_id: adminId,
            message_id: statusMsg.message_id,
            parse_mode: 'Markdown',
          }
        );
      }
    }

    // Final status update
    await this.bot.editMessageText(
      `✅ Broadcast Complete\n\nTarget: ${results.total}\nSent: ${results.sent}\nFailed: ${results.failed}\nSuccess Rate: ${((results.sent / results.total) * 100).toFixed(1)}%`,
      {
        chat_id: adminId,
        message_id: statusMsg.message_id,
        parse_mode: 'Markdown',
      }
    );

    // Log analytics
    await userService.trackAnalytics('broadcast', adminId, {
      total: results.total,
      sent: results.sent,
      failed: results.failed,
    });

    logger.info(`Broadcast completed. Sent: ${results.sent}, Failed: ${results.failed}`);
    return results;
  }

  /**
   * Mark user as inactive
   */
  async markUserInactive(telegramId) {
    try {
      const { supabase } = require('../config/database');
      await supabase
        .from('users')
        .update({ is_active: false })
        .eq('telegram_id', telegramId);
    } catch (error) {
      logger.error('Error marking user inactive:', error.message);
    }
  }

  /**
   * Broadcast with media (photo, video, document)
   */
  async broadcastMedia(mediaType, mediaUrl, caption, adminId, options = {}) {
    const users = await userService.getAllUsers();
    const results = {
      total: users.length,
      sent: 0,
      failed: 0,
    };

    logger.info(`Media broadcast started by admin ${adminId}. Type: ${mediaType}`);

    const sendMethod = this.getSendMethod(mediaType);

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      try {
        await this.bot[sendMethod](user.telegram_id, mediaUrl, {
          caption: caption || '',
          parse_mode: options.parse_mode || 'HTML',
          ...options,
        });
        results.sent++;

        if (i % 30 === 0 && i > 0) {
          await sleep(1000);
        } else {
          await sleep(35);
        }
      } catch (error) {
        results.failed++;
        logger.error(`Failed to send media to ${user.telegram_id}:`, error.message);
      }
    }

    await userService.trackAnalytics('broadcast_media', adminId, {
      media_type: mediaType,
      total: results.total,
      sent: results.sent,
      failed: results.failed,
    });

    return results;
  }

  /**
   * Get the correct send method based on media type
   */
  getSendMethod(mediaType) {
    const methods = {
      photo: 'sendPhoto',
      video: 'sendVideo',
      document: 'sendDocument',
      audio: 'sendAudio',
      voice: 'sendVoice',
    };
    return methods[mediaType] || 'sendMessage';
  }
}

module.exports = BroadcastService;
