const knex = require('knex');
const config = require('./src/config/env');
const db = knex({
  client: 'mysql2',
  connection: {
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database
  }
});

db.raw('SHOW COLUMNS FROM car_renting_maintenance').then(res => {
  console.log(res[0]);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
