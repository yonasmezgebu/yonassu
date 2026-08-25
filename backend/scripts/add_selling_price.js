require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { db } = require('../src/config/database');

async function run() {
  try {
    const has = await db.schema.hasColumn('pharmacy_medications', 'selling_price');
    if (!has) {
      await db.schema.table('pharmacy_medications', t => {
        t.decimal('selling_price', 12, 2).nullable();
      });
      console.log('✅ selling_price column added to pharmacy_medications');
    } else {
      console.log('ℹ️  selling_price column already exists');
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await db.destroy();
  }
}

run();
