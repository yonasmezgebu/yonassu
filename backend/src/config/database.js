const knex = require('knex');
const config = require('./env');

// MySQL's DATETIME/TIMESTAMP were pinned to a fixed +03:00 offset, and every
// converted column is a timezone-naive `timestamp`.  Reproducing that exact
// behaviour on PostgreSQL means fixing the session time zone rather than
// converting the columns, so local wall-clock values keep round-tripping
// unchanged.
const DB_TIMEZONE = process.env.DB_TIMEZONE || 'Africa/Addis_Ababa';

// Monkey-patch whereDate, which the builder has no native equivalent for.
knex.QueryBuilder.extend('whereDate', function(column, operator, value) {
  if (value === undefined) {
    value = operator;
    operator = '=';
  }
  return this.whereRaw(`(??)::date ${operator} (?)::date`, [column, value]);
});
const knexConfig = {
  client: 'pg',
  connection: {
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
  },
  pool: {
    min: config.database.pool.min,
    max: config.database.pool.max,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 60000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
    afterCreate(conn, done) {
      // Applied per physical connection, so it survives pool recycling and
      // reconnects. `done(err, conn)` must always be called exactly once.
      conn.query(`SET TIME ZONE '${DB_TIMEZONE}'`, (err) => done(err, conn));
    }
  },
  acquireConnectionTimeout: 30000,
  debug: config.logging.logSqlQueries || false,
  log: {
    warn(message) {
      if (config.logging.logSqlQueries) {
        console.warn(`[DB WARN] ${message}`);
      }
    },
    error(message) {
      console.error(`[DB ERROR] ${message}`);
    },
    deprecate(message) {
      if (config.logging.logSqlQueries && config.development.debug) {
        console.log(`[DB DEPRECATE] ${message}`);
      }
    },
    debug(message) {
      if (config.logging.logSqlQueries && config.development.debug) {
        console.log(`[DB DEBUG] ${message}`);
      }
    }
  }
};
const db = knex(knexConfig);
const testConnection = async () => {
  try {
    const startTime = Date.now();
    // node-postgres returns { rows }, where MySQL2 returned [rows, fields].
    const result = await db.raw('SELECT 1 + 1 AS result');
    const duration = Date.now() - startTime;
    if (result.rows[0].result === 2) {
      console.log('✅ Database connected successfully');
      console.log(`   Host: ${config.database.host}:${config.database.port}`);
      console.log(`   Database: ${config.database.database}`);
      console.log(`   Time zone: ${DB_TIMEZONE}`);
      console.log(`   Connection time: ${duration}ms`);
      if (config.isDevelopment && config.development.debug) {
        console.log(`   Pool: Min=${config.database.pool.min}, Max=${config.database.pool.max}`);
      }
      return true;
    }
    throw new Error('Database query failed');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (config.isProduction) {
      console.error('Production database connection failed. Exiting...');
      process.exit(1);
    }
    return false;
  }
};
const closeConnection = async () => {
  try {
    await db.destroy();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error.message);
  }
};
const transaction = async (callback) => {
  const trx = await db.transaction();
  try {
    const result = await callback(trx);
    await trx.commit();
    return result;
  } catch (error) {
    await trx.rollback();
    throw error;
  }
};
if (config.logging.logSqlQueries) {
  let queryCount = 0;
  db.on('query', (query) => {
    query.__startTime = Date.now();
    query.__id = ++queryCount;
    if (config.development.debug) {
      console.log(`\n[SQL #${query.__id}] ${query.sql}`);
      if (query.bindings && query.bindings.length) {
        console.log(`[SQL Bindings #${query.__id}]`, query.bindings);
      }
    }
  });
  db.on('query-response', (response, query) => {
    if (query.__startTime) {
      const duration = Date.now() - query.__startTime;
      if (duration > 500) {
        console.warn(`[SQL Slow Query #${query.__id}] ${duration}ms - ${query.sql}`);
      } else if (config.development.debug && duration > 100) {
        console.log(`[SQL Query #${query.__id}] Completed in ${duration}ms`);
      }
    }
  });
  db.on('query-error', (error, query) => {
    console.error(`[SQL Error #${query.__id}] ${error.message}`);
    console.error(`[SQL #${query.__id}] ${query.sql}`);
    if (query.bindings && query.bindings.length) {
      console.error(`[SQL Bindings #${query.__id}]`, query.bindings);
    }
  });
}
module.exports = {
  db,
  testConnection,
  closeConnection,
  transaction,
  knexConfig
};
