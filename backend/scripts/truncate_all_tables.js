const { db } = require('../src/config/database');

async function truncateAllTables() {
  console.log('Starting database cleanup...\n');

  try {
    const tables = await db.raw(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);

    const tableRows = tables[0] || tables;
    const tableNames = tableRows.map(r => r.TABLE_NAME);

    console.log(`Found ${tableNames.length} tables to truncate.\n`);

    await db.raw('SET FOREIGN_KEY_CHECKS = 0');

    for (const table of tableNames) {
      try {
        await db.raw(`TRUNCATE TABLE \`${table}\``);
        console.log(`  ✓ Truncated: ${table}`);
      } catch (err) {
        console.log(`  ✗ Failed: ${table} - ${err.message}`);
      }
    }

    await db.raw('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n✅ All tables truncated successfully.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

truncateAllTables();
