exports.up = async function (knex) {
  if (!(await knex.schema.hasTable('pharmacy_health_posts'))) {
    await knex.schema.createTable('pharmacy_health_posts', (t) => {
      t.increments('id').primary();
      t.string('title', 255).notNullable();
      t.string('subtitle', 500).nullable();
      t.text('content').nullable();
      t.string('source_url', 500).nullable();
      t.integer('category_id').unsigned().nullable();
      t.string('category_name', 255).nullable();
      t.integer('product_id').unsigned().nullable();
      t.string('product_name', 255).nullable();
      t.decimal('price', 12, 2).nullable();
      t.string('price_unit', 50).nullable();
      t.string('manufacturer', 255).nullable();
      t.string('drug_image', 500).nullable();
      t.string('cover_image', 500).nullable();
      t.integer('stock_quantity').nullable();
      t.integer('reorder_level').nullable();
      t.boolean('is_prescription_required').defaultTo(false);
      t.string('status', 20).defaultTo('draft');
      t.string('meta_title', 255).nullable();
      t.text('meta_description').nullable();
      t.integer('posted_by').unsigned().nullable();
      t.timestamps(true, true);
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('pharmacy_health_posts');
};