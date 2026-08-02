const { db } = require('./src/config/database');

async function setup() {
  try {
    console.log('Setting up Liabilities Module schema...');

    // 1. Create erp_suppliers table
    const hasSuppliers = await db.schema.hasTable('erp_suppliers');
    if (!hasSuppliers) {
      await db.schema.createTable('erp_suppliers', (table) => {
        table.increments('id').primary();
        table.string('supplier_name').notNullable();
        table.string('phone').nullable();
        table.string('email').nullable();
        table.text('address').nullable();
        table.timestamp('created_at').defaultTo(db.fn.now());
      });
      console.log('✅ Created erp_suppliers table.');
    } else {
      console.log('ℹ️ erp_suppliers table already exists.');
    }

    // 2. Create erp_liabilities table
    const hasLiabilities = await db.schema.hasTable('erp_liabilities');
    if (!hasLiabilities) {
      await db.schema.createTable('erp_liabilities', (table) => {
        table.increments('id').primary();
        table.string('supplier_name').notNullable();
        table.string('invoice_number').notNullable();
        table.text('description').nullable();
        table.decimal('amount', 15, 2).notNullable();
        table.decimal('paid_amount', 15, 2).defaultTo(0);
        table.decimal('balance', 15, 2).notNullable();
        table.date('invoice_date').notNullable();
        table.date('due_date').notNullable();
        table.string('status').defaultTo('Pending'); // Pending, Partially Paid, Paid, Overdue
        table.timestamp('created_at').defaultTo(db.fn.now());
      });
      console.log('✅ Created erp_liabilities table.');
    } else {
      console.log('ℹ️ erp_liabilities table already exists.');
    }

    // 3. Create erp_payments table
    const hasPayments = await db.schema.hasTable('erp_payments');
    if (!hasPayments) {
      await db.schema.createTable('erp_payments', (table) => {
        table.increments('id').primary();
        table.integer('liability_id').unsigned().notNullable();
        table.date('payment_date').notNullable();
        table.decimal('amount', 15, 2).notNullable();
        table.string('payment_method').notNullable();
        table.text('notes').nullable();
        table.timestamp('created_at').defaultTo(db.fn.now());
      });
      console.log('✅ Created erp_payments table.');
    } else {
      console.log('ℹ️ erp_payments table already exists.');
    }

    console.log('🎉 Setup complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error setting up schema:', err);
    process.exit(1);
  }
}

setup();
