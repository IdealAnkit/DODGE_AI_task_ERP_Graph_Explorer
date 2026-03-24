require('dotenv').config();
const { Pool } = require('pg');
const logger = require('../utils/logger');

const connectionString = process.env.DATABASE_URL || '';
const isSupabase = connectionString.includes('supabase.co');

const pool = new Pool({
  connectionString,
  ssl: isSupabase ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  logger.error('Unexpected pg pool error', err);
});

pool.on('connect', () => {
  logger.info('New PostgreSQL client connected');
});

module.exports = pool;
