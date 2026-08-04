exports.up = function(knex) {
  return knex.schema.createTable('suppliers', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable(); // Reference to users.id
    table.string('full_name').notNullable();
    table.string('email').notNullable();
    table.string('phone').notNullable();
    table.string('company_name').nullable();
    table.string('category').notNullable();
    table.text('business_address').notNullable();
    table.text('description').nullable();
    table.string('status').defaultTo('Active');
    table.timestamps(true, true);
    table.index('user_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('suppliers');
};
