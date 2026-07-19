/**
 * ============================================================
 * /START COMMAND
 * Handles user registration and welcome message
 * Supports referral deep links
 * ============================================================
 */

const userService = require('../services/referral');
const logger = require('../utils/logger');

const ONLYFANS_LINK = process.env.ONLYFANS_LINK || 'https://onlyfan.fun/?u=Lilmissteee';
const TELEGRAM_CHANNEL = process.env.TELEGRAM_CHANNEL || 'Lilmissteee';

/**
 * Main inline keyboard
 */
function getMainKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: '🔥 Subscribe Now',
          url: ONLYFANS_LINK,
        },
      ],
      [
        {
          text: '📢 Telegram Channel',
          url: `https://t.me/${TELEGRAM_CHANNEL.replace('@', '')}`,
        },
      ],
      [
        {
          text: '💎 Premium Access',
          callback_data: 'premium_access',
        },
      ],
      [
        {
          text: '🎁 Referral Program',
          callback_data: 'referral_program',
        },
      ],
      [
        {
          text: 'ℹ️ Help',
          callback_data: 'help',
        },
      ],
    ],
  };
}

/**
 * Premium access keyboard
 */
function getPremiumKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: '🔥 Get Premium Access',
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
}

/**
 * Referral program keyboard
 */
function getReferralKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: '📋 Copy Referral Link',
          callback_data: 'copy_referral',
        },
      ],
      [
        {
          text: '📊 My Stats',
          callback_data: 'my_referral_stats',
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
}

/**
 * Help keyboard
 */
function getHelpKeyboard() {
  return {
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
}

/**
 * Register /start command
 */
function registerStartCommand(bot) {
  // Handle /start with optional referral code
  bot.onText(/^\/start(?:\s+(.+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const user = msg.from;
    const referralCode = match[1] ? match[1].trim() : null;

    try {
      // Save user to database
      const { user: savedUser, isNew } = await userService.saveUser(user, referralCode);

      // Build welcome message
      let welcomeMessage = 'Welcome to Lilmissteee Official ❤️\n\n';
      welcomeMessage += 'Choose an option below to get started.';

      if (isNew && referralCode) {
        welcomeMessage += '\n\n🎉 You joined via a referral link!';
      }

      // Send welcome message with inline keyboard
      await bot.sendMessage(chatId, welcomeMessage, {
        parse_mode: 'HTML',
        reply_markup: getMainKeyboard(),
      });

      logger.info(`Start command handled for user ${user.id}. Referral: ${referralCode || 'none'}`);
    } catch (error) {
      logger.error('Error handling /start command:', error.message);
      await bot.sendMessage(chatId, '❌ Something went wrong. Please try again later.');
    }
  });

  // Handle callback queries for start menu navigation
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const userId = query.from.id;
    const data = query.data;

    try {
      await bot.answerCallbackQuery(query.id);

      switch (data) {
        case 'premium_access': {
          const message =
            '💎 *Premium Access*\n\n' +
            'Unlock exclusive content and premium features!\n\n' +
            '🔥 Click below to subscribe and get instant access.\n\n' +
            '✅ Exclusive photos & videos\n' +
            '✅ Priority support\n' +
            '✅ Behind-the-scenes content';

          await bot.editMessageText(message, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: getPremiumKeyboard(),
          });
          break;
        }

        case 'referral_program': {
          const user = await userService.getUser(userId);
          if (!user) {
            await bot.sendMessage(chatId, '❌ User not found. Please start the bot again with /start');
            return;
          }

          const referralLink = `https://t.me/${process.env.BOT_USERNAME || 'LilmissteeeXbot'}?start=${user.referral_code}`;

          const message =
            '🎁 *Referral Program*\n\n' +
            'Invite your friends and earn rewards!\n\n' +
            `Your Referral Code: \`${user.referral_code}\`\n\n` +
            '🔗 Your Referral Link:\n' +
            `${referralLink}\n\n` +
            `👥 Total Referrals: ${user.total_referrals || 0}\n\n` +
            'Share your link with friends and watch your referrals grow!';

          await bot.editMessageText(message, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: getReferralKeyboard(),
          });
          break;
        }

        case 'help': {
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

          await bot.editMessageText(message, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: getHelpKeyboard(),
          });
          break;
        }

        case 'back_to_menu': {
          const message = 'Welcome to Lilmissteee Official ❤️\n\nChoose an option below to get started.';
          await bot.editMessageText(message, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
            reply_markup: getMainKeyboard(),
          });
          break;
        }

        case 'copy_referral': {
          const user = await userService.getUser(userId);
          if (!user) return;
          const referralLink = `https://t.me/${process.env.BOT_USERNAME || 'LilmissteeeXbot'}?start=${user.referral_code}`;
          await bot.answerCallbackQuery(query.id, {
            text: `Link copied! Share: ${referralLink}`,
            show_alert: true,
          });
          break;
        }

        case 'my_referral_stats': {
          const user = await userService.getUser(userId);
          if (!user) return;
          const referralLink = `https://t.me/${process.env.BOT_USERNAME || 'LilmissteeeXbot'}?start=${user.referral_code}`;
          const message =
            '📊 *My Referral Stats*\n\n' +
            `👥 Total Referrals: ${user.total_referrals || 0}\n` +
            `🔗 Referral Code: \`${user.referral_code}\`\n\n` +
            'Keep sharing your link to earn more rewards!';

          await bot.editMessageText(message, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: getReferralKeyboard(),
          });
          break;
        }
      }
    } catch (error) {
      logger.error('Error handling callback query:', error.message);
    }
  });
}

module.exports = registerStartCommand;
