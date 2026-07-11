exports.up = async function (knex) {
  const dbName = knex.client.database();
  const tableExists = async (table) => {
    const row = await knex('information_schema.TABLES')
      .where({ TABLE_SCHEMA: dbName, TABLE_NAME: table })
      .first();
    return !!row;
  };

  // 1. public_fund_requests
  if (!(await tableExists('public_fund_requests'))) {
    await knex.schema.createTable('public_fund_requests', (t) => {
      t.increments('id').primary();
      t.string('request_code').notNullable().unique();
      t.enum('status', ['PENDING_CEO', 'APPROVED', 'REJECTED', 'READY_FOR_PAYMENT']).defaultTo('PENDING_CEO');
      t.decimal('total_amount', 15, 2).defaultTo(0);
      t.integer('created_by').unsigned().notNullable(); // Purchase Manager
      t.integer('decided_by').unsigned(); // CEO
      t.text('decision_reason');
      t.datetime('decided_at');
      t.boolean('ceo_read').defaultTo(false);
      t.boolean('finance_read').defaultTo(false);
      t.timestamps(true, true);
    });
  }

  // 2. public_fund_request_items
  if (!(await tableExists('public_fund_request_items'))) {
    await knex.schema.createTable('public_fund_request_items', (t) => {
      t.increments('id').primary();
      t.integer('fund_request_id').unsigned().notNullable().references('id').inTable('public_fund_requests').onDelete('CASCADE');
      t.integer('public_tender_id').unsigned().notNullable().references('id').inTable('public_tenders').onDelete('CASCADE');
      t.integer('public_bid_id').unsigned().notNullable().references('id').inTable('public_bids').onDelete('CASCADE');
      t.decimal('amount', 15, 2).notNullable();
    });
  }

  // 3. public_deliveries
  if (!(await tableExists('public_deliveries'))) {
    await knex.schema.createTable('public_deliveries', (t) => {
      t.increments('id').primary();
      t.integer('public_tender_id').unsigned().notNullable().references('id').inTable('public_tenders').onDelete('CASCADE');
      t.enum('status', ['PENDING', 'RECEIVED', 'ISSUE_REPORTED']).defaultTo('PENDING');
      t.integer('received_by').unsigned(); // Store keeper
      t.datetime('received_at');
      t.text('notes');
      t.boolean('store_read').defaultTo(false);
      t.boolean('purchase_read').defaultTo(false);
      t.timestamps(true, true);
    });
  }

  // 4. public_payments
  if (!(await tableExists('public_payments'))) {
    await knex.schema.createTable('public_payments', (t) => {
      t.increments('id').primary();
      t.integer('fund_request_id').unsigned().notNullable().references('id').inTable('public_fund_requests').onDelete('CASCADE');
      t.decimal('amount', 15, 2).notNullable();
      t.enum('status', ['PENDING', 'PAID']).defaultTo('PENDING');
      t.integer('paid_by').unsigned(); // Finance
      t.datetime('paid_at');
      t.string('receipt_code').unique();
      t.timestamps(true, true);
      
      // Prevent double payment constraint
      t.unique(['fund_request_id', 'status']);
    });
  }

  // Add delivery and payment tracking directly to tenders to simplify some queries
  const hasPublicTenders = await tableExists('public_tenders');
  if (hasPublicTenders) {
    const hasDeliveryStatus = await knex.schema.hasColumn('public_tenders', 'delivery_status');
    if (!hasDeliveryStatus) {
      await knex.schema.alterTable('public_tenders', (t) => {
        t.enum('delivery_status', ['PENDING', 'RECEIVED']).defaultTo('PENDING');
        t.enum('payment_status', ['PENDING', 'PAID']).defaultTo('PENDING');
      });
    }
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('public_payments');
  await knex.schema.dropTableIfExists('public_deliveries');
  await knex.schema.dropTableIfExists('public_fund_request_items');
  await knex.schema.dropTableIfExists('public_fund_requests');

  const hasPublicTenders = await knex.schema.hasTable('public_tenders');
  if (hasPublicTenders) {
    const hasDeliveryStatus = await knex.schema.hasColumn('public_tenders', 'delivery_status');
    if (hasDeliveryStatus) {
      await knex.schema.alterTable('public_tenders', (t) => {
        t.dropColumn('delivery_status');
        t.dropColumn('payment_status');
      });
    }
  }
};
