exports.up = async function (knex) {
  if (!(await knex.schema.hasTable('retail_branch_products'))) {
    await knex.schema.createTable('retail_branch_products', (t) => {
      t.increments('id').primary();
      t.integer('branch_id').unsigned().notNullable().references('id').inTable('retail_branches').onDelete('CASCADE');
      t.integer('product_id').unsigned().notNullable().references('id').inTable('retail_products').onDelete('CASCADE');
      t.integer('quantity').defaultTo(0);
      t.timestamps(true, true);
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('retail_branch_products');
};
