// FILE: lib/db/index.js
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.js';

let pool;
let db;

/**
 * Initialize and return database connection pool
 * Uses singleton pattern to prevent multiple pool instances
 */
async function getConnection() {
  if (!pool) {
    try {
      pool = mysql.createPool({
        host: process.env.DB_HOST || '68.178.163.247',
        user: process.env.DB_USER || 'devuser_healway',
        password: process.env.DB_PASSWORD || 'devuser_healway',
        database: process.env.DB_NAME || 'devuser_healway',
        port: parseInt(process.env.DB_PORT || '3306'),
        timezone: '+00:00', // UTC timezone
        dateStrings: true, // Return dates as strings
        waitForConnections: true,
        connectionLimit: 10, // Max 10 concurrent connections
        queueLimit: 0, // No limit on queued connection requests
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      });

      // Test connection
      const connection = await pool.getConnection();
      console.log('✅ Database pool initialized and tested successfully');
      connection.release();
    } catch (error) {
      console.error('❌ Database pool initialization failed:', error);
      throw error;
    }
  }
  return pool;
}

/**
 * Get Drizzle ORM instance
 * Returns cached instance if already initialized
 */
async function getDb() {
  if (!db) {
    const conn = await getConnection();
    db = drizzle(conn, { schema, mode: 'default' });
    console.log('✅ Drizzle ORM initialized');
  }
  return db;
}

/**
 * Close database pool (for graceful shutdown)
 */
async function closeConnection() {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
    console.log('🔌 Database pool closed');
  }
}

/**
 * Execute raw SQL query (for complex queries)
 */
async function executeRaw(sql, params = []) {
  const conn = await getConnection();
  const [rows] = await conn.execute(sql, params);
  return rows;
}

export { getDb, getConnection, closeConnection, executeRaw };
export default getDb;