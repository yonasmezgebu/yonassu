const { db } = require('./src/config/database');

async function run() {
  const exists = await db.schema.hasTable('retail_pos_carts');
  if (!exists) {
    await db.schema.createTable('retail_pos_carts', (table) => {
      table.increments('id').primary();
      table.string('cart_code').unique();
      table.integer('cashier_id');
      table.string('cashier_name');
      table.string('customer_name');
      table.string('customer_phone');
      table.string('payment_method');
      table.decimal('payment_amount', 12, 2);
      table.string('payment_reference');
      table.string('bank_name');
      table.string('account_number');
      table.string('telbir_number');
      table.string('txn_id');
      table.decimal('total_amount', 12, 2);
      table.text('items');
      table.integer('finance_submission_id');
      table.integer('store_request_id');
      table.string('status');
      table.text('sales_manager_signature');
      table.timestamp('signature_timestamp');
      table.text('notes');
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });
    console.log('Table retail_pos_carts created');
  } else {
    console.log('Table retail_pos_carts already exists');
  }

  const hasCartItems = await db.schema.hasColumn('store_sales_requests', 'cart_items');
  if (!hasCartItems) {
    await db.schema.alterTable('store_sales_requests', (table) => {
      table.text('cart_items');
      table.integer('retail_cart_id');
    });
    console.log('Added columns to store_sales_requests');
  } else {
    console.log('store_sales_requests already has columns');
  }
  
  process.exit(0);
}

run().catch(console.error);
