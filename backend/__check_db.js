const { db } = require('./src/config/database');
async function f() {
  const inv = await db('pharmacy_inventory').select('branch_id', 'drug_id', 'quantity').orderBy('drug_id');
  console.log('=== pharmacy_inventory ===');
  inv.forEach(r => console.log('  drug_id='+r.drug_id+' branch='+r.branch_id+' qty='+r.quantity));
  const dc = await db('pharmacy_medications').count('id as cnt');
  console.log('\n=== pharmacy_medications count:', dc[0].cnt, '===');
  const dd = await db('drugs').count('id as cnt');
  console.log('=== drugs count:', dd[0].cnt, '===');
  await db.destroy();
}
f().catch(e => { console.log(e.message); process.exit(1); });
