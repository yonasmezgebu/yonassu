const { db } = require('./src/config/database');

async function migrate() {
  try {
    await db.raw(`ALTER TABLE car_renting_maintenance MODIFY COLUMN status ENUM('PENDING_CEO','PENDING_FINANCE','FINANCE_READY','FINANCE_APPROVED','PAYMENT_RELEASED','COMPLETED','REJECTED') DEFAULT 'PENDING_CEO'`);
    console.log('SUCCESS: FINANCE_READY status added to enum');
  } catch(e) {
    console.error('ERROR:', e.message);
  } finally {
    await db.destroy();
  }
}

migrate();
