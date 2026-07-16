/**
 * Migration: Create finance_payables table
 * Used by "Approve Funds & Pay" → auto-records to Payables Book
 */
exports.up = function(knex) {
  return knex.schema.createTable('finance_payables', table => {
    table.increments('id').primary();
    table.string('pv_number').unique().notNullable();   // e.g. PAY-000123
    table.date('date').notNullable();
    table.string('paid_to').notNullable();              // Supplier / person / vendor
    table.string('category').notNullable();             // Supplier, Staff, Utilities, etc.
    table.decimal('total_amount', 14, 2).notNullable();
    table.decimal('amount_paid', 14, 2).defaultTo(0);
    table.decimal('outstanding_balance', 14, 2).defaultTo(0);
    table.string('payment_method').notNullable().defaultTo('Cash'); // Cash | Bank | Telebirr
    table.string('description').nullable();
    table.string('reference_no').nullable();
    table.string('status').defaultTo('Paid');           // Paid | Partial | Unpaid | Overdue
    table.date('due_date').nullable();

    // Bank details (stored as JSON string)
    table.text('bank_details').nullable();
    // Telebirr details (stored as JSON string)
    table.text('telebirr_details').nullable();

    // Signatures (base64 data URLs)
    table.text('prepared_by').nullable();
    table.text('checked_by').nullable();
    table.text('payee_name').nullable();
    table.text('prepared_signature').nullable();
    table.text('checked_signature').nullable();
    table.text('payee_signature').nullable();

    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('finance_payables');
};
