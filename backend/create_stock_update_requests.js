/**
 * One-off script to create the stock_update_requests table.
 * Run with: node create_stock_update_requests.js
 */
const { db } = require('./src/config/database');

async function main() {
  // Drop any partial table left from failed migrations
  await db.raw('DROP TABLE IF EXISTS `stock_update_requests`');
  console.log('Dropped old table (if any)...');

  // Create the table without foreign key constraints to avoid type-mismatch issues
  await db.raw(`
    CREATE TABLE IF NOT EXISTS \`stock_update_requests\` (
      \`id\`               INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
      \`inventory_id\`     INT(11) NOT NULL,
      \`drug_id\`          INT(11) NOT NULL,
      \`requested_by\`     INT(11) NULL,
      \`old_data\`         JSON    NOT NULL,
      \`new_data\`         JSON    NOT NULL,
      \`status\`           ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
      \`rejection_reason\` VARCHAR(500) NULL,
      \`approved_by\`      INT(11) NULL,
      \`approved_at\`      TIMESTAMP NULL,
      \`created_at\`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✅ stock_update_requests table created successfully!');

  // Also mark the migration as done so knex doesn't try to run it again
  const exists = await db('knex_migrations').where('name', '20260722_stock_update_requests.js').first().catch(() => null);
  if (!exists) {
    await db('knex_migrations').insert({
      name: '20260722_stock_update_requests.js',
      batch: 999,
      migration_time: new Date()
    });
    console.log('✅ Marked migration as complete in knex_migrations.');
  } else {
    console.log('ℹ️  Migration already tracked in knex_migrations.');
  }

  await db.destroy();
}

main().catch(err => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
