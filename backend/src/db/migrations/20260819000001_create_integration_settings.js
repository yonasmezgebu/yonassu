exports.up = function(knex) {
  return knex.schema
    .createTable('integration_settings', t => {
      t.increments('id').primary();
      t.string('integration_key', 50).notNullable().unique();
      t.text('config').nullable();
      t.string('status', 20).notNullable().defaultTo('disconnected'); // connected | disconnected | error
      t.boolean('enabled').notNullable().defaultTo(false);
      t.timestamp('last_sync_at').nullable();
      t.timestamp('connected_at').nullable();
      t.string('updated_by', 255).nullable();
      t.timestamps(true, true);
    })
    .createTable('integration_sync_logs', t => {
      t.increments('id').primary();
      t.string('integration_key', 50).notNullable();
      t.string('action', 100).nullable();
      t.string('status', 20).notNullable().defaultTo('SUCCESS'); // SUCCESS | FAILED | PENDING
      t.text('detail').nullable();
      t.timestamp('timestamp').defaultTo(knex.fn.now());
      t.index('integration_key');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('integration_sync_logs')
    .dropTableIfExists('integration_settings');
};