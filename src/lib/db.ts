import sql from 'mssql';

const sqlConfig: sql.config = {
  user: process.env.SQL_USERNAME || 'sa',
  password: process.env.SQL_PASSWORD || '',
  server: (process.env.SQL_SERVER_NAME || '').split(',')[0],
  port: parseInt((process.env.SQL_SERVER_NAME || '').split(',')[1] || '1433'),
  options: {
    encrypt: false, // For local dev / non-azure
    trustServerCertificate: true, // true for self-signed certs
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

const pools = new Map<string, sql.ConnectionPool>();

/**
 * Gets a connection pool for a specific database.
 * This reuses the pool if it already exists, preventing memory leaks in Next.js
 */
export async function getDbConnection(dbName: string): Promise<sql.ConnectionPool> {
  if (!pools.has(dbName)) {
    const poolConfig: sql.config = {
      ...sqlConfig,
      database: dbName,
    };
    
    const pool = new sql.ConnectionPool(poolConfig);
    const close = pool.close.bind(pool);
    
    // Auto-remove from map on close
    // @ts-ignore
    pool.close = (...args: any[]) => {
      pools.delete(dbName);
      return (close as any)(...args);
    };
    
    await pool.connect();
    pools.set(dbName, pool);
  }
  
  return pools.get(dbName)!;
}
