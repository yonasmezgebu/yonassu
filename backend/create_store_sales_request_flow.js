/**
 * Migration: Create Store-Sales Request Flow Tables
 * Tables: store_sales_requests, store_sales_releases, store_sales_records
 */
const { db, closeConnection } = require('./src/config/database');

async function migrate() {
  console.log('Creating store-sales request flow tables...');

  // 1. store_sales_requests
  const hasReq = await db.schema.hasTable('store_sales_requests');
  if (!hasReq) {
    await db.schema.createTable('store_sales_requests', t => {
      t.increments('id').primary();
      t.string('request_code', 100).unique();
      t.string('store_module', 50).defaultTo('general_store'); // general_store | retail | pharmacy
      t.string('product_id', 100).nullable(); // links to general_store_materials.material_id
      t.string('product_name', 300).notNullable();
      t.string('unit', 50).nullable();
      t.integer('quantity_requested').notNullable();
      t.string('customer_name', 300).nullable();
      t.string('customer_phone', 50).nullable();
      t.integer('requested_by_id').unsigned().nullable();
      t.string('requested_by_name', 300).nullable();
      t.text('digital_signature').nullable(); // base64 dataURL of e-signature canvas
      t.timestamp('signature_timestamp').nullable();
      t.string('notes', 1000).nullable();
      t.enum('status', ['Pending', 'Approved', 'Released', 'Sold', 'Rejected']).defaultTo('Pending');
      t.string('rejection_reason', 500).nullable();
      t.timestamps(true, true);
    });
    console.log('✅ store_sales_requests created');
  } else {
    console.log('⏭  store_sales_requests already exists');
  }

  // 2. store_sales_releases
  const hasRel = await db.schema.hasTable('store_sales_releases');
  if (!hasRel) {
    await db.schema.createTable('store_sales_releases', t => {
      t.increments('id').primary();
      t.integer('request_id').unsigned().notNullable();
      t.integer('released_by_id').unsigned().nullable();
      t.string('released_by_name', 300).nullable();
      t.integer('quantity_released').notNullable();
      t.decimal('remaining_stock', 14, 2).nullable();
      t.timestamp('release_date').defaultTo(db.fn.now());
      t.string('notes', 500).nullable();
      t.timestamps(true, true);
    });
    console.log('✅ store_sales_releases created');
  } else {
    console.log('⏭  store_sales_releases already exists');
  }

  // 3. store_sales_records (the final sale)
  const hasRec = await db.schema.hasTable('store_sales_records');
  if (!hasRec) {
    await db.schema.createTable('store_sales_records', t => {
      t.increments('id').primary();
      t.string('sale_code', 100).unique();
      t.integer('request_id').unsigned().notNullable();
      t.string('product_id', 100).nullable();
      t.string('product_name', 300).nullable();
      t.integer('quantity_sold').notNullable();
      t.integer('sold_by_id').unsigned().nullable();
      t.string('sold_by_name', 300).nullable();
      t.string('customer_name', 300).nullable();
      t.string('customer_phone', 50).nullable();
      t.decimal('unit_value', 14, 2).nullable(); // unit_value from store
      t.decimal('total_value', 14, 2).nullable();
      t.timestamp('sale_date').defaultTo(db.fn.now());
      t.timestamps(true, true);
    });
    console.log('✅ store_sales_records created');
  } else {
    console.log('⏭  store_sales_records already exists');
  }

  await closeConnection();
  console.log('Migration complete.');
}

migrate().catch(e => { console.error(e); process.exit(1); });
