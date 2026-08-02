const { db } = require('./src/config/database');

async function setup() {
  try {
    console.log('Setting up Receivables Module schema...');

    // 1. Create erp_customers table
    const hasCustomers = await db.schema.hasTable('erp_customers');
    if (!hasCustomers) {
      await db.schema.createTable('erp_customers', (table) => {
        table.increments('id').primary();
        table.string('customer_name').notNullable();
        table.string('phone').nullable();
        table.string('email').nullable();
        table.text('address').nullable();
        table.timestamp('created_at').defaultTo(db.fn.now());
      });
      console.log('✅ Created erp_customers table.');
    } else {
      console.log('ℹ️ erp_customers table already exists.');
    }

    // 2. Create erp_receivables table
    const hasReceivables = await db.schema.hasTable('erp_receivables');
    if (!hasReceivables) {
      await db.schema.createTable('erp_receivables', (table) => {
        table.increments('id').primary();
        table.string('customer_name').notNullable(); // Simplification for ERP spec
        table.string('invoice_number').notNullable();
        table.text('description').nullable();
        table.decimal('amount', 15, 2).notNullable();
        table.decimal('received_amount', 15, 2).defaultTo(0);
        table.decimal('balance', 15, 2).notNullable();
        table.date('invoice_date').notNullable();
        table.date('due_date').notNullable();
        table.string('status').defaultTo('Pending'); // Pending, Partially Received, Received, Overdue
        table.timestamp('created_at').defaultTo(db.fn.now());
      });
      console.log('✅ Created erp_receivables table.');
    } else {
      console.log('ℹ️ erp_receivables table already exists.');
    }

    // 3. Create erp_receivable_payments table
    const hasPayments = await db.schema.hasTable('erp_receivable_payments');
    if (!hasPayments) {
      await db.schema.createTable('erp_receivable_payments', (table) => {
        table.increments('id').primary();
        table.integer('receivable_id').unsigned().notNullable();
        table.date('payment_date').notNullable();
        table.decimal('amount', 15, 2).notNullable();
        table.string('payment_method').notNullable();
        table.text('notes').nullable();
        table.timestamp('created_at').defaultTo(db.fn.now());
        
        table.foreign('receivable_id').references('id').inTable('erp_receivables').onDelete('CASCADE');
      });
      console.log('✅ Created erp_receivable_payments table.');
    } else {
      console.log('ℹ️ erp_receivable_payments table already exists.');
    }

    console.log('🎉 Setup complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error setting up schema:', err);
    process.exit(1);
  }
}

setup();
