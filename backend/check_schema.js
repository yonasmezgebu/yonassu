const db = require('./src/config/db');

async function run() {
  try {
    const columns = await db.raw('SHOW COLUMNS FROM hr_employees');
    console.log(columns[0].map(c => c.Field).join(', '));
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
