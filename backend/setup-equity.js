const { db } = require('./src/config/database');

async function setup() {
  try {
    console.log('Setting up Equity Module schema...');

    // 1. Create erp_owners table
    const hasOwners = await db.schema.hasTable('erp_owners');
    if (!hasOwners) {
      await db.schema.createTable('erp_owners', (table) => {
        table.increments('id').primary();
        table.string('owner_name').notNullable();
        table.string('phone').nullable();
        table.string('email').nullable();
        table.decimal('ownership_percentage', 5, 2).nullable();
        table.timestamp('created_at').defaultTo(db.fn.now());
      });
      console.log('✅ Created erp_owners table.');
    } else {
      console.log('ℹ️ erp_owners table already exists.');
    }

    // 2. Create erp_equity_transactions table
    const hasTransactions = await db.schema.hasTable('erp_equity_transactions');
    if (!hasTransactions) {
      await db.schema.createTable('erp_equity_transactions', (table) => {
        table.increments('id').primary();
        table.string('owner_name').notNullable(); // Storing name directly for simplicity, or we can use ID if we want strict relations
        table.string('transaction_type').notNullable(); // Contribution, Withdrawal, Net Profit, Net Loss
        table.decimal('amount', 15, 2).notNullable();
        table.text('description').nullable();
        table.date('transaction_date').notNullable();
        table.timestamp('created_at').defaultTo(db.fn.now());
      });
      console.log('✅ Created erp_equity_transactions table.');
    } else {
      console.log('ℹ️ erp_equity_transactions table already exists.');
    }

    console.log('🎉 Setup complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error setting up schema:', err);
    process.exit(1);
  }
}

setup();
