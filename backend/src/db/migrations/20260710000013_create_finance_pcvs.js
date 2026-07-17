exports.up = function(knex) {
  return knex.schema.createTable('finance_pcvs', table => {
    table.increments('id').primary();
    table.string('pcv_number').notNullable().unique();
    table.date('date').notNullable();
    table.string('paid_to').notNullable(); // Payee Name
    table.decimal('amount', 14, 2).notNullable();
    table.string('payment_method').notNullable().defaultTo('Cash'); // usually just cash for petty cash
    table.string('description').notNullable(); // What the payment is for
    table.string('reference_no').nullable();
    
    // Signatures
    table.string('prepared_by').nullable();
    table.string('checked_by').nullable();
    table.string('receiver_name').nullable();
    
    table.text('prepared_signature', 'longtext').nullable();
    table.text('checked_signature', 'longtext').nullable();
    table.text('receiver_signature', 'longtext').nullable();
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('finance_pcvs');
};
