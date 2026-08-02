const { db } = require('./src/config/database');

async function setup() {
  try {
    const hasSuppliers = await db.schema.hasTable('erp_suppliers_v3');
    if (!hasSuppliers) {
      await db.schema.createTable('erp_suppliers_v3', t => {
        t.increments('id').primary();
        t.string('supplier_name').notNullable();
        t.string('phone');
        t.string('email');
        t.string('address');
        t.timestamp('created_at').defaultTo(db.fn.now());
      });
      console.log('erp_suppliers_v3 table created.');
    }

    const hasLiab = await db.schema.hasTable('erp_liabilities_v3');
    if (!hasLiab) {
      await db.schema.createTable('erp_liabilities_v3', t => {
        t.increments('id').primary();
        t.integer('supplier_id').unsigned();
        t.string('liability_type').defaultTo('ACCOUNTS_PAYABLE'); // To differentiate loans/taxes if needed
        t.string('invoice_number').notNullable();
        t.text('description');
        t.decimal('amount', 14, 2).notNullable().defaultTo(0);
        t.decimal('paid_amount', 14, 2).notNullable().defaultTo(0);
        t.decimal('balance', 14, 2).notNullable().defaultTo(0);
        t.date('invoice_date');
        t.date('due_date');
        t.string('status').notNullable().defaultTo('Pending');
        t.timestamp('created_at').defaultTo(db.fn.now());
      });
      console.log('erp_liabilities_v3 table created.');
    }

    const hasPay = await db.schema.hasTable('erp_payments_v3');
    if (!hasPay) {
      await db.schema.createTable('erp_payments_v3', t => {
        t.increments('id').primary();
        t.integer('liability_id').unsigned();
        t.date('payment_date').notNullable();
        t.decimal('amount', 14, 2).notNullable().defaultTo(0);
        t.string('payment_method').notNullable().defaultTo('Cash');
        t.text('notes');
        t.timestamp('created_at').defaultTo(db.fn.now());
      });
      console.log('erp_payments_v3 table created.');
    }
  } catch (err) {
    console.error('Setup failed:', err);
  } finally {
    process.exit(0);
  }
}

setup();
