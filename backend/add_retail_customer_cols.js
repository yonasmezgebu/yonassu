const { db } = require('./src/config/database');

async function runMigration() {
  const hasName  = await db.schema.hasColumn('retail_orders', 'customer_name');
  const hasPhone = await db.schema.hasColumn('retail_orders', 'customer_phone');
  const hasEmail = await db.schema.hasColumn('retail_orders', 'customer_email');

  if (!hasName || !hasPhone || !hasEmail) {
    await db.schema.alterTable('retail_orders', (t) => {
      if (!hasName)  t.string('customer_name', 200).nullable();
      if (!hasPhone) t.string('customer_phone', 50).nullable();
      if (!hasEmail) t.string('customer_email', 255).nullable();
    });
    console.log('✅ Added customer_name, customer_phone, customer_email to retail_orders');
  } else {
    console.log('ℹ️  Columns already exist – nothing to do');
  }
  db.destroy();
}

runMigration().catch(err => { console.error(err); db.destroy(); });
