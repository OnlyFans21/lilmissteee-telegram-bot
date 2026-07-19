/**
 * ============================================================
 * USER SERVICE
 * Handles all user-related database operations
 * ============================================================
 */

const { supabase } = require('../config/database');
const { generateReferralCode } = require('../utils/helpers');
const logger = require('../utils/logger');

class UserService {
  /**
   * Save or update user in database
   * @param {Object} userData - Telegram user data
   * @param {string} referralCode - Optional referral code from deep link
   */
  async saveUser(userData, referralCode = null) {
    try {
      const telegramId = userData.id.toString();
      const username = userData.username || null;
      const firstName = userData.first_name || '';
      const lastName = userData.last_name || '';
      const language = userData.language_code || 'en';

      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingUser) {
        // Update existing user (returning user)
        const { error: updateError } = await supabase
          .from('users')
          .update({
            username,
            first_name: firstName,
            last_name: lastName,
            language,
            last_active: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('telegram_id', telegramId);

        if (updateError) throw updateError;

        // Track returning user
        await this.trackAnalytics('returning_user', telegramId);

        logger.info(`Returning user: ${telegramId} (${username || firstName})`);
        return { user: existingUser, isNew: false };
      }

      // Generate unique referral code for new user
      const userReferralCode = generateReferralCode();

      // Check if referred by someone
      let referredBy = null;
      if (referralCode) {
        const { data: referrer, error: refError } = await supabase
          .from('users')
          .select('telegram_id')
          .eq('referral_code', referralCode)
          .single();

        if (!refError && referrer) {
          referredBy = referrer.telegram_id;
          // Increment referrer's count
          await this.incrementReferralCount(referredBy);
          // Track referral conversion
          await this.trackAnalytics('referral_conversion', telegramId, { referrer_id: referredBy });
        }
      }

      // Insert new user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          telegram_id: telegramId,
          username,
          first_name: firstName,
          last_name: lastName,
          language,
          joined_date: new Date().toISOString(),
          referral_code: userReferralCode,
          referred_by: referredBy,
          total_referrals: 0,
          last_active: new Date().toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Track new user
      await this.trackAnalytics('new_user', telegramId);
      await this.trackDailyJoin();

      logger.info(`New user registered: ${telegramId} (${username || firstName})`);
      return { user: newUser, isNew: true };
    } catch (error) {
      logger.error('Error saving user:', error.message);
      throw error;
    }
  }

  /**
   * Get user by telegram ID
   */
  async getUser(telegramId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramId.toString())
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error getting user:', error.message);
      return null;
    }
  }

  /**
   * Get user by referral code
   */
  async getUserByReferralCode(code) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('referral_code', code)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error getting user by referral code:', error.message);
      return null;
    }
  }

  /**
   * Increment referral count for a user
   */
  async incrementReferralCount(telegramId) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('total_referrals')
        .eq('telegram_id', telegramId)
        .single();

      const newCount = (user?.total_referrals || 0) + 1;

      const { error } = await supabase
        .from('users')
        .update({ total_referrals: newCount })
        .eq('telegram_id', telegramId);

      if (error) throw error;
      logger.info(`Referral count incremented for ${telegramId}: ${newCount}`);
    } catch (error) {
      logger.error('Error incrementing referral count:', error.message);
    }
  }

  /**
   * Get all users for broadcast
   */
  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('telegram_id, is_active')
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error getting all users:', error.message);
      return [];
    }
  }

  /**
   * Get user statistics
   */
  async getStats() {
    try {
      // Total users
      const { count: totalUsers, error: totalError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // New users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayUsers, error: todayError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('joined_date', today.toISOString());

      if (todayError) throw todayError;

      // Active users (active in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count: activeUsers, error: activeError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_active', sevenDaysAgo.toISOString());

      if (activeError) throw activeError;

      // Total referrals
      const { data: referrals, error: refError } = await supabase
        .from('users')
        .select('total_referrals');

      if (refError) throw refError;
      const totalReferrals = referrals.reduce((sum, u) => sum + (u.total_referrals || 0), 0);

      // Daily joins for last 7 days
      const { data: dailyJoins, error: dailyError } = await supabase
        .from('daily_joins')
        .select('*')
        .order('date', { ascending: false })
        .limit(7);

      if (dailyError) throw dailyError;

      return {
        totalUsers: totalUsers || 0,
        todayUsers: todayUsers || 0,
        activeUsers: activeUsers || 0,
        totalReferrals,
        dailyJoins: dailyJoins || [],
      };
    } catch (error) {
      logger.error('Error getting stats:', error.message);
      return {
        totalUsers: 0,
        todayUsers: 0,
        activeUsers: 0,
        totalReferrals: 0,
        dailyJoins: [],
      };
    }
  }

  /**
   * Track analytics event
   */
  async trackAnalytics(eventType, telegramId, metadata = {}) {
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
    } catch (error) {
      logger.error('Error tracking analytics:', error.message);
    }
  }

  /**
   * Track daily join
   */
  async trackDailyJoin() {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if entry exists for today
      const { data: existing, error: checkError } = await supabase
        .from('daily_joins')
        .select('id, count')
        .eq('date', today)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('daily_joins')
          .update({ count: existing.count + 1 })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new entry
        const { error } = await supabase
          .from('daily_joins')
          .insert({ date: today, count: 1 });

        if (error) throw error;
      }
    } catch (error) {
      logger.error('Error tracking daily join:', error.message);
    }
  }

  /**
   * Track button click
   */
  async trackButtonClick(telegramId, buttonName) {
    await this.trackAnalytics('button_click', telegramId, { button: buttonName });
  }

  /**
   * Track website click
   */
  async trackWebsiteClick(telegramId, url) {
    await this.trackAnalytics('website_click', telegramId, { url });
  }

  /**
   * Export all users data
   */
  async exportUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('joined_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error exporting users:', error.message);
      return [];
    }
  }

  /**
   * Get top referrers
   */
  async getTopReferrers(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('telegram_id, username, first_name, total_referrals')
        .gt('total_referrals', 0)
        .order('total_referrals', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error getting top referrers:', error.message);
      return [];
    }
  }
}

module.exports = new UserService();
