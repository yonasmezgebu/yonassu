exports.up = function(knex) {
  return knex.schema.alterTable('pos_sales', table => {
    table.boolean('is_submitted').defaultTo(false);
  })
  .then(() => {
    return knex.schema.hasTable('pos_audit_trail').then(exists => {
      if (!exists) {
        return knex.schema.createTable('pos_audit_trail', table => {
          table.increments('id').primary();
          table.integer('cashier_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
          table.string('action');
          table.string('recipient');
          table.decimal('amount', 14, 2);
          table.timestamp('created_at').defaultTo(knex.fn.now());
        });
      }
    });
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('pos_audit_trail')
    .then(() => {
      return knex.schema.alterTable('pos_sales', table => {
        table.dropColumn('is_submitted');
      });
    });
};
