/**
 * ============================================================
 * BOT CONFIGURATION
 * Telegram Bot settings and constants
 * ============================================================
 */

const config = {
  // Bot credentials
  token: process.env.TELEGRAM_BOT_TOKEN,
  username: process.env.BOT_USERNAME || 'LilmissteeeXbot',

  // Webhook settings
  webhook: {
    url: process.env.WEBHOOK_URL,
    port: parseInt(process.env.WEBHOOK_PORT) || 3000,
  },

  // Admin settings
  adminIds: process.env.ADMIN_TELEGRAM_IDS
    ? process.env.ADMIN_TELEGRAM_IDS.split(',').map(id => id.trim())
    : [],

  // Referral settings
  referral: {
    enabled: process.env.REFERRAL_REWARD_ENABLED === 'true',
    minimumReferrals: parseInt(process.env.REFERRAL_MINIMUM) || 5,
  },

  // External links
  links: {
    onlyfans: process.env.ONLYFANS_LINK || 'https://onlyfan.fun/?u=Lilmissteee',
    telegramChannel: process.env.TELEGRAM_CHANNEL || '@Lilmissteee',
  },

  // App settings
  app: {
    env: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
  },
};

// Validate required config
if (!config.token) {
  throw new Error('TELEGRAM_BOT_TOKEN is required in environment variables');
}

module.exports = config;
