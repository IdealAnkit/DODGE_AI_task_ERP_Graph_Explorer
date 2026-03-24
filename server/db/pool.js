require('dotenv').config();
const { Pool } = require('pg');
const logger = require('../utils/logger');

const connectionString = process.env.DATABASE_URL || '';
const isSupabase = connectionString.includes('supabase');

const pool = new Pool({
  connectionString,
  ssl: isSupabase ? { rejectUnauthorized: false } : false,
  idleTimeoutMillis: 1000, // Instantly close idle connections so they don't go stale
  connectionTimeoutMillis: 15000, // Fast fail on frozen networks
});

pool.on('error', (err) => {
  logger.error('Unexpected pg pool error', err);
});

pool.on('connect', () => {
  logger.info('New PostgreSQL client connected');
});

module.exports = pool;
