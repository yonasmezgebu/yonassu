const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'sutana_ems'
}).promise();

async function run() {
  const [cols] = await pool.execute(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'printing_order_works' AND COLUMN_NAME = 'message'`
  );
  if (cols.length === 0) {
    await pool.execute('ALTER TABLE `printing_order_works` ADD COLUMN `message` TEXT NULL AFTER `file_url`');
    console.log('column added: printing_order_works.message');
  } else {
    console.log('column already exists: printing_order_works.message');
  }
  await pool.end();
}

run()
  .then(() => process.exit(0))
  .catch(e => { console.error(e.message); process.exit(1); });