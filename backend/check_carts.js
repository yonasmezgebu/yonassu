const db = require('./src/config/database').db;
async function main() {
  const sales = await db('pos_sales')
    .select('id', 'invoice_number', 'sale_type', 'payment_method_id', 'total_amount', 'is_submitted', 'created_at')
    .orderBy('created_at', 'desc')
    .limit(15);
  console.log('=== Recent POS Sales ===');
  console.log(JSON.stringify(sales, null, 2));

  // check retail_products
  const prods = await db('retail_products')
    .select('id', 'name', 'stock_quantity', 'sku')
    .limit(10);
  console.log('\n=== Retail Products ===');
  console.log(JSON.stringify(prods, null, 2));

  await db.destroy();
}
main().catch(e => { console.error(e.message); process.exit(1); });
