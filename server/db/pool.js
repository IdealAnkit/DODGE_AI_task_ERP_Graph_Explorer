require('dotenv').config();
const { Pool } = require('pg');
const logger = require('../utils/logger');

let connectionString = process.env.DATABASE_URL || '';

if (connectionString && connectionString.includes('pooler.supabase.com') && !connectionString.includes('pgbouncer=true')) {
  connectionString += (connectionString.includes('?') ? '&' : '?') + 'pgbouncer=true';
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 5, // Keep max low to prevent PgBouncer exhaustion
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  logger.error('Unexpected pg pool error', err);
});

pool.on('connect', () => {
  logger.info('New PostgreSQL client connected');
});

module.exports = pool;
