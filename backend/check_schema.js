const { db } = require('./src/config/database');
async function test() {
  try {
    const rows = await db.raw("SHOW COLUMNS FROM tenders LIKE 'status'");
    console.log('TENDERS STATUS ENUM:', JSON.stringify(rows[0][0]));
    const brows = await db.raw("SHOW COLUMNS FROM bids LIKE 'status'");
    console.log('BIDS STATUS ENUM:', JSON.stringify(brows[0][0]));
    const bcrows = await db.raw("SHOW COLUMNS FROM bids LIKE 'ceo_approval_status'");
    console.log('BIDS CEO_APPROVAL_STATUS ENUM:', JSON.stringify(bcrows[0][0]));
  } catch(e) {
    console.error('ERROR:', e.message);
  } finally {
    await db.destroy();
  }
}
test();
