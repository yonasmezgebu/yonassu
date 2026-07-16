exports.up = function(knex) {
  return knex.schema.alterTable('pharmacy_audit_trail', table => {
    table.integer('worker_id').unsigned().nullable().alter();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('pharmacy_audit_trail', table => {
    table.integer('worker_id').unsigned().notNullable().alter();
  });
};
