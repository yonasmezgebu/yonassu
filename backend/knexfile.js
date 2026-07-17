const { knexConfig } = require('./src/config/database');

module.exports = {
  ...knexConfig,
  migrations: {
    directory: './src/db/migrations',
    extension: 'js'
  },
  seeds: {
    directory: './src/db/seeds'
  }
};
