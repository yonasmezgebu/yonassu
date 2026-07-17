const { db } = require('./src/config/database');
async function f() {
  const inv = await db('pharmacy_inventory as pi')
    .join('drugs as d', 'pi.drug_id', 'd.id')
    .select('d.name', 'd.strength', 'd.unit', 'pi.branch_id', 'pi.quantity')
    .orderBy('d.name');
  let totals = {};
  for (const r of inv) {
    if (!totals[r.name]) totals[r.name] = { strength: r.strength, unit: r.unit, branches: {} };
    totals[r.name].branches[r.branch_id] = r.quantity;
  }
  console.log('Drug Name'.padEnd(30), 'Stre'.padEnd(10), 'Br1', 'Br2', 'Br3', 'Total');
  for (const [name, t] of Object.entries(totals)) {
    const b1 = t.branches[1] || 0;
    const b2 = t.branches[2] || 0;
    const b3 = t.branches[3] || 0;
    const total = b1+b2+b3;
    const st = (t.strength||'') + (t.unit||'');
    console.log(name.padEnd(30), st.padEnd(10), b1.toFixed(), b2.toFixed(), b3.toFixed(), total.toFixed());
  }
  await db.destroy();
}
f().catch(e => { console.log(e.message); process.exit(1); });
