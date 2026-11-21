import { Pool } from 'pg';

let pool;

if (!globalThis.pgPool) {
  if (process.env.DATABASE_URL) {
    globalThis.pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 5000,
    });
  } else {
    globalThis.pgPool = new Pool({
      connectionTimeoutMillis: 5000,
    });
  }
}

pool = globalThis.pgPool;

// jalankan kumpulan query dalam satu transaksi database spy aman kalau ada error
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default pool;