exports.up = async function (knex) {
  // 1. Add min_level to store_inventory
  const hasStoreInventory = await knex.schema.hasTable('store_inventory');
  if (hasStoreInventory) {
    const hasMinLevel = await knex.schema.hasColumn('store_inventory', 'min_level');
    if (!hasMinLevel) {
      await knex.schema.table('store_inventory', (t) => {
        t.integer('min_level').notNullable().defaultTo(0);
      });
    }
  }

  // 2. purchase_requests
  if (!(await knex.schema.hasTable('purchase_requests'))) {
    await knex.schema.createTable('purchase_requests', (t) => {
      t.increments('id').primary();
      t.string('request_code').notNullable().unique();
      t.integer('drug_id').unsigned().notNullable().references('id').inTable('drugs').onDelete('CASCADE');
      t.enum('scenario', ['STORE_AND_PHARMACY_LOW', 'STORE_ONLY_LOW']).notNullable();
      t.integer('store_qty_at_request').notNullable();
      t.integer('store_min_level').notNullable();
      t.integer('pharmacy_qty_at_request').notNullable();
      t.integer('pharmacy_reorder_level').notNullable();
      t.integer('requested_qty').notNullable();
      t.enum('urgency', ['LOW', 'MEDIUM', 'HIGH']).defaultTo('MEDIUM');
      t.enum('status', ['PENDING_DECISION', 'APPROVED', 'REJECTED', 'WAIT']).defaultTo('PENDING_DECISION');
      t.integer('created_by').unsigned().notNullable();
      t.integer('decided_by').unsigned();
      t.enum('decision', ['APPROVE', 'REJECT', 'WAIT']);
      t.text('decision_reason');
      t.string('wait_document_url');
      t.text('wait_instructions');
      t.timestamps(true, true);
    });
  }

  // 3. market_tasks
  if (!(await knex.schema.hasTable('market_tasks'))) {
    await knex.schema.createTable('market_tasks', (t) => {
      t.increments('id').primary();
      t.integer('purchase_request_id').unsigned().notNullable().references('id').inTable('purchase_requests').onDelete('CASCADE');
      t.integer('assigned_to').unsigned();
      t.string('document_url');
      t.text('instructions');
      t.enum('status', ['IN_PROGRESS', 'READY_FOR_PURCHASE']).defaultTo('IN_PROGRESS');
      t.datetime('completed_at').nullable();
      t.timestamps(true, true);
    });
  }

  // 4. tenders
  if (!(await knex.schema.hasTable('tenders'))) {
    await knex.schema.createTable('tenders', (t) => {
      t.increments('id').primary();
      t.string('tender_code').notNullable().unique();
      t.integer('purchase_request_id').unsigned().notNullable().references('id').inTable('purchase_requests').onDelete('CASCADE');
      t.integer('drug_id').unsigned().notNullable().references('id').inTable('drugs').onDelete('CASCADE');
      t.integer('quantity').notNullable();
      t.datetime('closing_at').notNullable();
      t.text('terms');
      t.enum('status', ['OPEN', 'CLOSED', 'EXPIRED', 'AWARDED', 'CANCELLED']).defaultTo('OPEN');
      t.enum('delivery_type', ['VIA_STORE', 'DIRECT_TO_PHARMACY']).notNullable();
      t.integer('created_by').unsigned().notNullable();
      t.timestamps(true, true);
    });
  }

  // 5. bids
  if (!(await knex.schema.hasTable('bids'))) {
    await knex.schema.createTable('bids', (t) => {
      t.increments('id').primary();
      t.integer('tender_id').unsigned().notNullable().references('id').inTable('tenders').onDelete('CASCADE');
      t.integer('supplier_id').unsigned().notNullable(); // from users table
      t.decimal('unit_price', 12, 2).notNullable();
      t.decimal('total_cost', 15, 2).notNullable();
      t.boolean('is_valid').defaultTo(true);
      t.datetime('submitted_at').defaultTo(knex.fn.now());
      t.timestamps(true, true);
    });
  }

  // 6. fund_requests
  if (!(await knex.schema.hasTable('fund_requests'))) {
    await knex.schema.createTable('fund_requests', (t) => {
      t.increments('id').primary();
      t.string('fund_request_code').notNullable().unique();
      t.integer('created_by').unsigned().notNullable();
      t.enum('status', ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'READY_FOR_PAYMENT']).defaultTo('PENDING_APPROVAL');
      t.decimal('total_amount', 15, 2).defaultTo(0);
      t.integer('decided_by').unsigned();
      t.text('decision_reason');
      t.datetime('decided_at');
      t.timestamps(true, true);
    });
  }

  // 7. fund_request_items
  if (!(await knex.schema.hasTable('fund_request_items'))) {
    await knex.schema.createTable('fund_request_items', (t) => {
      t.increments('id').primary();
      t.integer('fund_request_id').unsigned().notNullable().references('id').inTable('fund_requests').onDelete('CASCADE');
      t.integer('tender_id').unsigned().notNullable().references('id').inTable('tenders').onDelete('CASCADE');
      t.integer('drug_id').unsigned().notNullable().references('id').inTable('drugs');
      t.integer('quantity').notNullable();
      t.decimal('unit_price', 12, 2).notNullable();
      t.decimal('line_total', 15, 2).notNullable();
    });
  }

  // 8. deliveries
  if (!(await knex.schema.hasTable('deliveries'))) {
    await knex.schema.createTable('deliveries', (t) => {
      t.increments('id').primary();
      t.integer('tender_id').unsigned().notNullable().references('id').inTable('tenders').onDelete('CASCADE');
      t.enum('delivery_type', ['VIA_STORE', 'DIRECT_TO_PHARMACY']).notNullable();
      t.integer('received_by').unsigned();
      t.datetime('received_at');
      t.enum('status', ['PENDING', 'RECEIVED', 'ISSUE_REPORTED']).defaultTo('PENDING');
      t.text('notes');
      t.timestamps(true, true);
    });
  }

  // 9. payments
  if (!(await knex.schema.hasTable('payments'))) {
    await knex.schema.createTable('payments', (t) => {
      t.increments('id').primary();
      t.integer('fund_request_id').unsigned().notNullable().references('id').inTable('fund_requests').onDelete('CASCADE');
      t.integer('supplier_id').unsigned().notNullable();
      t.decimal('amount', 15, 2).notNullable();
      t.integer('paid_by').unsigned().notNullable();
      t.datetime('paid_at').defaultTo(knex.fn.now());
      t.string('receipt_code').notNullable().unique();
      t.enum('status', ['PENDING', 'PAID']).defaultTo('PAID');
      t.timestamps(true, true);
      
      // Prevent double payment constraint
      t.unique(['fund_request_id', 'status']);
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('deliveries');
  await knex.schema.dropTableIfExists('fund_request_items');
  await knex.schema.dropTableIfExists('fund_requests');
  await knex.schema.dropTableIfExists('bids');
  await knex.schema.dropTableIfExists('tenders');
  await knex.schema.dropTableIfExists('market_tasks');
  await knex.schema.dropTableIfExists('purchase_requests');

  const hasStoreInventory = await knex.schema.hasTable('store_inventory');
  if (hasStoreInventory) {
    const hasMinLevel = await knex.schema.hasColumn('store_inventory', 'min_level');
    if (hasMinLevel) {
      await knex.schema.table('store_inventory', (t) => {
        t.dropColumn('min_level');
      });
    }
  }
};
