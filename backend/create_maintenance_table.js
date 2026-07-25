const knex = require('knex')({
  client: 'mysql2',
  connection: { host: '127.0.0.1', port: 3306, user: 'root', password: 'root', database: 'sutana_ems' }
});

async function migrate() {
  const exists = await knex.schema.hasTable('car_renting_maintenance');
  if (!exists) {
    await knex.schema.createTable('car_renting_maintenance', table => {
      table.increments('id').primary();
      table.string('asset_id').notNullable(); 
      table.string('asset_type').notNullable(); 
      table.string('asset_name').notNullable(); 
      table.string('type').notNullable(); 
      table.text('description').notNullable();
      table.integer('estimated_cost_cents').notNullable();
      table.string('scheduled_date').notNullable();
      table.string('status').notNullable().defaultTo('PENDING_FINANCE'); 
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
    console.log('Table created');
  } else {
    console.log('Table already exists');
  }
  knex.destroy();
}
migrate().catch(console.error);
