exports.up = function(knex) {
  return knex.schema
    .createTable('finance_bank_accounts', table => {
      table.increments('id').primary();
      table.string('bank_name').notNullable();
      table.string('account_name').notNullable();
      table.string('account_number').notNullable();
      table.string('branch');
      table.string('currency').notNullable();
      table.decimal('opening_balance', 15, 2).notNullable();
      table.date('opening_balance_date').notNullable();
      table.text('description');
      table.string('status').defaultTo('Active');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('finance_bank_reconciliations', table => {
      table.increments('id').primary();
      table.string('reconciliation_no').notNullable().unique();
      table.integer('bank_account_id').unsigned().references('id').inTable('finance_bank_accounts');
      table.date('statement_date').notNullable();
      table.decimal('statement_balance', 15, 2).notNullable();
      table.decimal('book_balance', 15, 2).notNullable();
      table.decimal('difference', 15, 2).notNullable();
      table.string('status').notNullable(); // Draft, Completed
      table.text('notes');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('finance_bank_recon_items', table => {
      table.increments('id').primary();
      table.integer('reconciliation_id').unsigned().references('id').inTable('finance_bank_reconciliations').onDelete('CASCADE');
      table.date('transaction_date');
      table.string('reference_no');
      table.string('description');
      table.decimal('erp_amount', 15, 2).defaultTo(0);
      table.decimal('bank_amount', 15, 2).defaultTo(0);
      table.decimal('difference', 15, 2).defaultTo(0);
      table.string('status'); // Matched, Unmatched
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('finance_bank_recon_items')
    .dropTableIfExists('finance_bank_reconciliations')
    .dropTableIfExists('finance_bank_accounts');
};
