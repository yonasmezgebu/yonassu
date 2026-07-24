const { db: knex } = require('./src/config/database'); knex.raw('SHOW COLUMNS FROM rental_orders WHERE Field = "status"').then(res => { console.log(res[0]); process.exit(0); }).catch(console.error);
