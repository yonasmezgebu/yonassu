exports.up = function(knex) {
  return knex.schema.createTable('procurement_messages', table => {
    table.increments('id').primary();
    table.string('sender_name').notNullable();
    table.string('sender_email').notNullable();
    table.string('sender_phone').nullable();
    table.text('message').notNullable();
    table.boolean('is_read').defaultTo(false);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('procurement_messages');
};
