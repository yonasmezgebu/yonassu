exports.up = function(knex) {
  return knex.schema
    .createTable('sales_invoices', t => {
      t.string('id', 50).primary(); // e.g. 'retail-123'
      t.string('invoice_no', 50).notNullable().unique();
      t.string('source', 20).notNullable(); // 'retail', 'pharmacy', 'printing', 'car_rental', 'agrirent', 'tender_sell', 'tender_buy'
      t.integer('sale_id').unsigned().notNullable(); // the actual order ID in the respective table
      t.string('customer_name', 255);
      t.string('customer_tin', 50);
      t.decimal('subtotal', 15, 2).defaultTo(0);
      t.decimal('vat_standard', 15, 2).defaultTo(0);
      t.decimal('vat_standard_rate', 5, 2).defaultTo(0.15);
      t.decimal('vat_exempt', 15, 2).defaultTo(0);
      t.decimal('vat_zero_rated', 15, 2).defaultTo(0);
      t.decimal('vat_total', 15, 2).defaultTo(0);
      t.decimal('total_amount', 15, 2).defaultTo(0);
      t.string('status', 20).defaultTo('active'); // 'active', 'cancelled'
      t.string('created_by_name', 255);
      t.timestamps(true, true);
    })
    .createTable('sales_invoice_items', t => {
      t.increments('id').primary();
      t.string('invoice_id', 50).notNullable().references('id').inTable('sales_invoices').onDelete('CASCADE');
      t.integer('item_id').unsigned();
      t.string('name', 255).notNullable();
      t.decimal('qty', 10, 2).notNullable().defaultTo(1);
      t.decimal('unit_price', 15, 2).notNullable().defaultTo(0);
      t.string('treatment', 20).notNullable(); // 'standard', 'exempt', 'zero_rated'
      t.decimal('rate', 5, 2).notNullable().defaultTo(0); // 0.15, 0
      t.decimal('vat_amount', 15, 2).notNullable().defaultTo(0);
      t.decimal('subtotal', 15, 2).notNullable().defaultTo(0); // qty * unitPrice
      t.decimal('total', 15, 2).notNullable().defaultTo(0); // subtotal + vat
    })
    .createTable('sales_receipts', t => {
      t.string('id', 50).primary(); // e.g. 'REC-123'
      t.string('receipt_no', 50).notNullable().unique();
      t.string('invoice_id', 50).notNullable().references('id').inTable('sales_invoices');
      t.decimal('amount_paid', 15, 2).notNullable();
      t.string('payment_method', 50);
      t.string('payment_reference', 100);
      t.string('received_by_name', 255);
      t.string('status', 20).defaultTo('active'); // 'active', 'cancelled'
      t.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('sales_receipts')
    .dropTableIfExists('sales_invoice_items')
    .dropTableIfExists('sales_invoices');
};
