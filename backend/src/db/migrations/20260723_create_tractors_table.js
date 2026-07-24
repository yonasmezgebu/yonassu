exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('tractors');
  if (!exists) {
    await knex.schema.createTable('tractors', (t) => {
      t.increments('id').primary();
      t.string('name').notNullable();
      t.decimal('daily_rate', 10, 2).defaultTo(0);
      t.string('tractor_type').defaultTo('Standard');
      t.string('transmission').defaultTo('Manual');
      t.string('fuel_type').defaultTo('Diesel');
      t.text('description');
      t.string('availability').defaultTo('Available');
      t.decimal('asset_value', 15, 2).defaultTo(0);
      t.string('image1');
      t.string('image2');
      t.string('image3');
      t.string('image4');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
      t.timestamp('deleted_at').nullable(); // Null means published, set date means unpublished/deleted
    });
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('tractors');
};
