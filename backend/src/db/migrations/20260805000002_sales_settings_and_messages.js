exports.up = async function(knex) {
  await knex.schema.createTable('sales_settings', table => {
    table.increments('id').primary();
    table.string('contact_phone1').nullable();
    table.string('contact_phone2').nullable();
    table.string('contact_email').nullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('sales_messages', table => {
    table.increments('id').primary();
    table.string('sender_name').notNullable();
    table.string('sender_email').notNullable();
    table.string('sender_phone').nullable();
    table.text('message').notNullable();
    table.boolean('is_read').defaultTo(false);
    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('sales_messages');
  await knex.schema.dropTableIfExists('sales_settings');
};
