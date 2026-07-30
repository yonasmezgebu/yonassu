const { db } = require('./src/config/database');
async function f() {
  await db.raw(`ALTER TABLE bids MODIFY COLUMN status varchar(50) NOT NULL DEFAULT 'pending'`);
  console.log('Fixed bids.status length');
  await db.destroy();
}
f().catch(e => { console.log(e.message); process.exit(1); });
