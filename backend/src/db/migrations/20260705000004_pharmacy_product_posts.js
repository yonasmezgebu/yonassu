exports.up = async function (knex) {
  if (!(await knex.schema.hasTable('pharmacy_product_posts'))) {
    await knex.schema.createTable('pharmacy_product_posts', (t) => {
      t.increments('id').primary();
      t.string('title', 255).notNullable();
      t.text('description').nullable();
      t.integer('product_id').unsigned().nullable();
      t.string('image_url', 500).nullable();
      t.integer('posted_by').unsigned().nullable();
      t.boolean('is_active').defaultTo(true);
      t.timestamps(true, true);
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('pharmacy_product_posts');
};
