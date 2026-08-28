exports.up = async function (knex) {
  if (!(await knex.schema.hasTable('pharmacy_targets'))) {
    await knex.schema.createTable('pharmacy_targets', (t) => {
      t.increments('id').unsigned();
      t.integer('branch_id').unsigned().nullable();
      t.decimal('sales_target', 15, 2).defaultTo(0);
      t.string('period', 20).defaultTo('ALL');
      t.timestamps(true, true);
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('pharmacy_targets');
};
