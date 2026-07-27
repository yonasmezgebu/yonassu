exports.up = async function (knex) {
  if (!(await knex.schema.hasTable('retail_branches'))) {
    await knex.schema.createTable('retail_branches', (t) => {
      t.increments('id').primary();
      t.string('name', 100).notNullable();
      t.string('code', 50);
      t.text('address');
      t.string('phone', 50);
      t.string('working_hours', 100);
      t.string('manager_name', 100);
      t.boolean('is_active').defaultTo(true);
      t.timestamps(true, true);
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('retail_branches');
};
