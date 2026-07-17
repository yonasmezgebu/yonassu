exports.up = function(knex) {
  return knex.schema
    .createTable('finance_crvs', table => {
      table.increments('id').primary();
      table.string('crv_number').notNullable().unique();
      table.date('date').notNullable();
      table.string('received_from').notNullable();
      table.decimal('amount', 15, 2).notNullable();
      table.string('payment_method').notNullable();
      table.string('description').notNullable();
      table.string('reference_no');
      
      // Bank fields
      table.string('bank_name');
      table.string('account_holder');
      table.string('account_number');
      table.string('cheque_no');
      
      // Telebirr fields
      table.string('telebirr_number');
      table.string('telebirr_name');
      
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('finance_cashbook', table => {
      table.increments('id').primary();
      table.date('date').notNullable();
      table.string('type').notNullable(); // CRV, PV, etc.
      table.string('reference').notNullable(); // CRV Number
      table.string('description').notNullable();
      table.decimal('receipts', 15, 2).defaultTo(0);
      table.decimal('payments', 15, 2).defaultTo(0);
      // Balance is usually calculated dynamically, but can be stored if required. Let's calculate it dynamically in the frontend or view.
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('finance_cashbook')
    .dropTableIfExists('finance_crvs');
};
