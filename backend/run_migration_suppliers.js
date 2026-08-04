/**
 * Creates self_registered_suppliers table — separate from internal procurement suppliers
 */
const { db } = require('./src/config/database');

async function runMigration() {
  try {
    const exists = await db.schema.hasTable('self_registered_suppliers');
    if (exists) {
      console.log('✅ self_registered_suppliers table already exists — skipping.');
      process.exit(0);
    }

    await db.schema.createTable('self_registered_suppliers', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.string('full_name', 200).notNullable();
      table.string('email', 255).notNullable();
      table.string('phone', 50).notNullable();
      table.string('company_name', 200).nullable();
      table.string('category', 200).notNullable();
      table.text('business_address').notNullable();
      table.text('description').nullable();
      table.string('status', 50).notNullable().defaultTo('Active');
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
      table.unique('user_id'); // one supplier profile per user
      table.index('status');
    });

    console.log('✅ self_registered_suppliers table created successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

runMigration();
