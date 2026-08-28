const { db } = require('./src/config/database');
(async () => {
  console.log('--- cars (id,name,car_type,daily_rate,asset_value,deleted_at) ---');
  const cars = await db('cars').select('id','name','car_type','daily_rate','asset_value','deleted_at');
  console.log(JSON.stringify(cars, null, 1));
  console.log('cars count:', cars.length);
  console.log('cars sum asset_value:', cars.reduce((s,c)=>s+parseFloat(c.asset_value||0),0));

  console.log('\n--- tractors (id,name,tractor_type,daily_rate,asset_value,deleted_at) ---');
  const tr = await db('tractors').select('id','name','tractor_type','daily_rate','asset_value','deleted_at');
  console.log(JSON.stringify(tr, null, 1));
  console.log('tractors count:', tr.length);
  console.log('tractors sum asset_value:', tr.reduce((s,t)=>s+parseFloat(t.asset_value||0),0));

  console.log('\n--- pharmacy_medications (id,name,price,stock_quantity,unit) ---');
  const pm = await db('pharmacy_medications').select('id','name','price','stock_quantity','unit','selling_price');
  console.log(JSON.stringify(pm, null, 1));

  console.log('\n--- pharmacy_inventory mapped (drug_id, quantity, branch_id) ---');
  const inv = await db('pharmacy_inventory').select('drug_id','quantity','branch_id');
  console.log(JSON.stringify(inv, null, 1));

  await db.destroy();
})();
