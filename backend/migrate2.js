const { db } = require('./src/config/database');

async function run() {
  const hasStoreSignature = await db.schema.hasColumn('store_sales_requests', 'store_keeper_signature');
  if (!hasStoreSignature) {
    await db.schema.alterTable('store_sales_requests', (table) => {
      table.text('store_keeper_signature');
      table.text('store_keeper_notes');
    });
    console.log('Added store keeper approval columns to store_sales_requests');
  } else {
    console.log('Columns already exist');
  }
  process.exit(0);
}

run().catch(console.error);
