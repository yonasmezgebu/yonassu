const { knexConfig } = require('./src/config/database.js');

module.exports = {
  ...knexConfig,
  migrations: {
    directory: './src/db/migrations'
  },
  seeds: {
    directory: './src/db/seeds'
  }
};
