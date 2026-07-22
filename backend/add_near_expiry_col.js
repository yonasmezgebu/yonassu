const { db, closeConnection } = require('./src/config/database');

async function run() {
  try {
    const hasCol = await db.schema.hasColumn('store_inventory', 'near_expiry_days');
    if (!hasCol) {
      await db.schema.alterTable('store_inventory', t => {
        t.integer('near_expiry_days').defaultTo(90);
      });
      console.log('Added near_expiry_days to store_inventory');
    } else {
      console.log('Column already exists in store_inventory');
    }

    const hasCol2 = await db.schema.hasColumn('stock_receipt_items', 'near_expiry_days');
    if (!hasCol2) {
      await db.schema.alterTable('stock_receipt_items', t => {
        t.integer('near_expiry_days').defaultTo(90);
      });
      console.log('Added near_expiry_days to stock_receipt_items');
    } else {
      console.log('Column already exists in stock_receipt_items');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await closeConnection();
  }
}

run();
