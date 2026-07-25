const knex = require('knex')({
  client: 'mysql2',
  connection: { host: '127.0.0.1', port: 3306, user: 'root', password: 'root', database: 'sutana_ems' }
});

async function migrate() {
  const hasCol = (col) => knex.schema.hasColumn('car_renting_maintenance', col);

  if (!(await hasCol('priority')))          await knex.schema.table('car_renting_maintenance', t => t.string('priority').defaultTo('Normal'));
  if (!(await hasCol('mechanic_name')))     await knex.schema.table('car_renting_maintenance', t => t.string('mechanic_name').nullable());
  if (!(await hasCol('mechanic_phone')))    await knex.schema.table('car_renting_maintenance', t => t.string('mechanic_phone').nullable());
  if (!(await hasCol('reported_by')))       await knex.schema.table('car_renting_maintenance', t => t.string('reported_by').nullable());
  if (!(await hasCol('images')))            await knex.schema.table('car_renting_maintenance', t => t.text('images').nullable()); // JSON array of base64 or URLs
  if (!(await hasCol('notes')))             await knex.schema.table('car_renting_maintenance', t => t.text('notes').nullable());
  if (!(await hasCol('location')))          await knex.schema.table('car_renting_maintenance', t => t.string('location').nullable());

  console.log('Migration done');
  knex.destroy();
}
migrate().catch(e => { console.error(e); knex.destroy(); });
