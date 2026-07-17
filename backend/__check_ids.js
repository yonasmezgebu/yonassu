const { db } = require('./src/config/database');
async function f() {
  const pm = await db('pharmacy_medications').select('id','name');
  console.log('=== pharmacy_medications ids ===');
  pm.forEach(r => console.log('  id='+r.id+' name='+r.name));
  const d = await db('drugs').select('id','name');
  console.log('\n=== drugs ids ===');
  d.forEach(r => console.log('  id='+r.id+' name='+r.name));
  await db.destroy();
}
f().catch(e => { console.log(e.message); process.exit(1); });
