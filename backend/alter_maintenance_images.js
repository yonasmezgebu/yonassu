const knex = require('knex')({
  client: 'mysql2',
  connection: { host: '127.0.0.1', port: 3306, user: 'root', password: 'root', database: 'sutana_ems' }
});

async function migrate() {
  await knex.raw('ALTER TABLE car_renting_maintenance MODIFY images LONGTEXT;');
  console.log('Altered images to LONGTEXT');
  knex.destroy();
}
migrate().catch(e => { console.error(e); knex.destroy(); });
