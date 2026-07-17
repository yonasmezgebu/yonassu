exports.up = async (knex) => {
  if (!(await knex.schema.hasTable('pharmacy_branches'))) {
    await knex.schema.createTable('pharmacy_branches', (t) => {
      t.increments('id').primary();
      t.string('name', 100).notNullable().unique();
      t.enu('status', ['ACTIVE', 'INACTIVE']).defaultTo('ACTIVE');
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('pharmacy_workers'))) {
    await knex.schema.createTable('pharmacy_workers', (t) => {
      t.increments('id').primary();
      t.string('name', 150).notNullable();
      t.integer('branch_id').unsigned().references('id').inTable('pharmacy_branches');
      t.boolean('post_permission').defaultTo(false);
      t.string('phone', 30);
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('pharmacy_sales'))) {
    await knex.schema.createTable('pharmacy_sales', (t) => {
      t.increments('id').primary();
      t.integer('branch_id').unsigned().references('id').inTable('pharmacy_branches');
      t.integer('worker_id').unsigned().references('id').inTable('pharmacy_workers');
      t.string('sale_type', 30).notNullable().comment('WALK-IN / ONLINE');
      t.string('recipient_name', 200);
      t.string('recipient_phone', 30);
      t.integer('total_products').defaultTo(0);
      t.decimal('total_amount', 12, 2).defaultTo(0);
      t.string('receipt_no', 50).unique();
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('pharmacy_sale_items'))) {
    await knex.schema.createTable('pharmacy_sale_items', (t) => {
      t.increments('id').primary();
      t.integer('sale_id').unsigned().references('id').inTable('pharmacy_sales');
      t.string('drug_name', 200);
      t.integer('quantity').defaultTo(1);
      t.decimal('unit_price', 12, 2).defaultTo(0);
      t.decimal('total_price', 12, 2).defaultTo(0);
    });
  }

  if (!(await knex.schema.hasTable('pharmacy_payments'))) {
    await knex.schema.createTable('pharmacy_payments', (t) => {
      t.increments('id').primary();
      t.integer('sale_id').unsigned().references('id').inTable('pharmacy_sales');
      t.enu('payment_method', ['CASH', 'BANK_TRANSFER', 'TELBIR']).notNullable();
      t.decimal('amount', 12, 2).defaultTo(0);
      t.string('recipient_name', 200);
      t.string('recipient_phone', 30);
      t.string('bank_name', 100);
      t.string('account_holder', 200);
      t.string('account_number', 100);
      t.string('telbir_number', 50);
      t.string('branch_name', 100);
      t.string('worker_name', 150);
      t.enu('status', ['PAID', 'CASHOUT']).defaultTo('PAID');
      t.string('receipt_no', 50);
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('pharmacy_sales_reports'))) {
    await knex.schema.createTable('pharmacy_sales_reports', (t) => {
      t.increments('id').primary();
      t.date('report_date').notNullable();
      t.integer('total_sales').defaultTo(0);
      t.decimal('total_amount', 12, 2).defaultTo(0);
      t.enu('status', ['PENDING', 'APPROVED', 'REJECTED']).defaultTo('PENDING');
      t.integer('submitted_by').references('id').inTable('users');
      t.timestamp('submitted_at').nullable();
      t.string('finance_decision', 30);
      t.text('finance_notes');
      t.timestamp('finance_decided_at').nullable();
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('pharmacy_report_branches'))) {
    await knex.schema.createTable('pharmacy_report_branches', (t) => {
      t.increments('id').primary();
      t.integer('report_id').unsigned().references('id').inTable('pharmacy_sales_reports');
      t.integer('branch_id').unsigned().references('id').inTable('pharmacy_branches');
      t.integer('total_sales').defaultTo(0);
      t.decimal('total_amount', 12, 2).defaultTo(0);
      t.integer('worker_count').defaultTo(0);
    });
  }

  if (!(await knex.schema.hasTable('pharmacy_report_payments'))) {
    await knex.schema.createTable('pharmacy_report_payments', (t) => {
      t.increments('id').primary();
      t.integer('report_id').unsigned().references('id').inTable('pharmacy_sales_reports');
      t.string('payment_type', 50);
      t.integer('count').defaultTo(0);
      t.decimal('total_amount', 12, 2).defaultTo(0);
    });
  }

  if (!(await knex.schema.hasTable('pharmacy_finance_records'))) {
    await knex.schema.createTable('pharmacy_finance_records', (t) => {
      t.increments('id').primary();
      t.integer('report_id').unsigned().references('id').inTable('pharmacy_sales_reports').unique();
      t.decimal('revenue', 12, 2).defaultTo(0);
      t.decimal('cogs', 12, 2).defaultTo(0);
      t.decimal('profit_loss', 12, 2).defaultTo(0);
      t.enu('result', ['PROFIT', 'LOSS']);
      t.boolean('income_recorded').defaultTo(false);
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('pharmacy_audit_trail'))) {
    await knex.schema.createTable('pharmacy_audit_trail', (t) => {
      t.increments('id').primary();
      t.integer('branch_id').unsigned().references('id').inTable('pharmacy_branches');
      t.integer('worker_id').unsigned().references('id').inTable('pharmacy_workers');
      t.string('action', 30).comment('PAID / CASHOUT');
      t.string('recipient', 200);
      t.decimal('amount', 12, 2);
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('pharmacy_expired_drugs'))) {
    await knex.schema.createTable('pharmacy_expired_drugs', (t) => {
      t.increments('id').primary();
      t.string('drug_name', 200);
      t.integer('quantity').defaultTo(0);
      t.date('expiry_date');
      t.string('location', 50).comment('Pharmacy / Store');
      t.string('action_required', 50).comment('Dispose / Return / Write-off');
      t.enu('status', ['PENDING', 'APPROVED', 'REJECTED']).defaultTo('PENDING');
      t.integer('requested_by').references('id').inTable('users');
      t.text('ceo_notes');
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('pharmacy_drug_hide_log'))) {
    await knex.schema.createTable('pharmacy_drug_hide_log', (t) => {
      t.increments('id').primary();
      t.integer('drug_id');
      t.string('drug_name', 200);
      t.text('reason');
      t.string('hide_type', 30).comment('TEMPORARY / PERMANENT / PUBLIC_ONLY');
      t.date('auto_show_at');
      t.boolean('notify_ceo').defaultTo(true);
      t.integer('hidden_by').references('id').inTable('users');
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('pharmacy_customer_queries'))) {
    await knex.schema.createTable('pharmacy_customer_queries', (t) => {
      t.increments('id').primary();
      t.string('drug_name', 200);
      t.string('channel', 30).comment('PHONE / IN_PERSON / ONLINE');
      t.string('response_status', 30).comment('AVAILABLE / LOW_STOCK / OUT_OF_STOCK');
      t.string('customer_name', 200);
      t.string('customer_phone', 30);
      t.boolean('notify_on_restock').defaultTo(false);
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('pharmacy_prescriptions'))) {
    await knex.schema.createTable('pharmacy_prescriptions', (t) => {
      t.increments('id').primary();
      t.integer('customer_id');
      t.string('customer_name', 200);
      t.string('customer_phone', 30);
      t.string('drug_name', 200);
      t.integer('quantity').defaultTo(0);
      t.text('prescription_file');
      t.string('source', 30).comment('ONLINE / PHYSICAL');
      t.string('intake_source', 50).comment('HOSPITAL / HEALTH_INSTITUTION / PRIVATE_DOCTOR');
      t.text('special_instructions');
      t.enu('status', ['PENDING', 'PREPARED', 'PICKED_UP']).defaultTo('PENDING');
      t.string('reference_no', 50).unique();
      t.string('branch_pickup', 100);
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('pharmacy_branch_toggle_log'))) {
    await knex.schema.createTable('pharmacy_branch_toggle_log', (t) => {
      t.increments('id').primary();
      t.integer('branch_id').unsigned().references('id').inTable('pharmacy_branches');
      t.enu('action', ['ACTIVE', 'INACTIVE']).notNullable();
      t.integer('toggled_by').references('id').inTable('users');
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('pharmacy_manager_requests'))) {
    await knex.schema.createTable('pharmacy_manager_requests', (t) => {
      t.increments('id').primary();
      t.string('drug_name', 200);
      t.string('request_type', 30).comment('QUANTITY / PRICE');
      t.decimal('current_value', 12, 2);
      t.decimal('requested_value', 12, 2);
      t.decimal('ceo_value', 12, 2);
      t.enu('status', ['PENDING', 'APPROVED', 'REJECTED']).defaultTo('PENDING');
      t.text('reason');
      t.integer('requested_by').references('id').inTable('users');
      t.timestamps(true, true);
    });
  }

  // Seed only if no branches exist yet
  const existingBranches = await knex('pharmacy_branches').count('id as cnt').first();
  if (!existingBranches || existingBranches.cnt == 0) {
    await knex('pharmacy_branches').insert([
      { name: 'Branch A', status: 'ACTIVE' },
      { name: 'Branch B', status: 'ACTIVE' },
      { name: 'Branch C', status: 'ACTIVE' },
    ]);

    await knex('pharmacy_workers').insert([
      { name: 'Worker 1', branch_id: 1, post_permission: true },
      { name: 'Worker 2', branch_id: 1, post_permission: false },
      { name: 'Worker 3', branch_id: 2, post_permission: true },
      { name: 'Worker 4', branch_id: 2, post_permission: false },
      { name: 'Worker 5', branch_id: 3, post_permission: true },
      { name: 'Worker 6', branch_id: 3, post_permission: false },
    ]);
  }
};

exports.down = async (knex) => {
  const tables = [
    'pharmacy_manager_requests', 'pharmacy_branch_toggle_log', 'pharmacy_prescriptions',
    'pharmacy_customer_queries', 'pharmacy_drug_hide_log', 'pharmacy_expired_drugs',
    'pharmacy_audit_trail', 'pharmacy_finance_records', 'pharmacy_report_payments',
    'pharmacy_report_branches', 'pharmacy_sales_reports', 'pharmacy_payments',
    'pharmacy_sale_items', 'pharmacy_sales', 'pharmacy_workers', 'pharmacy_branches',
  ];
  for (const t of tables) {
    if (await knex.schema.hasTable(t)) await knex.schema.dropTableIfExists(t);
  }
};
