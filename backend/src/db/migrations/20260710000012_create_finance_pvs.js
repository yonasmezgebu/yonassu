exports.up = function(knex) {
  return knex.schema.createTable('finance_pvs', table => {
    table.increments('id').primary();
    table.string('pv_number').notNullable().unique();
    table.date('date').notNullable();
    table.string('paid_to').notNullable(); // Payee Name
    table.decimal('amount', 14, 2).notNullable();
    table.string('payment_method').notNullable(); // Cash, Bank, Telebirr
    table.string('description').notNullable(); // What the payment is for
    table.string('reference_no').nullable(); // Invoice No, etc.
    
    // Conditional details
    table.string('bank_name').nullable();
    table.string('account_holder').nullable();
    table.string('account_number').nullable();
    table.string('cheque_no').nullable();
    
    table.string('telebirr_number').nullable();
    table.string('telebirr_name').nullable();

    // Signatures and their image payloads
    table.string('prepared_by').nullable();
    table.string('checked_by').nullable();
    table.string('receiver_name').nullable(); // Payee/Receiver
    
    table.text('prepared_signature', 'longtext').nullable();
    table.text('checked_signature', 'longtext').nullable();
    table.text('receiver_signature', 'longtext').nullable();
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('finance_pvs');
};
