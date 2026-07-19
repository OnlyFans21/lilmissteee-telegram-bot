/**
 * ============================================================
 * ANALYTICS SERVICE
 * Dedicated analytics tracking and reporting
 * ============================================================
 */

const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

class AnalyticsService {
  /**
   * Track a generic event
   */
  async trackEvent(eventType, telegramId, metadata = {}) {
    try {
      const { error } = await supabase
        .from('analytics')
        .insert({
          event_type: eventType,
          telegram_id: telegramId.toString(),
          metadata,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;
      logger.debug(`Event tracked: ${eventType} for user ${telegramId}`);
    } catch (error) {
      logger.error('Error tracking event:', error.message);
    }
  }

  /**
   * Track new user registration
   */
  async trackNewUser(telegramId) {
    await this.trackEvent('new_user', telegramId);
  }

  /**
   * Track returning user
   */
  async trackReturningUser(telegramId) {
    await this.trackEvent('returning_user', telegramId);
  }

  /**
   * Track button click
   */
  async trackButtonClick(telegramId, buttonName) {
    await this.trackEvent('button_click', telegramId, { button: buttonName });
  }

  /**
   * Track website click
   */
  async trackWebsiteClick(telegramId, url) {
    await this.trackEvent('website_click', telegramId, { url });
  }

  /**
   * Track referral conversion
   */
  async trackReferralConversion(telegramId, referrerId) {
    await this.trackEvent('referral_conversion', telegramId, { referrer_id: referrerId });
  }

  /**
   * Track broadcast
   */
  async trackBroadcast(adminId, stats) {
    await this.trackEvent('broadcast', adminId, stats);
  }

  /**
   * Get analytics summary
   */
  async getSummary(days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('analytics')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const summary = {
        totalEvents: data.length,
        newUsers: data.filter(e => e.event_type === 'new_user').length,
        returningUsers: data.filter(e => e.event_type === 'returning_user').length,
        buttonClicks: data.filter(e => e.event_type === 'button_click').length,
        websiteClicks: data.filter(e => e.event_type === 'website_click').length,
        referralConversions: data.filter(e => e.event_type === 'referral_conversion').length,
      };

      return summary;
    } catch (error) {
      logger.error('Error getting analytics summary:', error.message);
      return {
        totalEvents: 0,
        newUsers: 0,
        returningUsers: 0,
        buttonClicks: 0,
        websiteClicks: 0,
        referralConversions: 0,
      };
    }
  }

  /**
   * Get events by type
   */
  async getEventsByType(eventType, limit = 100) {
    try {
      const { data, error } = await supabase
        .from('analytics')
        .select('*')
        .eq('event_type', eventType)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error getting events by type:', error.message);
      return [];
    }
  }
}

module.exports = new AnalyticsService();
