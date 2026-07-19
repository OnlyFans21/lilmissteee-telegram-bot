/**
 * ============================================================
 * ADMIN COMMANDS
 * /stats, /users, /broadcast, /export
 * ============================================================
 */

const userService = require('../services/referral');
const BroadcastService = require('../services/broadcast');
const logger = require('../utils/logger');

const ADMIN_IDS = process.env.ADMIN_TELEGRAM_IDS
  ? process.env.ADMIN_TELEGRAM_IDS.split(',').map(id => id.trim())
  : [];

/**
 * Check if user is admin
 */
function isAdmin(userId) {
  return ADMIN_IDS.includes(userId.toString());
}

/**
 * Format number with commas
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format date for display
 */
function formatDate(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Admin command states for multi-step commands
 */
const adminStates = new Map();

function registerAdminCommands(bot) {
  const broadcastService = new BroadcastService(bot);

  // ==================== /stats ====================
  bot.onText(/^\/stats$/, async (msg) => {
    const userId = msg.from.id.toString();
    if (!isAdmin(userId)) {
      await bot.sendMessage(msg.chat.id, '⛔ You are not authorized to use this command.');
      return;
    }

    try {
      const stats = await userService.getStats();

      let message = '📊 *Bot Statistics*\n\n';
      message += `👥 *Total Users:* ${formatNumber(stats.totalUsers)}\n`;
      message += `📈 *New Today:* ${formatNumber(stats.todayUsers)}\n`;
      message += `⚡ *Active (7d):* ${formatNumber(stats.activeUsers)}\n`;
      message += `🔗 *Total Referrals:* ${formatNumber(stats.totalReferrals)}\n\n`;

      if (stats.dailyJoins && stats.dailyJoins.length > 0) {
        message += '📅 *Daily Joins (Last 7 Days):*\n';
        stats.dailyJoins.forEach((day) => {
          message += `  ${day.date}: ${formatNumber(day.count)} users\n`;
        });
      }

      await bot.sendMessage(msg.chat.id, message, {
        parse_mode: 'Markdown',
      });

      logger.info(`Stats viewed by admin ${userId}`);
    } catch (error) {
      logger.error('Error in /stats command:', error.message);
      await bot.sendMessage(msg.chat.id, '❌ Error fetching statistics.');
    }
  });

  // ==================== /users ====================
  bot.onText(/^\/users$/, async (msg) => {
    const userId = msg.from.id.toString();
    if (!isAdmin(userId)) {
      await bot.sendMessage(msg.chat.id, '⛔ You are not authorized to use this command.');
      return;
    }

    try {
      const stats = await userService.getStats();
      const topReferrers = await userService.getTopReferrers(5);

      let message = '👥 *User Overview*\n\n';
      message += `Total Users: ${formatNumber(stats.totalUsers)}\n`;
      message += `New Today: ${formatNumber(stats.todayUsers)}\n`;
      message += `Active (7d): ${formatNumber(stats.activeUsers)}\n\n`;

      if (topReferrers.length > 0) {
        message += '🏆 *Top Referrers:*\n';
        topReferrers.forEach((ref, index) => {
          const name = ref.username || ref.first_name || 'Unknown';
          message += `${index + 1}. ${name} - ${formatNumber(ref.total_referrals)} refs\n`;
        });
      }

      await bot.sendMessage(msg.chat.id, message, {
        parse_mode: 'Markdown',
      });

      logger.info(`Users overview viewed by admin ${userId}`);
    } catch (error) {
      logger.error('Error in /users command:', error.message);
      await bot.sendMessage(msg.chat.id, '❌ Error fetching users.');
    }
  });

  // ==================== /broadcast ====================
  bot.onText(/^\/broadcast(?:\s+(.+))?$/, async (msg, match) => {
    const userId = msg.from.id.toString();
    if (!isAdmin(userId)) {
      await bot.sendMessage(msg.chat.id, '⛔ You are not authorized to use this command.');
      return;
    }

    const broadcastText = match[1] ? match[1].trim() : null;

    if (!broadcastText) {
      await bot.sendMessage(
        msg.chat.id,
        '📢 *Broadcast Message*\n\nPlease send the message you want to broadcast to all users.\n\nReply to this message with your broadcast text.',
        { parse_mode: 'Markdown' }
      );
      adminStates.set(userId, { state: 'awaiting_broadcast', chatId: msg.chat.id });
      return;
    }

    // Confirm broadcast
    await bot.sendMessage(
      msg.chat.id,
      `📢 *Confirm Broadcast*\n\nMessage:\n${broadcastText}\n\nSend /confirm to broadcast or /cancel to abort.`,
      { parse_mode: 'Markdown' }
    );
    adminStates.set(userId, { state: 'confirm_broadcast', message: broadcastText, chatId: msg.chat.id });
  });

  // Handle broadcast confirmation
  bot.onText(/^\/confirm$/, async (msg) => {
    const userId = msg.from.id.toString();
    const state = adminStates.get(userId);

    if (!state || state.state !== 'confirm_broadcast') {
      return;
    }

    adminStates.delete(userId);

    try {
      await broadcastService.broadcast(state.message, userId, { parse_mode: 'HTML' });
    } catch (error) {
      logger.error('Error in broadcast:', error.message);
      await bot.sendMessage(msg.chat.id, '❌ Error during broadcast.');
    }
  });

  // Handle broadcast cancellation
  bot.onText(/^\/cancel$/, async (msg) => {
    const userId = msg.from.id.toString();
    if (adminStates.has(userId)) {
      adminStates.delete(userId);
      await bot.sendMessage(msg.chat.id, '❌ Broadcast cancelled.');
    }
  });

  // Handle reply-based broadcast
  bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;

    const userId = msg.from.id.toString();
    const state = adminStates.get(userId);

    if (!state || state.state !== 'awaiting_broadcast') return;

    adminStates.delete(userId);

    await bot.sendMessage(
      msg.chat.id,
      `📢 *Confirm Broadcast*\n\nMessage:\n${msg.text}\n\nSend /confirm to broadcast or /cancel to abort.`,
      { parse_mode: 'Markdown' }
    );
    adminStates.set(userId, { state: 'confirm_broadcast', message: msg.text, chatId: msg.chat.id });
  });

  // ==================== /export ====================
  bot.onText(/^\/export$/, async (msg) => {
    const userId = msg.from.id.toString();
    if (!isAdmin(userId)) {
      await bot.sendMessage(msg.chat.id, '⛔ You are not authorized to use this command.');
      return;
    }

    try {
      await bot.sendMessage(msg.chat.id, '📥 Exporting user data... This may take a moment.');

      const users = await userService.exportUsers();

      if (users.length === 0) {
        await bot.sendMessage(msg.chat.id, '❌ No users found to export.');
        return;
      }

      // Create CSV content
      const headers = ['telegram_id', 'username', 'first_name', 'last_name', 'language', 'joined_date', 'referral_code', 'referred_by', 'total_referrals', 'is_active'];
      let csv = headers.join(',') + '\n';

      users.forEach((user) => {
        const row = headers.map((h) => {
          const val = user[h] || '';
          return `"${String(val).replace(/"/g, '""')}"`;
        });
        csv += row.join(',') + '\n';
      });

      // Send as document
      const buffer = Buffer.from(csv, 'utf-8');
      await bot.sendDocument(msg.chat.id, buffer, {
        filename: `users_export_${new Date().toISOString().split('T')[0]}.csv`,
        caption: `📥 User Export Complete\nTotal: ${users.length} users`,
      });

      logger.info(`User data exported by admin ${userId}. Total: ${users.length}`);
    } catch (error) {
      logger.error('Error in /export command:', error.message);
      await bot.sendMessage(msg.chat.id, '❌ Error exporting user data.');
    }
  });
}

module.exports = registerAdminCommands;
