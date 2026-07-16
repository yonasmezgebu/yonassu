/**
 * Migration: Replace the old finance_bank_modules tables with a clean,
 * SRS-aligned account management & reconciliation schema.
 *
 * finance_accounts     — Cash / Bank / Mobile Wallet accounts
 * finance_reconciliations  — Reconciliation headers per account per period
 * finance_recon_items  — Individual transaction match rows
 */
exports.up = async function (knex) {
  // Drop old tables if they were created in a previous migration
  await knex.schema.dropTableIfExists('finance_bank_recon_items');
  await knex.schema.dropTableIfExists('finance_bank_reconciliations');
  await knex.schema.dropTableIfExists('finance_bank_accounts');

  await knex.schema.createTable('finance_accounts', (t) => {
    t.increments('id').primary();
    t.string('account_name').notNullable();
    t.string('account_type').notNullable();  // Cash | Bank | Mobile Wallet
    t.string('bank_provider');               // Optional – Bank name or Telebirr etc.
    t.string('account_number');              // Optional
    t.string('branch');                      // Optional – Company branch
    t.string('currency').notNullable().defaultTo('ETB');
    t.decimal('opening_balance', 15, 2).notNullable().defaultTo(0);
    t.date('opening_balance_date').notNullable();
    t.string('status').notNullable().defaultTo('Active'); // Active | Inactive
    t.text('description');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('finance_reconciliations', (t) => {
    t.increments('id').primary();
    t.string('reconciliation_no').notNullable().unique();
    t.integer('account_id').unsigned().references('id').inTable('finance_accounts').onDelete('CASCADE');
    t.date('period_from').notNullable();
    t.date('period_to').notNullable();
    t.decimal('erp_balance', 15, 2).notNullable().defaultTo(0);
    t.decimal('actual_balance', 15, 2).notNullable().defaultTo(0);
    t.decimal('difference', 15, 2).notNullable().defaultTo(0);
    t.string('status').notNullable().defaultTo('Draft'); // Draft | Completed
    t.text('notes');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('finance_recon_items', (t) => {
    t.increments('id').primary();
    t.integer('reconciliation_id').unsigned().references('id').inTable('finance_reconciliations').onDelete('CASCADE');
    t.date('transaction_date');
    t.string('reference_no');
    t.string('transaction_type');  // CRV | PV | PCV
    t.string('description');
    t.decimal('erp_amount', 15, 2).defaultTo(0);
    t.decimal('actual_amount', 15, 2).defaultTo(0);
    t.decimal('difference', 15, 2).defaultTo(0);
    t.string('match_status').defaultTo('Unmatched'); // Matched | Unmatched
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('finance_recon_items');
  await knex.schema.dropTableIfExists('finance_reconciliations');
  await knex.schema.dropTableIfExists('finance_accounts');
};
