exports.up = async function (knex) {
  const hasAuditLogs = await knex.schema.hasTable('central_audit_logs');
  if (!hasAuditLogs) {
    await knex.schema.createTable('central_audit_logs', (t) => {
      t.increments('id').primary();
      t.integer('user_id').references('id').inTable('users').onDelete('SET NULL');
      t.string('user_name', 150);
      t.string('role', 100);
      t.string('department', 100);
      t.string('module', 100).notNullable();
      t.string('action', 150).notNullable();
      t.string('record_identifier', 255);
      t.json('previous_value');
      t.json('new_value');
      t.string('ip_address', 50);
      t.datetime('created_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('central_audit_logs');
};
