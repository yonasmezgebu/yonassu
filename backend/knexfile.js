const { knexConfig } = require('./src/config/database.js');

module.exports = {
  ...knexConfig,
  migrations: {
    directory: './src/db/migrations',
    tableName: 'knex_migrations_log'
  },
  seeds: {
    directory: './src/db/seeds'
  }
};
