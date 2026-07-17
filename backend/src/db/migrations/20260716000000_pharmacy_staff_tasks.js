exports.up = async function(knex) {
  if (!(await knex.schema.hasTable('pharmacy_tasks'))) {
    await knex.schema.createTable('pharmacy_tasks', (t) => {
      t.increments('id').primary();
      t.integer('assigned_to').references('id').inTable('users').onDelete('CASCADE');
      t.integer('branch_id').unsigned().references('id').inTable('branches').onDelete('SET NULL');
      t.string('task_type', 100).notNullable();
      t.string('priority', 20).defaultTo('Medium');
      t.dateTime('deadline');
      t.string('status', 50).defaultTo('Pending');
      t.text('instructions');
      t.integer('created_by').references('id').inTable('users').onDelete('SET NULL');
      t.timestamps(true, true);
    });
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('pharmacy_tasks');
};
