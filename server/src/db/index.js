const { Pool } = require('pg');

// SSL handling:
//  - Local Postgres: no SSL.
//  - Most managed Postgres (Railway public URL, Supabase, Neon, Heroku): SSL on.
//  - DATABASE_SSL env var is an explicit override ('true' / 'false') in case the
//    default guess is wrong (e.g. Railway's private network doesn't use SSL).
function sslConfig() {
  if (process.env.DATABASE_SSL === 'true')  return { rejectUnauthorized: false };
  if (process.env.DATABASE_SSL === 'false') return false;
  return process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig(),
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

/**
 * Run a set of statements inside a single ACID transaction.
 *
 * A dedicated client is checked out of the pool so that every statement
 * runs on the SAME database session (BEGIN/COMMIT must share one connection).
 * If the callback throws, every change made since BEGIN is rolled back, so the
 * database can never be left in a half-written state.
 *
 *   await withTransaction(async (client) => {
 *     await client.query('INSERT ...');
 *     await client.query('UPDATE ...');
 *   });
 */
async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  withTransaction,
  pool,
};
