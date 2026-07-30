/**
 * One-off script to create the retail_update_requests table.
 * Run with: node create_retail_update_requests.js
 */
const { db } = require('./src/config/database');

async function main() {
  await db.raw('DROP TABLE IF EXISTS `retail_update_requests`');
  console.log('Dropped old table (if any)...');

  await db.raw(`
    CREATE TABLE IF NOT EXISTS \`retail_update_requests\` (
      \`id\`               INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
      \`product_id\`       INT(11) NOT NULL,
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
  console.log('✅ retail_update_requests table created successfully!');

  await db.destroy();
}

main().catch(err => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
