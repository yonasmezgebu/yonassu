const { db } = require('./src/config/database');
async function f() {
  const tr = await db.transaction(async (trx) => {
    const bad = await trx('pharmacy_inventory').where({ drug_id: 1 }).whereIn('branch_id', [2, 3]).del();
    console.log('Deleted', bad, 'invalid Amoxicillin records from branches 2/3');
  });
  await db.destroy();
}
f().catch(e => { console.log(e.message); process.exit(1); });
