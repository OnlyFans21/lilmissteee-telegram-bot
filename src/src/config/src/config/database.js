/**
 * ============================================================
 * DATABASE CONFIGURATION
 * Supabase client initialization and connection management
 * ============================================================
 */

const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.error('❌ SUPABASE_URL or SUPABASE_SERVICE_KEY is missing in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

/**
 * Test database connection
 */
async function testConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    logger.info('✅ Supabase database connection established successfully');
    return true;
  } catch (err) {
    logger.error('❌ Failed to connect to Supabase:', err.message);
    return false;
  }
}

module.exports = { supabase, testConnection };
