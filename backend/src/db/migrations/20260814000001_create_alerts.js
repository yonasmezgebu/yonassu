exports.up = function (knex) {
  return knex.schema.createTable('alerts', (t) => {
    t.string('id', 36).primary();
    t.enu('type', ['CRITICAL', 'WARNING', 'INFO']).notNullable();
    t.string('module', 50).notNullable();
    t.string('title', 200).notNullable();
    t.text('message').notNullable();
    t.integer('priority').notNullable().defaultTo(5);
    t.integer('target_user_id').unsigned().nullable();
    t.string('target_role', 100).nullable();
    t.enu('status', ['UNREAD', 'READ', 'RESOLVED']).notNullable().defaultTo('UNREAD');
    t.string('related_record_id', 100).nullable();
    t.string('related_module', 50).nullable();
    t.string('fingerprint', 200).nullable().unique();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('alerts');
};
