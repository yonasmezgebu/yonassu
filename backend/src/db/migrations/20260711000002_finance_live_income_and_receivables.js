/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('finance_income_submissions', table => {
      table.increments('id').primary();
      table.string('department').notNullable();
      table.string('submitted_by').notNullable();
      table.decimal('amount', 14, 2).notNullable();
      table.string('currency').defaultTo('ETB');
      table.string('reference_no').nullable();
      table.string('description').nullable();
      table.string('status').defaultTo('Pending'); // Pending, Approved, Rejected
      table.timestamps(true, true);
    })
    .createTable('finance_receivables', table => {
      table.increments('id').primary();
      table.string('customer_name').notNullable(); // In this case, maybe the department or "Internal"
      table.string('invoice_no').nullable();
      table.date('invoice_date').notNullable();
      table.date('due_date').notNullable();
      table.decimal('total_amount', 14, 2).notNullable();
      table.decimal('amount_paid', 14, 2).defaultTo(0);
      table.decimal('outstanding_balance', 14, 2).defaultTo(0);
      table.string('status').defaultTo('Unpaid'); // Unpaid, Overdue, Paid
      table.string('department_source').nullable();
      table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('finance_receivables')
    .dropTableIfExists('finance_income_submissions');
};
