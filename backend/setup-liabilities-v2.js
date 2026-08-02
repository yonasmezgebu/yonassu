const { db } = require('./src/config/database');

async function setup() {
  try {
    console.log('Setting up Complete Liabilities Module schema...');

    // 1. liabilities — core unified table
    const hasLiabilities = await db.schema.hasTable('liabilities');
    if (!hasLiabilities) {
      await db.schema.createTable('liabilities', (t) => {
        t.increments('id').primary();
        t.string('liability_type').notNullable(); // ACCOUNTS_PAYABLE | BANK_LOAN | TAX | SALARY | OTHER
        t.string('reference_no').notNullable();
        t.string('party_name').notNullable();
        t.text('description').nullable();
        t.decimal('amount', 15, 2).notNullable();
        t.decimal('paid_amount', 15, 2).defaultTo(0);
        t.decimal('balance', 15, 2).notNullable();
        t.date('issue_date').nullable();
        t.date('due_date').notNullable();
        t.string('status').defaultTo('Pending'); // Pending | Partially Paid | Paid | Overdue
        t.timestamp('created_at').defaultTo(db.fn.now());
      });
      console.log('✅ Created liabilities table.');
    } else {
      console.log('ℹ️  liabilities table already exists.');
    }

    // 2. loan_details — extension for BANK_LOAN
    const hasLoans = await db.schema.hasTable('loan_details');
    if (!hasLoans) {
      await db.schema.createTable('loan_details', (t) => {
        t.increments('id').primary();
        t.integer('liability_id').unsigned().notNullable();
        t.string('lender_name').notNullable();
        t.decimal('interest_rate', 5, 2).nullable();
        t.integer('term_months').nullable();
        t.decimal('principal_amount', 15, 2).notNullable();
        t.foreign('liability_id').references('id').inTable('liabilities').onDelete('CASCADE');
      });
      console.log('✅ Created loan_details table.');
    } else {
      console.log('ℹ️  loan_details table already exists.');
    }

    // 3. tax_details — extension for TAX
    const hasTax = await db.schema.hasTable('tax_details');
    if (!hasTax) {
      await db.schema.createTable('tax_details', (t) => {
        t.increments('id').primary();
        t.integer('liability_id').unsigned().notNullable();
        t.string('tax_type').notNullable(); // VAT | Income Tax | Payroll Tax | Withholding
        t.string('tax_period').nullable();  // e.g. "July 2026"
        t.string('receipt_no').nullable();
        t.foreign('liability_id').references('id').inTable('liabilities').onDelete('CASCADE');
      });
      console.log('✅ Created tax_details table.');
    } else {
      console.log('ℹ️  tax_details table already exists.');
    }

    // 4. liability_payments — unified payments ledger
    const hasPayments = await db.schema.hasTable('liability_payments');
    if (!hasPayments) {
      await db.schema.createTable('liability_payments', (t) => {
        t.increments('id').primary();
        t.integer('liability_id').unsigned().notNullable();
        t.date('payment_date').notNullable();
        t.decimal('amount', 15, 2).notNullable();
        t.string('payment_method').notNullable();
        t.text('notes').nullable();
        t.timestamp('created_at').defaultTo(db.fn.now());
        t.foreign('liability_id').references('id').inTable('liabilities').onDelete('CASCADE');
      });
      console.log('✅ Created liability_payments table.');
    } else {
      console.log('ℹ️  liability_payments table already exists.');
    }

    console.log('🎉 Complete Liabilities schema setup done!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Setup error:', err);
    process.exit(1);
  }
}

setup();
