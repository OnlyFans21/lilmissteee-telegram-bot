/**
 * ============================================================
 * CALLBACK QUERY HANDLERS
 * Handles all inline button interactions
 * ============================================================
 */

const userService = require('../services/userService');
const config = require('../config/bot');
const {
  getMainKeyboard,
  getPremiumKeyboard,
  getReferralKeyboard,
  getHelpKeyboard,
} = require('../keyboard/mainKeyboard');
const logger = require('../utils/logger');
const { formatNumber } = require('../utils/helpers');

/**
 * Register all callback query handlers
 * @param {Object} bot - Telegram bot instance
 */
function registerCallbacks(bot) {
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const userId = query.from.id;
    const data = query.data;

    try {
      // Answer callback to stop loading animation
      await bot.answerCallbackQuery(query.id);

      switch (data) {
        case 'premium_access':
          await handlePremiumAccess(bot, chatId, messageId, userId);
          break;

        case 'referral_program':
          await handleReferralProgram(bot, chatId, messageId, userId);
          break;

        case 'help':
          await handleHelp(bot, chatId, messageId, userId);
          break;

        case 'back_to_menu':
          await handleBackToMenu(bot, chatId, messageId);
          break;

        case 'copy_referral':
          await handleCopyReferral(bot, query, userId);
          break;

        case 'my_referral_stats':
          await handleMyReferralStats(bot, chatId, messageId, userId);
          break;

        case 'admin_stats':
          await handleAdminStats(bot, chatId, messageId, userId);
          break;

        case 'admin_users':
          await handleAdminUsers(bot, chatId, messageId, userId);
          break;

        case 'admin_broadcast':
          await handleAdminBroadcast(bot, chatId, userId);
          break;

        case 'admin_export':
          await handleAdminExport(bot, chatId, userId);
          break;

        default:
          logger.warn(`Unknown callback: ${data}`);
      }

      // Track button click
      await userService.trackButtonClick(userId, data);
    } catch (error) {
      logger.error('Error handling callback query:', error.message);
    }
  });
}

/**
 * Handle Premium Access button
 */
async function handlePremiumAccess(bot, chatId, messageId, userId) {
  const message =
    `💎 *Premium Access*\n\n` +
    `Unlock exclusive content and premium features!\n\n` +
    `🔥 Click below to subscribe and get instant access.\n\n` +
    `✅ Exclusive photos & videos\n` +
    `✅ Priority support\n` +
    `✅ Behind-the-scenes content`;

  await bot.editMessageText(message, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'Markdown',
    reply_markup: getPremiumKeyboard(),
  });

  await userService.trackWebsiteClick(userId, config.links.onlyfans);
}

/**
 * Handle Referral Program button
 */
async function handleReferralProgram(bot, chatId, messageId, userId) {
  const user = await userService.getUser(userId);

  if (!user) {
    await bot.sendMessage(chatId, '❌ User not found. Please start the bot again with /start');
    return;
  }

  const referralLink = `https://t.me/${config.links.onlyfans}?start=${user.referral_code}`;

  const message =
    `🎁 *Referral Program*\n\n` +
    `Invite your friends and earn rewards!\n\n` +
    `Your Referral Code: \`${user.referral_code}\`\n\n` +
    `🔗 Your Referral Link:\n` +
    `${referralLink}\n\n` +
    `👥 Total Referrals: ${formatNumber(user.total_referrals || 0)}\n\n` +
    `Share your link with friends and watch your referrals grow!`;

  await bot.editMessageText(message, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'Markdown',
    reply_markup: getReferralKeyboard(referralLink),
  });
}

/**
 * Handle Help button
 */
async function handleHelp(bot, chatId, messageId, userId) {
  const message =
    `ℹ️ *Help & Support*\n\n` +
    `Welcome to Lilmissteee Official Bot!\n\n` +
    `*Available Commands:*\n` +
    `/start - Start the bot and see the main menu\n` +
    `/help - Show this help message\n\n` +
    `*Features:*\n` +
    `🔥 Subscribe to exclusive content\n` +
    `📢 Join our Telegram channel\n` +
    `💎 Get premium access\n` +
    `🎁 Earn rewards through referrals\n\n` +
    `*Need Help?*\n` +
    `Contact us through our Telegram channel.`;

  await bot.editMessageText(message, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'Markdown',
    reply_markup: getHelpKeyboard(),
  });
}

/**
 * Handle Back to Menu button
 */
async function handleBackToMenu(bot, chatId, messageId) {
  const message = `Welcome to Lilmissteee Official ❤️\n\nChoose an option below to get started.`;

  await bot.editMessageText(message, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'HTML',
    reply_markup: getMainKeyboard(),
  });
}

/**
 * Handle Copy Referral button
 */
async function handleCopyReferral(bot, query, userId) {
  const user = await userService.getUser(userId);
  if (!user) return;

  const referralLink = `https://t.me/${config.links.onlyfans}?start=${user.referral_code}`;

  await bot.answerCallbackQuery(query.id, {
    text: `Link copied! Share: ${referralLink}`,
    show_alert: true,
  });
}

/**
 * Handle My Referral Stats button
 */
async function handleMyReferralStats(bot, chatId, messageId, userId) {
  const user = await userService.getUser(userId);
  if (!user) return;

  const referralLink = `https://t.me/${config.links.onlyfans}?start=${user.referral_code}`;

  const message =
    `📊 *My Referral Stats*\n\n` +
    `👥 Total Referrals: ${formatNumber(user.total_referrals || 0)}\n` +
    `🔗 Referral Code: \`${user.referral_code}\`\n\n` +
    `Keep sharing your link to earn more rewards!`;

  await bot.editMessageText(message, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'Markdown',
    reply_markup: getReferralKeyboard(referralLink),
  });
}

/**
 * Handle Admin Stats button
 */
async function handleAdminStats(bot, chatId, messageId, userId) {
  const { isAdmin } = require('../utils/helpers');
  if (!isAdmin(userId.toString())) return;

  const stats = await userService.getStats();

  let message = `📊 *Bot Statistics*\n\n`;
  message += `👥 Total Users: ${formatNumber(stats.totalUsers)}\n`;
  message += `📈 New Today: ${formatNumber(stats.todayUsers)}\n`;
  message += `⚡ Active (7d): ${formatNumber(stats.activeUsers)}\n`;
  message += `🔗 Total Referrals: ${formatNumber(stats.totalReferrals)}\n`;

  await bot.editMessageText(message, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'Markdown',
  });
}

/**
 * Handle Admin Users button
 */
async function handleAdminUsers(bot, chatId, messageId, userId) {
  const { isAdmin } = require('../utils/helpers');
  if (!isAdmin(userId.toString())) return;

  const stats = await userService.getStats();
  const topReferrers = await userService.getTopReferrers(5);

  let message = `👥 *User Overview*\n\n`;
  message += `Total Users: ${formatNumber(stats.totalUsers)}\n`;
  message += `New Today: ${formatNumber(stats.todayUsers)}\n\n`;

  if (topReferrers.length > 0) {
    message += `🏆 *Top Referrers:*\n`;
    topReferrers.forEach((ref, index) => {
      const name = ref.username || ref.first_name || 'Unknown';
      message += `${index + 1}. ${name} - ${formatNumber(ref.total_referrals)} refs\n`;
    });
  }

  await bot.editMessageText(message, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'Markdown',
  });
}

/**
 * Handle Admin Broadcast button
 */
async function handleAdminBroadcast(bot, chatId, userId) {
  const { isAdmin } = require('../utils/helpers');
  if (!isAdmin(userId.toString())) return;

  await bot.sendMessage(
    chatId,
    '📢 *Broadcast Message*\n\nPlease send the message you want to broadcast to all users.\n\nUse /broadcast [message] or reply to this message.',
    { parse_mode: 'Markdown' }
  );
}

/**
 * Handle Admin Export button
 */
async function handleAdminExport(bot, chatId, userId) {
  const { isAdmin } = require('../utils/helpers');
  if (!isAdmin(userId.toString())) return;

  try {
    await bot.sendMessage(chatId, '📥 Exporting user data...');

    const users = await userService.exportUsers();

    const headers = ['telegram_id', 'username', 'first_name', 'last_name', 'language', 'joined_date', 'referral_code', 'referred_by', 'total_referrals', 'is_active'];
    let csv = headers.join(',') + '\n';

    users.forEach((user) => {
      const row = headers.map((h) => {
        const val = user[h] || '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csv += row.join(',') + '\n';
    });

    const buffer = Buffer.from(csv, 'utf-8');
    await bot.sendDocument(chatId, buffer, {
      filename: `users_export_${new Date().toISOString().split('T')[0]}.csv`,
      caption: `📥 Export Complete\nTotal: ${users.length} users`,
    });
  } catch (error) {
    logger.error('Error exporting users:', error.message);
    await bot.sendMessage(chatId, '❌ Error exporting user data.');
  }
}

module.exports = registerCallbacks;
