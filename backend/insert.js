require('dotenv').config();
const { db } = require('./src/config/database');

async function run() {
  try {
    await db('finance_income_submissions').insert({
      department: 'Pharmacy',
      submitted_by: 'System Backfill',
      amount: 5437.00,
      reference_no: 'PHARM-BACKFILL-001',
      description: 'Backfilled Pharmacy Sales (8 transactions)',
      status: 'Pending'
    });
    console.log('Inserted');
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
