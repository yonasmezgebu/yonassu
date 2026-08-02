exports.up = function(knex) {
  return knex.schema.createTable('journal_entries', (table) => {
    table.increments('id').primary();
    table.date('entry_date').notNullable();
    table.integer('account_id').unsigned().notNullable().references('id').inTable('chart_of_accounts').onDelete('RESTRICT');
    table.decimal('debit', 15, 2).defaultTo(0);
    table.decimal('credit', 15, 2).defaultTo(0);
    table.string('reference_module', 50); // e.g., 'sales', 'supplier_bills', 'loans'
    table.integer('reference_id').unsigned(); // ID in the respective module
    table.text('description');
    table.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('journal_entries');
};
