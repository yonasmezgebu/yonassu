exports.up = function(knex) {
  return knex.schema.createTable('employee_reports', t => {
    t.increments('id').primary();
    t.integer('employee_id').unsigned();
    t.string('employee_name');
    t.string('department');
    t.text('report_text');
    t.string('document_url');
    t.string('document_name');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('employee_reports');
};
