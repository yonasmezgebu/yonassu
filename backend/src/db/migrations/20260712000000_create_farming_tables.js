exports.up = async function(knex) {
  // Drop tables if they exist to avoid the "already exists" error
  await knex.schema.dropTableIfExists('farming_finance_reports');
  await knex.schema.dropTableIfExists('farming_shifts');
  await knex.schema.dropTableIfExists('farming_reorder_requests');
  await knex.schema.dropTableIfExists('farming_order_items');
  await knex.schema.dropTableIfExists('farming_orders');
  await knex.schema.dropTableIfExists('farming_products');
  await knex.schema.dropTableIfExists('farming_categories');

  return knex.schema
    .createTable('farming_categories', table => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('slug').notNullable().unique();
      table.text('description');
      table.string('cover_image');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('farming_products', table => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.integer('category_id').unsigned().references('id').inTable('farming_categories').onDelete('SET NULL');
      table.text('description');
      table.text('usage_instructions');
      table.decimal('price', 10, 2).notNullable();
      table.integer('stock_quantity').defaultTo(0);
      table.integer('reorder_level').defaultTo(0);
      table.string('product_image');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('farming_orders', table => {
      table.increments('id').primary();
      table.string('invoice_number').unique().notNullable();
      table.integer('customer_id').references('id').inTable('users').onDelete('SET NULL'); // users.id is signed
      table.string('customer_name');
      table.string('customer_email');
      table.string('customer_phone');
      table.decimal('total_amount', 10, 2).notNullable();
      table.string('payment_method');
      table.string('status').defaultTo('PENDING'); 
      table.string('delivery_option').defaultTo('pickup');
      table.text('delivery_address');
      table.decimal('delivery_fee', 10, 2).defaultTo(0);
      table.text('notes');
      table.boolean('finance_verified').defaultTo(false);
      table.timestamp('verified_at').nullable();
      table.integer('verified_by').references('id').inTable('users').onDelete('SET NULL'); // users.id is signed
      table.timestamps(true, true);
    })
    .createTable('farming_order_items', table => {
      table.increments('id').primary();
      table.integer('order_id').unsigned().notNullable().references('id').inTable('farming_orders').onDelete('CASCADE');
      table.integer('product_id').unsigned().notNullable().references('id').inTable('farming_products').onDelete('RESTRICT');
      table.integer('quantity').notNullable();
      table.decimal('price_per_unit', 10, 2).notNullable();
      table.decimal('subtotal', 10, 2).notNullable();
      table.timestamps(true, true);
    })
    .createTable('farming_reorder_requests', table => {
      table.increments('id').primary();
      table.integer('product_id').unsigned().notNullable().references('id').inTable('farming_products').onDelete('CASCADE');
      table.integer('requested_quantity').notNullable();
      table.string('status').defaultTo('PENDING');
      table.text('notes');
      table.integer('requested_by').references('id').inTable('users').onDelete('SET NULL'); // users.id is signed
      table.timestamps(true, true);
    })
    .createTable('farming_shifts', table => {
      table.increments('id').primary();
      table.integer('worker_id').notNullable().references('id').inTable('users').onDelete('CASCADE'); // users.id is signed
      table.timestamp('opened_at').defaultTo(knex.fn.now());
      table.timestamp('closed_at').nullable();
      table.decimal('cash_collected', 10, 2).defaultTo(0);
      table.decimal('telebirr_collected', 10, 2).defaultTo(0);
      table.decimal('transfer_collected', 10, 2).defaultTo(0);
      table.decimal('total_sales', 10, 2).defaultTo(0);
      table.integer('transaction_count').defaultTo(0);
      table.string('status').defaultTo('OPEN');
      table.boolean('is_reconciled').defaultTo(false);
      table.timestamps(true, true);
    })
    .createTable('farming_finance_reports', table => {
      table.increments('id').primary();
      table.integer('shift_id').unsigned().references('id').inTable('farming_shifts').onDelete('SET NULL');
      table.integer('worker_id').references('id').inTable('users').onDelete('SET NULL'); // users.id is signed
      table.decimal('total_amount', 10, 2).notNullable();
      table.string('status').defaultTo('PENDING'); 
      table.text('notes');
      table.timestamp('submitted_at').defaultTo(knex.fn.now());
      table.timestamp('processed_at').nullable();
      table.integer('processed_by').references('id').inTable('users').onDelete('SET NULL'); // users.id is signed
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('farming_finance_reports')
    .dropTableIfExists('farming_shifts')
    .dropTableIfExists('farming_reorder_requests')
    .dropTableIfExists('farming_order_items')
    .dropTableIfExists('farming_orders')
    .dropTableIfExists('farming_products')
    .dropTableIfExists('farming_categories');
};
