exports.up = function(knex) {
  return knex.schema.createTable('danger_zone_requests', t => {
    t.increments('id').primary();
    t.string('action', 50).notNullable().defaultTo('RESET_ALL_DATA');
    t.integer('requested_by').notNullable();
    t.string('requested_by_name', 255).nullable();
    t.text('reason').notNullable();
    t.string('confirm_text', 50).notNullable();
    t.string('status', 20).notNullable().defaultTo('PENDING'); // PENDING | APPROVED | REJECTED | COMPLETED | FAILED
    t.integer('approved_by').nullable();
    t.string('approved_by_name', 255).nullable();
    t.timestamp('approved_at').nullable();
    t.timestamp('executed_at').nullable();
    t.json('completion_summary').nullable();
    t.string('rejected_reason', 255).nullable();
    t.timestamps(true, true);
    t.index('status');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('danger_zone_requests');
};