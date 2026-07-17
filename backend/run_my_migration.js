const { db } = require('./src/config/database');
const migration = require('./src/db/migrations/20260705000000_pharmacy_flow_1_tables');

async function run() {
  try {
    console.log('Running custom migration...');
    await migration.up(db);
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

run();
