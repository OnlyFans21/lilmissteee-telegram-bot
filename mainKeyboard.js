/**
 * ============================================================
 * MAIN INLINE KEYBOARD
 * Defines all inline keyboards used by the bot
 * ============================================================
 */

const config = require('../config/bot');

/**
 * Main menu inline keyboard
 */
function getMainKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: '🔥 Subscribe Now',
          url: config.links.onlyfans,
        },
      ],
      [
        {
          text: '📢 Telegram Channel',
          url: `https://t.me/${config.links.telegramChannel.replace('@', '')}`,
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
          url: config.links.onlyfans,
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
function getReferralKeyboard(referralLink) {
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
          url: `https://t.me/${config.links.telegramChannel.replace('@', '')}`,
        },
      ],
      [
        {
          text: '🔥 Subscribe',
          url: config.links.onlyfans,
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
 * Admin keyboard
 */
function getAdminKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: '📊 View Stats',
          callback_data: 'admin_stats',
        },
      ],
      [
        {
          text: '👥 View Users',
          callback_data: 'admin_users',
        },
      ],
      [
        {
          text: '📢 Broadcast',
          callback_data: 'admin_broadcast',
        },
      ],
      [
        {
          text: '📥 Export Data',
          callback_data: 'admin_export',
        },
      ],
    ],
  };
}

/**
 * Confirmation keyboard
 */
function getConfirmKeyboard(action) {
  return {
    inline_keyboard: [
      [
        {
          text: '✅ Confirm',
          callback_data: `confirm_${action}`,
        },
        {
          text: '❌ Cancel',
          callback_data: 'cancel',
        },
      ],
    ],
  };
}

module.exports = {
  getMainKeyboard,
  getPremiumKeyboard,
  getReferralKeyboard,
  getHelpKeyboard,
  getAdminKeyboard,
  getConfirmKeyboard,
};
