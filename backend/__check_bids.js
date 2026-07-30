const { db } = require('./src/config/database');
async function f() {
  const [bids] = await db.raw(`SHOW COLUMNS FROM bids LIKE 'status'`);
  console.log('bids.status:', bids[0]);
  const [tenders] = await db.raw(`SHOW COLUMNS FROM tenders LIKE 'status'`);
  console.log('tenders.status:', tenders[0]);
  await db.destroy();
}
f().catch(e => { console.log(e.message); process.exit(1); });
