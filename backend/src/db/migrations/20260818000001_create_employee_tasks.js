exports.up = function(knex) {
  return knex.schema.createTable('employee_tasks', t => {
    t.increments('id').primary();
    t.string('title').notNullable();
    t.text('description');
    t.integer('assigned_to_user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    t.string('assigned_to_name');
    t.string('assigned_by_name');
    t.integer('assigned_by_user_id').unsigned().references('id').inTable('users');
    t.string('department'); 
    t.enu('priority', ['low', 'medium', 'high']).defaultTo('medium');
    t.enu('status', ['pending', 'in_progress', 'completed', 'cancelled']).defaultTo('pending');
    t.date('due_date');
    t.integer('progress_pct').defaultTo(0);
    t.text('notes');
    t.timestamp('started_at');
    t.timestamp('completed_at');
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('employee_tasks');
};
