/**
 * ============================================================
 * HELPER UTILITIES
 * Common helper functions for the bot
 * ============================================================
 */

/**
 * Generate a unique referral code
 * Format: 6-character alphanumeric string
 */
function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
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
 * Escape Markdown special characters
 */
function escapeMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\/g, '\\')
    .replace(/\*/g, '\*')
    .replace(/_/g, '\_')
    .replace(/\[/g, '\[')
    .replace(/\]/g, '\]')
    .replace(/\(/g, '\(')
    .replace(/\)/g, '\)')
    .replace(/~/g, '\~')
    .replace(/`/g, '\`')
    .replace(/>/g, '\>')
    .replace(/#/g, '\#')
    .replace(/\+/g, '\+')
    .replace(/-/g, '\-')
    .replace(/=/g, '\=')
    .replace(/\|/g, '\|')
    .replace(/\{/g, '\{')
    .replace(/\}/g, '\}')
    .replace(/\./g, '\.')
    .replace(/!/g, '\!');
}

/**
 * Format number with commas
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Check if user is an admin
 */
function isAdmin(userId) {
  const adminIds = process.env.ADMIN_TELEGRAM_IDS
    ? process.env.ADMIN_TELEGRAM_IDS.split(',').map(id => id.trim())
    : [];
  return adminIds.includes(userId.toString());
}

/**
 * Sleep utility for rate limiting
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  generateReferralCode,
  formatDate,
  escapeMarkdown,
  formatNumber,
  isAdmin,
  sleep,
};
