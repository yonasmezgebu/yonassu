exports.up = async function (knex) {
  const dbName = knex.client.database();
  const tableExists = async (table) => {
    const row = await knex('information_schema.TABLES')
      .where({ TABLE_SCHEMA: dbName, TABLE_NAME: table })
      .first();
    return !!row;
  };

  if (!(await tableExists('procurement_requests'))) {
    await knex.schema.createTable('procurement_requests', (t) => {
      t.increments('id');
      t.string('pr_no', 30).notNullable().unique();
      t.string('drug_name', 255).notNullable();
      t.integer('quantity_requested').notNullable();
      t.string('unit_of_measure', 50).defaultTo('Each');
      t.decimal('estimated_unit_price', 15, 2);
      t.decimal('estimated_total', 15, 2);
      t.text('justification');
      t.integer('current_stock').defaultTo(0);
      t.integer('reorder_level').defaultTo(0);
      t.enum('urgency', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).defaultTo('MEDIUM');
      t.enum('status', [
        'DRAFT', 'PENDING_CEO_REVIEW', 'CEO_APPROVED', 'CEO_REJECTED',
        'IN_MARKET', 'TENDER_CREATED', 'FUND_REQUESTED', 'FUND_APPROVED',
        'PAYMENT_MADE', 'RECEIVED', 'CANCELLED'
      ]).defaultTo('DRAFT');
      t.enum('ceo_decision', ['PENDING', 'APPROVED', 'REJECTED']).defaultTo('PENDING');
      t.text('ceo_notes');
      t.integer('ceo_decided_by');
      t.timestamp('ceo_decided_at');
      t.integer('requested_by').notNullable();
      t.string('requested_by_name', 100);
      t.text('rejection_reason');
      t.text('notes');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  if (!(await tableExists('procurement_market_tasks'))) {
    await knex.schema.createTable('procurement_market_tasks', (t) => {
      t.increments('id');
      t.integer('procurement_request_id').unsigned().notNullable().references('id').inTable('procurement_requests');
      t.string('pr_no', 30).notNullable();
      t.string('drug_name', 255).notNullable();
      t.integer('quantity_needed').notNullable();
      t.text('market_info');
      t.enum('status', ['PENDING', 'IN_PROGRESS', 'COMPLETED']).defaultTo('PENDING');
      t.integer('assigned_by').notNullable();
      t.string('assigned_by_name', 100);
      t.integer('completed_by');
      t.string('completed_by_name', 100);
      t.timestamp('completed_at');
      t.text('notes');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  if (!(await tableExists('procurement_tenders'))) {
    await knex.schema.createTable('procurement_tenders', (t) => {
      t.increments('id');
      t.string('tender_no', 30).notNullable().unique();
      t.integer('procurement_request_id').unsigned().notNullable().references('id').inTable('procurement_requests');
      t.string('pr_no', 30).notNullable();
      t.string('drug_name', 255).notNullable();
      t.integer('quantity').notNullable();
      t.string('unit_of_measure', 50).defaultTo('Each');
      t.decimal('budget_estimate', 15, 2);
      t.integer('market_task_id').unsigned().references('id').inTable('procurement_market_tasks');
      t.enum('status', ['DRAFT', 'OPEN', 'CLOSED', 'AWARDED', 'CANCELLED']).defaultTo('DRAFT');
      t.date('opening_date');
      t.date('closing_date');
      t.integer('issued_by').notNullable();
      t.string('issued_by_name', 100);
      t.text('terms_and_conditions');
      t.text('notes');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  if (!(await tableExists('procurement_bids'))) {
    await knex.schema.createTable('procurement_bids', (t) => {
      t.increments('id');
      t.integer('tender_id').unsigned().notNullable().references('id').inTable('procurement_tenders');
      t.string('tender_no', 30).notNullable();
      t.integer('supplier_user_id').notNullable();
      t.string('supplier_name', 255).notNullable();
      t.string('supplier_contact', 100);
      t.decimal('unit_price', 15, 2).notNullable();
      t.decimal('total_amount', 15, 2).notNullable();
      t.integer('delivery_days');
      t.string('validity_period', 50);
      t.text('bid_document_path');
      t.enum('status', ['SUBMITTED', 'SHORTLISTED', 'AWARDED', 'REJECTED']).defaultTo('SUBMITTED');
      t.timestamp('submitted_at').defaultTo(knex.fn.now());
      t.text('notes');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  if (!(await tableExists('procurement_tender_decisions'))) {
    await knex.schema.createTable('procurement_tender_decisions', (t) => {
      t.increments('id');
      t.integer('tender_id').unsigned().notNullable().references('id').inTable('procurement_tenders');
      t.string('tender_no', 30).notNullable();
      t.integer('selected_bid_id').unsigned().references('id').inTable('procurement_bids');
      t.enum('decision', ['PENDING', 'APPROVED', 'REJECTED', 'RE_TENDER']).defaultTo('PENDING');
      t.text('decision_notes');
      t.integer('decided_by').notNullable();
      t.string('decided_by_name', 100);
      t.timestamp('decided_at');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  if (!(await tableExists('procurement_fund_requests'))) {
    await knex.schema.createTable('procurement_fund_requests', (t) => {
      t.increments('id');
      t.integer('tender_id').unsigned().notNullable().references('id').inTable('procurement_tenders');
      t.string('tender_no', 30).notNullable();
      t.integer('procurement_request_id').unsigned().notNullable();
      t.string('pr_no', 30).notNullable();
      t.decimal('total_amount', 15, 2).notNullable();
      t.enum('status', ['PENDING_CEO_APPROVAL', 'APPROVED', 'REJECTED']).defaultTo('PENDING_CEO_APPROVAL');
      t.enum('ceo_decision', ['PENDING', 'APPROVED', 'REJECTED']).defaultTo('PENDING');
      t.text('ceo_notes');
      t.integer('ceo_decided_by');
      t.timestamp('ceo_decided_at');
      t.integer('requested_by').notNullable();
      t.string('requested_by_name', 100);
      t.text('notes');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  if (!(await tableExists('procurement_payments'))) {
    await knex.schema.createTable('procurement_payments', (t) => {
      t.increments('id');
      t.string('payment_no', 30).notNullable().unique();
      t.integer('fund_request_id').unsigned().notNullable().references('id').inTable('procurement_fund_requests');
      t.string('pr_no', 30).notNullable();
      t.string('tender_no', 30).notNullable();
      t.integer('supplier_user_id');
      t.string('supplier_name', 255);
      t.decimal('amount', 15, 2).notNullable();
      t.enum('payment_method', ['BANK_TRANSFER', 'CASH', 'CHECK', 'TELEBIRR']).defaultTo('BANK_TRANSFER');
      t.enum('status', ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']).defaultTo('PENDING');
      t.string('transaction_ref', 100);
      t.date('payment_date');
      t.integer('paid_by').notNullable();
      t.string('paid_by_name', 100);
      t.timestamp('paid_at');
      t.text('notes');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  if (!(await tableExists('procurement_receipts'))) {
    await knex.schema.createTable('procurement_receipts', (t) => {
      t.increments('id');
      t.string('receipt_no', 30).notNullable().unique();
      t.integer('payment_id').unsigned().notNullable().references('id').inTable('procurement_payments');
      t.string('payment_no', 30).notNullable();
      t.integer('procurement_request_id').unsigned().notNullable();
      t.string('pr_no', 30).notNullable();
      t.string('drug_name', 255).notNullable();
      t.integer('quantity_ordered').notNullable();
      t.integer('quantity_received').notNullable();
      t.enum('condition', ['GOOD', 'DAMAGED', 'PARTIAL']).defaultTo('GOOD');
      t.text('discrepancy_notes');
      t.enum('status', ['PENDING', 'COMPLETED']).defaultTo('PENDING');
      t.integer('received_by').notNullable();
      t.string('received_by_name', 100);
      t.timestamp('received_at');
      t.text('notes');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('procurement_receipts');
  await knex.schema.dropTableIfExists('procurement_payments');
  await knex.schema.dropTableIfExists('procurement_fund_requests');
  await knex.schema.dropTableIfExists('procurement_tender_decisions');
  await knex.schema.dropTableIfExists('procurement_bids');
  await knex.schema.dropTableIfExists('procurement_tenders');
  await knex.schema.dropTableIfExists('procurement_market_tasks');
  await knex.schema.dropTableIfExists('procurement_requests');
};
