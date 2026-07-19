/**
 * ============================================================
 * /HELP COMMAND
 * Displays help information to users
 * ============================================================
 */

const logger = require('../utils/logger');

const ONLYFANS_LINK = process.env.ONLYFANS_LINK || 'https://onlyfan.fun/?u=Lilmissteee';
const TELEGRAM_CHANNEL = process.env.TELEGRAM_CHANNEL || 'Lilmissteee';

function registerHelpCommand(bot) {
  bot.onText(/^\/help$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      const message =
        'ℹ️ *Help & Support*\n\n' +
        'Welcome to Lilmissteee Official Bot!\n\n' +
        '*Available Commands:*\n' +
        '/start - Start the bot and see the main menu\n' +
        '/help - Show this help message\n\n' +
        '*Features:*\n' +
        '🔥 Subscribe to exclusive content\n' +
        '📢 Join our Telegram channel\n' +
        '💎 Get premium access\n' +
        '🎁 Earn rewards through referrals\n\n' +
        '*Need Help?*\n' +
        'Contact us through our Telegram channel.';

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '📢 Join Channel',
              url: `https://t.me/${TELEGRAM_CHANNEL.replace('@', '')}`,
            },
          ],
          [
            {
              text: '🔥 Subscribe',
              url: ONLYFANS_LINK,
            },
          ],
          [
            {
              text: '⬅️ Back to Menu',
              callback_data: 'back_to_menu',
            },
          ],
        ],
      };

      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });

      logger.info(`Help command used by user ${userId}`);
    } catch (error) {
      logger.error('Error handling /help command:', error.message);
      await bot.sendMessage(chatId, '❌ Something went wrong. Please try again later.');
    }
  });
}

module.exports = registerHelpCommand;
