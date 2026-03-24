require('dotenv').config();
const { Pool } = require('pg');
const logger = require('../utils/logger');

let connectionString = process.env.DATABASE_URL || '';
const isSupabase = connectionString.includes('supabase');

if (isSupabase && connectionString.includes('6543') && !connectionString.includes('pgbouncer=true')) {
  connectionString += (connectionString.includes('?') ? '&' : '?') + 'pgbouncer=true';
}

const pool = new Pool({
  connectionString,
  ssl: isSupabase ? { rejectUnauthorized: false } : false,
  idleTimeoutMillis: 30000, // Keep connections alive a bit longer to prevent rapid connection blocks
  connectionTimeoutMillis: 30000, // 30s timeout
});

pool.on('error', (err) => {
  logger.error('Unexpected pg pool error', err);
});

pool.on('connect', () => {
  logger.info('New PostgreSQL client connected');
});

module.exports = pool;
