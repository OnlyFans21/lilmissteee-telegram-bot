/**
 * ============================================================
 * AUTH MIDDLEWARE
 * Handles admin authentication and rate limiting
 * ============================================================
 */

const { isAdmin } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Check if user is admin middleware
 */
function requireAdmin(bot) {
  return async (msg, match, next) => {
    const userId = msg.from.id.toString();

    if (!isAdmin(userId)) {
      await bot.sendMessage(msg.chat.id, '⛔ You are not authorized to use this command.');
      logger.warn(`Unauthorized admin access attempt by ${userId}`);
      return;
    }

    next();
  };
}

/**
 * Rate limiting middleware for commands
 * Prevents spam by limiting command frequency
 */
const rateLimitMap = new Map();

function rateLimit(command, maxRequests = 5, windowMs = 60000) {
  return async (msg, match, next) => {
    const userId = msg.from.id;
    const key = `${userId}:${command}`;
    const now = Date.now();

    if (!rateLimitMap.has(key)) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const record = rateLimitMap.get(key);

    if (now > record.resetTime) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      const remaining = Math.ceil((record.resetTime - now) / 1000);
      await bot.sendMessage(
        msg.chat.id,
        `⏳ Please wait ${remaining} seconds before using this command again.`
      );
      return;
    }

    record.count++;
    next();
  };
}

/**
 * Clean up expired rate limit entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 300000); // Clean up every 5 minutes

module.exports = {
  requireAdmin,
  rateLimit,
};
