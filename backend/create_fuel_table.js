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

async function run() {
  try {
    const exists = await db.schema.hasTable('car_renting_fuel_service');
    if (!exists) {
      await db.schema.createTable('car_renting_fuel_service', table => {
        table.increments('id').primary();
        table.string('asset_id').notNullable();
        table.string('asset_type').notNullable();
        table.string('asset_name').notNullable();
        table.string('request_type').notNullable();
        table.text('description').notNullable();
        table.integer('estimated_cost_cents').notNullable();
        table.string('requested_date').notNullable();
        table.enum('status', ['PENDING_CEO', 'PENDING_FINANCE', 'FINANCE_READY', 'PAYMENT_RELEASED', 'COMPLETED', 'REJECTED']).defaultTo('PENDING_CEO');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
        table.string('priority').defaultTo('Normal');
        table.string('driver_name');
        table.string('reported_by');
        table.integer('current_mileage');
        table.string('location');
        table.text('notes');
      });
      console.log('Table car_renting_fuel_service created');
    } else {
      console.log('Table already exists');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
