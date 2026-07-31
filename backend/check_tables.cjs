const { db } = require('./src/config/database');
async function main() {
  // MySQL variant
  const tables = await db.raw("SHOW TABLES");
  console.log("=== ALL TABLES ===");
  const tableList = tables[0].map(row => Object.values(row)[0]);
  console.log(tableList.join('\n'));

  const schemas = {};
  for (const t of ['store_sales_requests','finance_income_submissions','finance_receivables','retail_products','general_store_materials','retail_orders','pos_sales','pos_items']) {
    try { schemas[t] = Object.keys(await db(t).columnInfo()); } catch(e) { schemas[t] = 'NOT FOUND: '+e.message; }
  }
  console.log('\n\n=== SCHEMAS ===');
  console.log(JSON.stringify(schemas, null, 2));
  db.destroy();
}
main().catch(e => { console.error(e.message); db.destroy(); });
