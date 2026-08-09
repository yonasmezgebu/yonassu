const { db } = require('./src/config/database');

async function run() {
  try {
    const hasCol = await db.schema.hasColumn('hr_employees', 'payment_method');
    if (!hasCol) {
      console.log('Adding payment_method to hr_employees...');
      await db.schema.alterTable('hr_employees', t => {
        t.string('payment_method', 50).defaultTo('Bank Transfer');
      });
      console.log('Column added successfully.');
    } else {
      console.log('Column payment_method already exists.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await db.destroy();
  }
}

run();
