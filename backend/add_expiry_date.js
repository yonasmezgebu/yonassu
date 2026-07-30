const { db } = require('./src/config/database');

async function main() {
  try {
    await db.raw('ALTER TABLE `retail_products` ADD COLUMN `expiry_date` DATE NULL AFTER `reorder_level`');
    console.log('✅ expiry_date added to retail_products');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ expiry_date already exists in retail_products');
    } else {
      console.error('❌ Error adding column:', err.message);
    }
  }
  process.exit(0);
}
main();
