exports.up = async (knex) => {
  const exists = await knex.schema.hasTable('printing_order_works');
  if (exists) return;
  await knex.schema.createTable('printing_order_works', (t) => {
    t.increments('id').primary();
    t.specificType('order_id', 'INT(11)').notNullable();
    t.string('filename', 255).notNullable();
    t.string('original_name', 255).notNullable();
    t.integer('size').unsigned().notNullable().defaultTo(0);
    t.string('mime_type', 120).nullable();
    t.string('file_path', 500).nullable();
    t.string('file_url', 500).nullable();
    t.integer('uploaded_by').unsigned().nullable();
    t.timestamp('uploaded_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').nullable();
    t.foreign('order_id').references('id').inTable('printing_orders').onDelete('CASCADE');
    t.index('order_id');
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('printing_order_works');
};