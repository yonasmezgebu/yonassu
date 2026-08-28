const { db } = require('./src/config/database');
(async () => {
  const tables = [
    'general_store_materials','printing_assets_machines','cars','tractors','pharmacy_inventory','pharmacy_medications'
  ];
  // Check which exist and their columns / data
  for (const t of tables) {
    const exists = await db.schema.hasTable(t);
    if (!exists) { console.log('\n=== ' + t + ' : DOES NOT EXIST ==='); continue; }
    const cnt = await db(t).count('* as c').first();
    console.log('\n=== ' + t + ' : ' + cnt.c + ' rows ===');
    const cols = await db.raw('SHOW COLUMNS FROM ' + t);
    console.log('cols:', cols[0].map(c => c.Field).join(', '));
  }

  console.log('\n--- general_store_materials sample (name, qty, unit_value, total_value) ---');
  const gm = await db('general_store_materials').select('*').limit(8);
  console.log(JSON.stringify(gm, null, 1));
  console.log('gm sum total_value:', (await db('general_store_materials').sum('total_value as v').first()).v);

  console.log('\n--- printing_assets_machines sample ---');
  const pm = await db('printing_assets_machines').select('*').limit(10);
  console.log(JSON.stringify(pm, null, 1));
  console.log('pm sum internal_value:', (await db('printing_assets_machines').sum('internal_value as v').first()).v);

  console.log('\n--- cars sample ---');
  const cars = await db('cars').select('id','name','carType','dailyRate','asset_value','deleted_at').limit(20);
  console.log(JSON.stringify(cars, null, 1));
  console.log('cars sum asset_value:', (await db('cars').sum('asset_value as v').first()).v, 'count:', (await db('cars').count('* as c').first()).c);

  console.log('\n--- tractors sample ---');
  const tr = await db('tractors').select('*').limit(20);
  console.log(JSON.stringify(tr, null, 1));

  await db.destroy();
})();
