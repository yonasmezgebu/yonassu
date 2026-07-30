const { db } = require('./src/config/database');
async function test() {
  try {
    // Simulate what the API does: approve bid id=1, tender id=11
    const bidId = 1;
    const tenderId = 11;

    console.log('Step 1: updating bid status to awarded...');
    await db('bids').where('id', bidId).update({
      ceo_approval_status: 'approved',
      status: 'awarded',
      updated_at: db.fn.now()
    });
    console.log('Step 1 done OK');

    console.log('Step 2: updating tender status to awarded...');
    await db('tenders').where('id', tenderId).update({
      status: 'awarded',
      updated_at: db.fn.now()
    });
    console.log('Step 2 done OK');

    console.log('SUCCESS!');
  } catch(e) {
    console.error('ERROR:', e.message);
    console.error('SQL:', e.sql);
  } finally {
    await db.destroy();
  }
}
test();
